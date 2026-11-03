import { createClient } from "@supabase/supabase-js";

import { readPassportFile } from "./_lib/read-passport-file.js";

/**
 * POST /api/scan-passport: takes one passport PDF and answers with what it says. This runs on the
 * server rather than in the parent's browser so that every device gets the same answer: a cheap phone
 * only has to send the file. Nothing is stored; the file is read in memory and dropped, and the parent
 * uploads it as before once they confirm.
 *
 * Signed-in parents only, which is what stands between this and anyone using our OCR for free. A wizard
 * upload happens before the application exists, so there's no child to link the parent to yet.
 */

const MAX_FILE_SIZE = 4 * 1024 * 1024; // The portal's own upload limit.
const SCANS_PER_MINUTE = 10;

/** Per server instance, so a rough brake rather than a hard limit. */
const recentScans = new Map<string, number[]>();

function overLimit(userId: string, now = Date.now()) {
  const recent = (recentScans.get(userId) ?? []).filter((at) => now - at < 60_000);
  recentScans.set(userId, [...recent, now]);
  return recent.length >= SCANS_PER_MINUTE;
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

    const token = request.headers.get("authorization")?.replace(/^Bearer /, "").trim();
    if (!token) return json({ error: "missing Bearer token" }, 401);

    const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return json({ error: "invalid or expired token" }, 401);
    if (overLimit(data.user.id)) return json({ error: "too many scans, try again in a minute" }, 429);

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return json({ error: "expected a file" }, 400);
    if (file.size > MAX_FILE_SIZE) return json({ error: "file too large" }, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") return json({ error: "expected a PDF" }, 400);

    try {
      const { text, ...result } = await readPassportFile(bytes);
      // The raw text is only for tuning; a deployed parent's browser has no use for it.
      return json(process.env.VERCEL ? result : { ...result, text });
    } catch (readError) {
      // A PDF that won't open, or a read that failed: the portal treats this as "couldn't read it".
      console.error("[scan-passport] read failed", readError instanceof Error ? readError.message : readError);
      return json({ error: "could not read this file" }, 422);
    }
  },
};
