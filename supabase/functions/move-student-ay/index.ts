import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAILS = ["amier.vizbytes@vizserve.hfse.edu.sg", "ace.guevarra@vizserve.hfse.edu.sg"];
const CORS = {
  "Access-Control-Allow-Origin": "https://enrol.hfse.edu.sg",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const BUCKET = "parent-portal";

// URL fields in *_enrolment_documents that may contain storage paths
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);
    if (!ADMIN_EMAILS.includes(user.email ?? "")) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { action, sourceAY, targetAY, enroleeNumber } = body;

    // ── list-students ──────────────────────────────────────────────────────────
    if (action === "list-students") {
      if (!sourceAY || typeof sourceAY !== "string") {
        return json({ error: "sourceAY is required" }, 400);
      }
      const { data, error } = await supabaseAdmin
        .from(`${sourceAY}_enrolment_applications`)
        .select("enroleeNumber, firstName, lastName, middleName, levelApplied, studentNumber")
        .order("lastName", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ students: data });
    }

    // ── move ───────────────────────────────────────────────────────────────────
    if (action === "move") {
      if (!sourceAY || !targetAY || !enroleeNumber) {
        return json({ error: "sourceAY, targetAY, and enroleeNumber are required" }, 400);
      }
      if (sourceAY === targetAY) {
        return json({ error: "Source and target academic year must differ" }, 400);
      }

      // 1. Fetch all source records
      const [appRes, docRes, statusRes] = await Promise.all([
        supabaseAdmin
          .from(`${sourceAY}_enrolment_applications`)
          .select("*")
          .eq("enroleeNumber", enroleeNumber)
          .single(),
        supabaseAdmin
          .from(`${sourceAY}_enrolment_documents`)
          .select("*")
          .eq("enroleeNumber", enroleeNumber)
          .maybeSingle(),
        supabaseAdmin
          .from(`${sourceAY}_enrolment_status`)
          .select("*")
          .eq("enroleeNumber", enroleeNumber)
          .maybeSingle(),
      ]);

      if (appRes.error) {
        return json({ error: `Application not found: ${appRes.error.message}` }, 404);
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
      if (maxErr) return json({ error: `Could not query target AY: ${maxErr.message}` }, 500);
      const nextId = (maxRow?.id ?? 0) + 1;
      const yySuffix = targetAY.slice(-2); // "27" from "ay2027"
      const newEnroleeNumber = `E${yySuffix}${String(nextId).padStart(4, "0")}`;
      const newStudentNumber = `H${yySuffix}${String(nextId).padStart(4, "0")}`;

      // 3. Build and insert into target tables
      // Applications
      const newApp = remapUrlFields(
        { ...stripAutoFields(app), enroleeNumber: newEnroleeNumber, studentNumber: newStudentNumber },
        APP_URL_FIELDS,
        sourceAY,
        targetAY,
      );
      const { error: insertAppErr } = await supabaseAdmin
        .from(`${targetAY}_enrolment_applications`)
        .insert(newApp);
      if (insertAppErr) {
        return json({ error: `Insert application failed: ${insertAppErr.message}` }, 500);
      }

      // Documents
      if (doc) {
        const newDoc = remapUrlFields(
          { ...stripAutoFields(doc), enroleeNumber: newEnroleeNumber },
          DOC_URL_FIELDS,
          sourceAY,
          targetAY,
        );
        const { error: insertDocErr } = await supabaseAdmin
          .from(`${targetAY}_enrolment_documents`)
          .insert(newDoc);
        if (insertDocErr) {
          return json({ error: `Insert documents failed: ${insertDocErr.message}` }, 500);
        }
      }

      // Status
      if (status) {
        const newStatus = {
          ...stripAutoFields(status),
          enroleeNumber: newEnroleeNumber,
        };
        const { error: insertStatusErr } = await supabaseAdmin
          .from(`${targetAY}_enrolment_status`)
          .insert(newStatus);
        if (insertStatusErr) {
          return json({ error: `Insert status failed: ${insertStatusErr.message}` }, 500);
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
      const sourcePaths = [
        ...new Set(rawUrls.map((u) => storagePath(u)).filter((p): p is string => p !== null)),
      ];

      // 5. Copy files to target AY directory
      const copyErrors: string[] = [];
      for (const fromPath of sourcePaths) {
        const toPath = fromPath.replace(`${sourceAY}/`, `${targetAY}/`);
        const { error: copyErr } = await supabaseAdmin.storage.from(BUCKET).copy(fromPath, toPath);
        if (copyErr) copyErrors.push(`${fromPath}: ${copyErr.message}`);
      }
      if (copyErrors.length > 0) {
        return json({ error: `Storage copy failed — ${copyErrors.join("; ")}` }, 500);
      }

      // 6. Delete source DB records (documents + status in parallel, then applications)
      await Promise.all([
        doc
          ? supabaseAdmin
              .from(`${sourceAY}_enrolment_documents`)
              .delete()
              .eq("enroleeNumber", enroleeNumber)
          : Promise.resolve(),
        status
          ? supabaseAdmin
              .from(`${sourceAY}_enrolment_status`)
              .delete()
              .eq("enroleeNumber", enroleeNumber)
          : Promise.resolve(),
      ]);
      await supabaseAdmin
        .from(`${sourceAY}_enrolment_applications`)
        .delete()
        .eq("enroleeNumber", enroleeNumber);

      // 7. Delete source storage files
      if (sourcePaths.length > 0) {
        await supabaseAdmin.storage.from(BUCKET).remove(sourcePaths);
      }

      return json({ newEnroleeNumber, newStudentNumber });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
