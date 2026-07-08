import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ADMIN_EMAILS = ["amier.vizbytes@vizserve.hfse.edu.sg", "ace.guevarra@vizserve.hfse.edu.sg"];

const allowedOrigins = ["https://enrol.hfse.edu.sg", "http://localhost:5173"];

const BUCKET = "parent-portal";

const DOC_URL_FIELDS = [
  "passport",
  "birthCert",
  "pass",
  "educCert",
  "motherPassport",
  "motherPass",
  "fatherPassport",
  "fatherPass",
  "idPicture",
  "form12",
  "medical",
  "uploadFormDocument",
  "icaPhoto",
  "financialSupportDocs",
  "vaccinationInformation",
  "guardianPassport",
  "guardianPass",
];

// URL fields in *_enrolment_applications that may contain storage paths
const APP_URL_FIELDS = ["enroleePhoto"];

// Auto-generated columns to strip before re-inserting into the target table
const STRIP_FIELDS = new Set(["id", "idx", "created_at"]);

function storagePath(url: string): string | null {
  const marker = `/parent-portal/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

// Replace all occurrences of /${sourceAY}/ with /${targetAY}/ in a URL string
function remapUrl(url: string, sourceAY: string, targetAY: string): string {
  return url.replaceAll(`/${sourceAY}/`, `/${targetAY}/`);
}

function remapUrlFields(
  // deno-lint-ignore no-explicit-any
  record: Record<string, any>,
  fields: string[],
  sourceAY: string,
  targetAY: string,
  // deno-lint-ignore no-explicit-any
): Record<string, any> {
  const result = { ...record };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = remapUrl(result[field], sourceAY, targetAY);
    }
  }
  return result;
}

// deno-lint-ignore no-explicit-any
function stripAutoFields(record: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(record).filter(([k]) => !STRIP_FIELDS.has(k)));
}

// ── moveOne ───────────────────────────────────────────────────────────────────
// Moves a single student from sourceAY to targetAY. Returns ok:true with new
// numbers on success, ok:false with an error string on failure.
async function moveOne(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  sourceAY: string,
  targetAY: string,
  enroleeNumber: string,
): Promise<{ ok: true; newEnroleeNumber: string; newStudentNumber: string } | { ok: false; error: string }> {
  // 1. Fetch all source records
  const [appRes, docRes, statusRes] = await Promise.all([
    supabaseAdmin.from(`${sourceAY}_enrolment_applications`).select("*").eq("enroleeNumber", enroleeNumber).single(),
    supabaseAdmin.from(`${sourceAY}_enrolment_documents`).select("*").eq("enroleeNumber", enroleeNumber).maybeSingle(),
    supabaseAdmin.from(`${sourceAY}_enrolment_status`).select("*").eq("enroleeNumber", enroleeNumber).maybeSingle(),
  ]);

  if (appRes.error) {
    return { ok: false, error: `Application not found: ${appRes.error.message}` };
  }

  const app = appRes.data;
  const doc = docRes.data; // null if no documents row exists
  const status = statusRes.data; // null if no status row exists

  // 2. Compute the next sequential id in the target AY table → derive new numbers
  const { data: maxRow, error: maxErr } = await supabaseAdmin
    .from(`${targetAY}_enrolment_applications`)
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxErr) return { ok: false, error: `Could not query target AY: ${maxErr.message}` };

  const nextId = (maxRow?.id ?? 0) + 1;
  const yySuffix = targetAY.slice(-2); // "27" from "ay2027"
  const newEnroleeNumber = `E${yySuffix}${String(nextId).padStart(4, "0")}`;
  // Preserve the student number prefix (H = HFSE-IS, V = VizSchool)
  const studentPrefix =
    typeof app.studentNumber === "string" && app.studentNumber.length > 0 ? app.studentNumber[0] : "H";
  const newStudentNumber = `${studentPrefix}${yySuffix}${String(nextId).padStart(4, "0")}`;

  // 3. Build and insert into target tables
  // Applications
  const newApp = remapUrlFields(
    { ...stripAutoFields(app), enroleeNumber: newEnroleeNumber, studentNumber: newStudentNumber },
    APP_URL_FIELDS,
    sourceAY,
    targetAY,
  );
  const { error: insertAppErr } = await supabaseAdmin.from(`${targetAY}_enrolment_applications`).insert(newApp);
  if (insertAppErr) {
    return { ok: false, error: `Insert application failed: ${insertAppErr.message}` };
  }

  // Documents
  if (doc) {
    const newDoc = remapUrlFields(
      { ...stripAutoFields(doc), enroleeNumber: newEnroleeNumber },
      DOC_URL_FIELDS,
      sourceAY,
      targetAY,
    );
    const { error: insertDocErr } = await supabaseAdmin.from(`${targetAY}_enrolment_documents`).insert(newDoc);
    if (insertDocErr) {
      return { ok: false, error: `Insert documents failed: ${insertDocErr.message}` };
    }
  }

  // Status
  if (status) {
    const newStatus = { ...stripAutoFields(status), enroleeNumber: newEnroleeNumber };
    const { error: insertStatusErr } = await supabaseAdmin.from(`${targetAY}_enrolment_status`).insert(newStatus);
    if (insertStatusErr) {
      return { ok: false, error: `Insert status failed: ${insertStatusErr.message}` };
    }
  }

  // 4. Collect all unique storage paths from source records
  const rawUrls: string[] = [];
  for (const field of APP_URL_FIELDS) {
    if (app[field] && typeof app[field] === "string") rawUrls.push(app[field]);
  }
  if (doc) {
    for (const field of DOC_URL_FIELDS) {
      if (doc[field] && typeof doc[field] === "string") rawUrls.push(doc[field]);
    }
  }
  const sourcePaths = [...new Set(rawUrls.map((u) => storagePath(u)).filter((p): p is string => p !== null))];

  // 5. Copy files to target AY directory
  const copyErrors: string[] = [];
  for (const fromPath of sourcePaths) {
    const toPath = fromPath.replace(`${sourceAY}/`, `${targetAY}/`);
    const { error: copyErr } = await supabaseAdmin.storage.from(BUCKET).copy(fromPath, toPath);
    if (copyErr) copyErrors.push(`${fromPath}: ${copyErr.message}`);
  }
  if (copyErrors.length > 0) {
    return { ok: false, error: `Storage copy failed — ${copyErrors.join("; ")}` };
  }

  // 6. Delete source DB records (documents + status in parallel, then applications)
  await Promise.all([
    doc
      ? supabaseAdmin.from(`${sourceAY}_enrolment_documents`).delete().eq("enroleeNumber", enroleeNumber)
      : Promise.resolve(),
    status
      ? supabaseAdmin.from(`${sourceAY}_enrolment_status`).delete().eq("enroleeNumber", enroleeNumber)
      : Promise.resolve(),
  ]);
  await supabaseAdmin.from(`${sourceAY}_enrolment_applications`).delete().eq("enroleeNumber", enroleeNumber);

  // 7. Delete source storage files
  if (sourcePaths.length > 0) {
    await supabaseAdmin.storage.from(BUCKET).remove(sourcePaths);
  }

  return { ok: true, newEnroleeNumber, newStudentNumber };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";

  const CORS = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : "https://enrol.hfse.edu.sg",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // SUPABASE_SECRET_KEYS is a JSON object keyed by API-key name
    const secretKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);
    if (!ADMIN_EMAILS.includes(user.email ?? "")) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { action, sourceAY, targetAY, enroleeNumber, enroleeNumbers } = body;

    // ── list-students ──────────────────────────────────────────────────────────
    if (action === "list-students") {
      if (!sourceAY || typeof sourceAY !== "string") {
        return json({ error: "sourceAY is required" }, 400);
      }
      const { data, error } = await supabaseAdmin
        .from(`${sourceAY}_enrolment_applications`)
        .select("enroleeNumber, firstName, lastName, middleName, levelApplied, studentNumber")
        .not("enroleeNumber", "is", null)
        .order("lastName", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ students: data });
    }

    // ── move (single) ──────────────────────────────────────────────────────────
    if (action === "move") {
      if (!sourceAY || !targetAY || !enroleeNumber) {
        return json({ error: "sourceAY, targetAY, and enroleeNumber are required" }, 400);
      }
      if (sourceAY === targetAY) {
        return json({ error: "Source and target academic year must differ" }, 400);
      }
      const result = await moveOne(supabaseAdmin, sourceAY, targetAY, enroleeNumber);
      if (!result.ok) return json({ error: result.error }, 500);
      return json({ newEnroleeNumber: result.newEnroleeNumber, newStudentNumber: result.newStudentNumber });
    }

    // ── move-bulk ──────────────────────────────────────────────────────────────
    if (action === "move-bulk") {
      if (!sourceAY || !targetAY || !Array.isArray(enroleeNumbers) || enroleeNumbers.length === 0) {
        return json({ error: "sourceAY, targetAY, and a non-empty enroleeNumbers array are required" }, 400);
      }
      if (sourceAY === targetAY) {
        return json({ error: "Source and target academic year must differ" }, 400);
      }

      // Sequential moves — concurrent would collide on MAX(id)+1 numbering
      const results: Array<{
        enroleeNumber: string;
        ok: boolean;
        newEnroleeNumber?: string;
        newStudentNumber?: string;
        error?: string;
      }> = [];

      for (const num of enroleeNumbers) {
        const result = await moveOne(supabaseAdmin, sourceAY, targetAY, num);
        if (result.ok) {
          results.push({
            enroleeNumber: num,
            ok: true,
            newEnroleeNumber: result.newEnroleeNumber,
            newStudentNumber: result.newStudentNumber,
          });
        } else {
          results.push({ enroleeNumber: num, ok: false, error: result.error });
        }
      }

      const moved = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok).length;
      return json({ results, moved, failed });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
