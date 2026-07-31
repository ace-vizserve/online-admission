// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  buildEnrolmentApplicationPayload,
  buildStudentDocumentUpdatePayload,
  configForCategory,
  incompleteApplicationSections,
  isApplicationIncomplete,
  mapApplicationToFormState,
  processParentGuardian,
} from "../_shared/enrolment-payload.ts";
import { buildRecoveryEmailHtml } from "../_shared/recovery-email.ts";

const RESEND_FROM = "team@enrol.hfse.edu.sg";
const RESEND_SUBJECT = "Action Required: Complete Your Enrollment Information";

/**
 * Sends the recovery link email via Resend's HTTP API directly — the existing `resend-email`
 * edge function's source isn't in this repo (deployed some other way), so this sends
 * independently rather than extending a template system we can't see. Never throws — a failed
 * send shouldn't fail link generation, since the token is already created and usable; the
 * caller surfaces the failure to the admin instead so they can copy/send the link manually.
 */
async function sendRecoveryEmail(to: string[], url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM,
        to,
        subject: RESEND_SUBJECT,
        html: buildRecoveryEmailHtml(url),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend API returned ${res.status}: ${body}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

const ADMIN_EMAILS = [
  "amier.vizbytes@vizserve.hfse.edu.sg",
  "ace.guevarra@vizserve.hfse.edu.sg",
  "admin@parent.portal.com",
];
const allowedOrigins = ["https://enrol.hfse.edu.sg", "http://localhost:5173"];

// Mirrors src/config/academic-years.ts — edge functions can't import from `src/`.
const BACKEND_ACADEMIC_YEARS = ["ay2027", "ay2026", "ay2025"];

const BUCKET = "parent-portal";
const TOKEN_TTL_DAYS = 7;
const VALID_CATEGORIES = ["New", "Current", "VizSchool New", "VizSchool Current"];
const VALID_SECTIONS = ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"];
const ALL_SECTIONS = [...VALID_SECTIONS];

function academicYearFromEnroleeNumber(enroleeNumber: string): string | null {
  const match = enroleeNumber.match(/E(\d{2})/);
  if (!match) return null;
  return BACKEND_ACADEMIC_YEARS.find((ay) => ay.slice(-2) === match[1]) ?? null;
}

type TableState = {
  applications: Record<string, any> | null;
  documents: Record<string, any> | null;
  status: Record<string, any> | null;
};

async function detect(supabaseAdmin: any, academicYear: string, enroleeNumber: string): Promise<TableState> {
  const [appRes, docRes, statusRes] = await Promise.all([
    supabaseAdmin
      .from(`${academicYear}_enrolment_applications`)
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .maybeSingle(),
    supabaseAdmin
      .from(`${academicYear}_enrolment_documents`)
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .maybeSingle(),
    supabaseAdmin.from(`${academicYear}_enrolment_status`).select("*").eq("enroleeNumber", enroleeNumber).maybeSingle(),
  ]);

  if (appRes.error) throw new Error(`applications lookup failed: ${appRes.error.message}`);
  if (docRes.error) throw new Error(`documents lookup failed: ${docRes.error.message}`);
  if (statusRes.error) throw new Error(`status lookup failed: ${statusRes.error.message}`);

  return { applications: appRes.data, documents: docRes.data, status: statusRes.data };
}

/**
 * "Missing" means "the parent needs to give us something here" — either the row is entirely
 * absent, or (for applications specifically) it exists but is missing required fields, i.e.
 * the form was started but never finished.
 */
function missingTables(state: TableState): string[] {
  const missing: string[] = [];
  if (!state.applications || isApplicationIncomplete(state.applications)) missing.push("applications");
  if (!state.documents) missing.push("documents");
  if (!state.status) missing.push("status");
  return missing;
}

/**
 * Which recovery-page tabs actually need the parent's input, used as the admin page's
 * default checkbox selection (the admin can still override before generating the link).
 */
function defaultSections(state: TableState): string[] {
  if (!state.applications) return ALL_SECTIONS;
  const sections = incompleteApplicationSections(state.applications);
  if (!state.documents) sections.push("uploads");
  return sections.length ? sections : ALL_SECTIONS;
}

function deriveCategory(state: TableState): string | null {
  const value = state.applications?.category ?? state.status?.enroleeType ?? null;
  return VALID_CATEGORIES.includes(value) ? value : null;
}

function deriveStudentName(state: TableState): string | null {
  return state.applications?.enroleeFullName ?? state.status?.enroleeName ?? null;
}

function deriveStudentNumber(state: TableState): string | null {
  return state.applications?.studentNumber ?? state.documents?.studentNumber ?? null;
}

function emailsFromRow(row: Record<string, any> | null | undefined): string | null {
  if (!row) return null;
  const emails = [row.fatherEmail, row.motherEmail, row.guardianEmail].filter(
    (email): email is string => typeof email === "string" && email.trim().length > 0,
  );
  return emails.length ? emails.join(", ") : null;
}

/**
 * Whichever parent emails are already on file for this student, for the admin page to prefill
 * its recipient field with — never sent anywhere without the admin seeing/confirming it first.
 * Tries the current year's applications row first; when that doesn't exist (the case a
 * recovery link is usually needed for), falls back to searching every other configured
 * academic year's applications table by `studentNumber` (stable across years, unlike
 * `enroleeNumber`) for the same student's most recently on-file email — a "Current" (re-
 * enrolling) student almost always has one. Returns `null` only when no email can be found
 * anywhere, at which point the admin types it in manually.
 */
async function findKnownEmails(supabaseAdmin: any, state: TableState, currentAcademicYear: string): Promise<string | null> {
  const currentEmails = emailsFromRow(state.applications);
  if (currentEmails) return currentEmails;

  const studentNumber = deriveStudentNumber(state);
  if (!studentNumber) return null;

  for (const ay of BACKEND_ACADEMIC_YEARS) {
    if (ay === currentAcademicYear) continue;

    const { data, error } = await supabaseAdmin
      .from(`${ay}_enrolment_applications`)
      .select("fatherEmail, motherEmail, guardianEmail")
      .eq("studentNumber", studentNumber)
      .maybeSingle();

    // Best-effort: a lookup failure on one year (e.g. the table doesn't exist for a very old
    // year) shouldn't fail the whole check — just try the next year.
    if (error) continue;

    const emails = emailsFromRow(data);
    if (emails) return emails;
  }

  return null;
}

function sanitizeFilename(filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || "file";
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  const CORS = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://enrol.hfse.edu.sg",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;

    const PUBLIC_ACTIONS = ["get", "sign-upload", "submit"];

    if (!PUBLIC_ACTIONS.includes(action)) {
      // Admin actions ("check", "generate") require an authenticated admin caller.
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ error: "Unauthorized" }, 401);
      const bearerToken = authHeader.replace("Bearer ", "");
      const {
        data: { user: caller },
        error: authError,
      } = await supabaseAdmin.auth.getUser(bearerToken);
      if (authError || !caller) return json({ error: "Unauthorized" }, 401);
      if (!ADMIN_EMAILS.includes(caller.email ?? "")) return json({ error: "Forbidden" }, 403);
    }

    // ── check ──────────────────────────────────────────────────────────────────
    if (action === "check") {
      const { enroleeNumber } = body;
      if (!enroleeNumber || typeof enroleeNumber !== "string") {
        return json({ error: "enroleeNumber is required" }, 400);
      }

      const academicYear = academicYearFromEnroleeNumber(enroleeNumber);
      if (!academicYear) return json({ error: `Could not determine academic year for "${enroleeNumber}"` }, 400);

      const state = await detect(supabaseAdmin, academicYear, enroleeNumber);
      const missing = missingTables(state);

      if (missing.length === 0) {
        return json({ complete: true, academicYear, enroleeNumber });
      }

      const category = deriveCategory(state);
      if (!category) {
        return json(
          { error: "Could not determine the application category (New/Current/VizSchool) from the existing rows." },
          422,
        );
      }

      return json({
        academicYear,
        enroleeNumber,
        studentNumber: deriveStudentNumber(state),
        category,
        studentName: deriveStudentName(state),
        present: {
          applications: Boolean(state.applications),
          documents: Boolean(state.documents),
          status: Boolean(state.status),
        },
        // `present.applications === true` alongside `applicationsIncomplete === true` means
        // the row exists but is missing required fields — an update, not an insert.
        applicationsIncomplete: Boolean(state.applications) && isApplicationIncomplete(state.applications),
        missing,
        // Suggested tab selection for the "generate" step — the admin can override before
        // sending the link.
        suggestedSections: defaultSections(state),
        // Prefill for the admin's recipient-email field on the "generate" step — never sent
        // anywhere without the admin seeing/confirming it. Falls back to a cross-year lookup
        // by studentNumber when the current year's applications row has no email on file.
        knownEmails: await findKnownEmails(supabaseAdmin, state, academicYear),
      });
    }

    // ── generate ───────────────────────────────────────────────────────────────
    if (action === "generate") {
      const { enroleeNumber, sections, recipientEmails } = body;
      if (!enroleeNumber || typeof enroleeNumber !== "string") {
        return json({ error: "enroleeNumber is required" }, 400);
      }

      const recipients: string[] =
        typeof recipientEmails === "string"
          ? recipientEmails
              .split(",")
              .map((e: string) => e.trim())
              .filter((e: string) => e.length > 0)
          : [];

      if (sections !== undefined) {
        if (!Array.isArray(sections) || sections.length === 0 || !sections.every((s) => VALID_SECTIONS.includes(s))) {
          return json({ error: `sections must be a non-empty subset of ${VALID_SECTIONS.join(", ")}` }, 400);
        }
      }

      const academicYear = academicYearFromEnroleeNumber(enroleeNumber);
      if (!academicYear) return json({ error: `Could not determine academic year for "${enroleeNumber}"` }, 400);

      const state = await detect(supabaseAdmin, academicYear, enroleeNumber);
      const missing = missingTables(state);

      if (missing.length === 0) {
        return json({ error: "Nothing to recover — all three tables already have a row." }, 409);
      }

      // When `_applications` doesn't exist at all yet, the link has to insert a full row —
      // narrowing to a subset of tabs would insert one with entire sections blank. Only a
      // row that already exists (an update, not an insert) can be safely scoped down.
      const selectedSections: string[] = !state.applications ? ALL_SECTIONS : (sections ?? defaultSections(state));

      const category = deriveCategory(state);
      if (!category) {
        return json(
          { error: "Could not determine the application category (New/Current/VizSchool) from the existing rows." },
          422,
        );
      }

      const {
        data: { user: caller },
      } = await supabaseAdmin.auth.getUser(req.headers.get("Authorization")!.replace("Bearer ", ""));

      const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { data: tokenRow, error: insertError } = await supabaseAdmin
        .from("enrolment_recovery_tokens")
        .insert({
          academic_year: academicYear,
          enrolee_number: enroleeNumber,
          student_number: deriveStudentNumber(state),
          student_name: deriveStudentName(state),
          category,
          missing_tables: missing,
          sections: selectedSections,
          created_by: caller?.email ?? "unknown",
          expires_at: expiresAt,
        })
        .select("token")
        .single();

      if (insertError) return json({ error: insertError.message }, 500);

      const baseUrl = allowedOrigins.includes(origin) ? origin : "https://enrol.hfse.edu.sg";
      const url = `${baseUrl}/complete-enrolment/${tokenRow.token}`;

      let emailSent = false;
      let emailError: string | undefined;

      if (recipients.length > 0) {
        const sendResult = await sendRecoveryEmail(recipients, url);
        if (sendResult.ok) {
          emailSent = true;
          await supabaseAdmin
            .from("enrolment_recovery_tokens")
            .update({ notified_email: recipients.join(", "), notified_at: new Date().toISOString() })
            .eq("token", tokenRow.token);
        } else {
          // The token is already created and usable — a failed send shouldn't block that.
          // The admin sees emailError and can copy the link to send manually.
          emailError = sendResult.error;
        }
      }

      return json({
        token: tokenRow.token,
        url,
        missing,
        sections: selectedSections,
        studentName: deriveStudentName(state),
        category,
        emailSent,
        ...(emailError ? { emailError } : {}),
      });
    }

    // ── list ───────────────────────────────────────────────────────────────────
    if (action === "list") {
      const { data, error } = await supabaseAdmin
        .from("enrolment_recovery_tokens")
        .select(
          "token, academic_year, enrolee_number, student_name, category, created_by, created_at, expires_at, used_at, notified_email, notified_at",
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return json({ error: error.message }, 500);

      const baseUrl = allowedOrigins.includes(origin) ? origin : "https://enrol.hfse.edu.sg";
      const tokens = (data ?? []).map((row: any) => ({
        ...row,
        url: `${baseUrl}/complete-enrolment/${row.token}`,
      }));

      return json({ tokens });
    }

    // ── token validation shared by the public actions ───────────────────────────
    async function loadValidToken(token: string) {
      if (!token || typeof token !== "string") return { error: json({ error: "A token is required" }, 400) };

      const { data: tokenRow, error } = await supabaseAdmin
        .from("enrolment_recovery_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error) return { error: json({ error: error.message }, 500) };
      if (!tokenRow) return { error: json({ error: "Invalid link" }, 404) };
      if (tokenRow.used_at) return { error: json({ error: "This link has already been used." }, 410) };
      if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
        return { error: json({ error: "This link has expired." }, 410) };
      }

      return { tokenRow };
    }

    // ── get ────────────────────────────────────────────────────────────────────
    if (action === "get") {
      const { token } = body;
      const loaded = await loadValidToken(token);
      if (loaded.error) return loaded.error;
      const tokenRow = loaded.tokenRow;

      const state = await detect(supabaseAdmin, tokenRow.academic_year, tokenRow.enrolee_number);
      const missing = missingTables(state);

      if (missing.length === 0) {
        return json({ complete: true });
      }

      return json({
        enroleeNumber: tokenRow.enrolee_number,
        academicYear: tokenRow.academic_year,
        category: tokenRow.category,
        studentName: deriveStudentName(state),
        missing,
        sections: tokenRow.sections?.length ? tokenRow.sections : ALL_SECTIONS,
        existingData: state.applications ? mapApplicationToFormState(state.applications, state.documents) : null,
      });
    }

    // ── sign-upload ────────────────────────────────────────────────────────────
    if (action === "sign-upload") {
      const { token, field, filename } = body;
      const loaded = await loadValidToken(token);
      if (loaded.error) return loaded.error;
      const tokenRow = loaded.tokenRow;

      if (!field || typeof field !== "string" || !filename || typeof filename !== "string") {
        return json({ error: "field and filename are required" }, 400);
      }

      const path = `${tokenRow.academic_year}/documents/${tokenRow.enrolee_number}/${field}-${Date.now()}-${sanitizeFilename(
        filename,
      )}`;

      const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error) return json({ error: error.message }, 500);

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

      return json({ path, token: data.token, signedUrl: data.signedUrl, publicUrl });
    }

    // ── submit ─────────────────────────────────────────────────────────────────
    if (action === "submit") {
      const { token, formState } = body;
      const loaded = await loadValidToken(token);
      if (loaded.error) return loaded.error;
      const tokenRow = loaded.tokenRow;

      const academicYear = tokenRow.academic_year as string;
      const enroleeNumber = tokenRow.enrolee_number as string;
      const category = tokenRow.category as string;

      const state = await detect(supabaseAdmin, academicYear, enroleeNumber);
      const missing = missingTables(state);

      if (missing.length === 0) {
        await supabaseAdmin
          .from("enrolment_recovery_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("token", token);
        return json({ ok: true, alreadyComplete: true });
      }

      const studentNumber = tokenRow.student_number as string | null;
      if (!studentNumber) {
        return json({ error: "No student number on record for this enrolee — cannot recover automatically." }, 422);
      }

      const config = configForCategory(category as any, { existingStudentNumber: studentNumber });
      const built = buildEnrolmentApplicationPayload(formState, config);

      const applicationPayload = {
        ...built.applicationInsertPayload,
        enroleeNumber,
        studentNumber,
      };

      if (state.applications) {
        const { error } = await supabaseAdmin
          .from(`${academicYear}_enrolment_applications`)
          .update(applicationPayload)
          .eq("enroleeNumber", enroleeNumber);
        if (error) return json({ error: `Updating applications failed: ${error.message}` }, 500);
      } else {
        const { error } = await supabaseAdmin.from(`${academicYear}_enrolment_applications`).insert(applicationPayload);
        if (error) return json({ error: `Inserting applications failed: ${error.message}` }, 500);
      }

      const documentUpdatePayload = buildStudentDocumentUpdatePayload(built.studentDocFields, built.studentToFollowDocs);

      if (state.documents) {
        const { error } = await supabaseAdmin
          .from(`${academicYear}_enrolment_documents`)
          .update(documentUpdatePayload)
          .eq("enroleeNumber", enroleeNumber);
        if (error) return json({ error: `Updating documents failed: ${error.message}` }, 500);
      } else {
        const { error } = await supabaseAdmin.from(`${academicYear}_enrolment_documents`).insert({
          studentNumber,
          enroleeNumber,
          ...documentUpdatePayload,
        });
        if (error) return json({ error: `Inserting documents failed: ${error.message}` }, 500);
      }

      for (const role of ["mother", "father", "guardian"] as const) {
        const roleDocuments = Object.fromEntries(
          Object.entries(built.parentGuardianUploadRequirements).filter(([key]) => key.includes(role)),
        );
        const pgError = await processParentGuardian(supabaseAdmin, {
          role,
          documents: roleDocuments,
          toFollowDocs: built.parentGuardianToFollowDocs,
          academicYear,
          studentNumber,
          enroleeNumber,
        });
        if (pgError) return json({ error: `Updating ${role} documents failed: ${pgError}` }, 500);
      }

      if (!state.status) {
        const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Singapore" });
        const { error } = await supabaseAdmin.from(`${academicYear}_enrolment_status`).insert({
          levelApplied: built.levelApplied,
          enroleeNumber,
          enrolmentDate: today,
          enroleeName: built.names.enroleeFullName,
          enroleeType: category,
          applicationStatus: "Submitted",
        });
        if (error) return json({ error: `Inserting status failed: ${error.message}` }, 500);
      }

      await supabaseAdmin
        .from("enrolment_recovery_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      return json({ ok: true, enroleeNumber, studentNumber });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
