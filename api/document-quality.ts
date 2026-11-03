import { createClient } from "@supabase/supabase-js";

import { measureDocument } from "./_lib/document-quality.js";

/**
 * POST /api/document-quality with `{ fileUrl }`: measures a document already uploaded to our bucket, for
 * the admin who reviews it. It takes the URL rather than the file so a cheap phone on a slow connection
 * doesn't have to send it twice. Nothing is stored here, and it never holds up the parent.
 */

const MAX_FILE_SIZE = 20 * 1024 * 1024; // Well above the 4 MB uploads are limited to.
const BUCKET_PATH = "/storage/v1/object/public/parent-portal/";

const json = (body: unknown, status = 200) => Response.json(body, { status });

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

    const token = request.headers.get("authorization")?.replace(/^Bearer /, "").trim();
    if (!token) return json({ error: "missing Bearer token" }, 401);

    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return json({ error: "invalid or expired token" }, 401);

    const body = (await request.json().catch(() => null)) as { fileUrl?: unknown } | null;
    const fileUrl = body?.fileUrl;
    // Only ever our own bucket, so this can't be pointed at anything else from our server.
    if (typeof fileUrl !== "string" || !fileUrl.startsWith(`${supabaseUrl.replace(/\/$/, "")}${BUCKET_PATH}`)) {
      return json({ error: "not a parent portal file" }, 400);
    }

    try {
      const file = await fetch(fileUrl);
      if (!file.ok) return json({ error: "file not found" }, 404);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (bytes.length > MAX_FILE_SIZE) return json({ error: "file too large" }, 413);
      return json(await measureDocument(bytes));
    } catch (measureError) {
      console.error("[document-quality] failed", measureError instanceof Error ? measureError.message : measureError);
      return json({ error: "could not measure this file" }, 422);
    }
  },
};
