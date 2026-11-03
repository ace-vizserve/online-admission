import { supabase } from "@/lib/client";

/**
 * Reads the passport PDFs a parent has staged for upload, by sending each to the portal's own server
 * (`api/scan-passport.ts`), so every device gets the same answer: a cheap phone only has to send the
 * file. The server keeps nothing; the upload itself still happens afterwards, when the parent confirms.
 */

export type DocumentReading = {
  /** UTC midnight of the expiry day — the same shape `toUTCDateOnly` gives the form. */
  expiry: Date | null;
  passportNumber: string | null;
  /** Where the expiry came from: the passport's machine-readable zone (check-digit verified) or a
   * printed "Date of Expiry"-style label. */
  source: "mrz" | "label" | null;
};

/** One passport found in a file, with only the values that were verified. */
export type PassportRead = { expiry: Date | null; passportNumber: string | null };

export type DocumentCheckResult = {
  reading: DocumentReading;
  /** Every passport with a verified value in the files; some uploads hold more than one. */
  passports: PassportRead[];
  /** Some page looked out of focus, so the reading deserves a careful second look. */
  poorQuality: boolean;
  /** The read ran out of time, so this is only what was verified by then. */
  outOfTime: boolean;
  /** Every read's text, for the debug panel. Local development only. */
  text: string;
};

type ScanResponse = {
  reading: { expiry: string | null; passportNumber: string | null; source: DocumentReading["source"] };
  passports: { expiry: string | null; passportNumber: string | null }[];
  poorQuality: boolean;
  outOfTime: boolean;
  text?: string;
};

const asDate = (value: string | null) => (value ? new Date(value) : null);

async function scan(file: File): Promise<ScanResponse> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch("/api/scan-passport", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  const payload = (await response.json().catch(() => null)) as (ScanResponse & { error?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.error ?? `Passport scan failed (${response.status})`);
  return payload;
}

export async function checkDocument(files: File[]): Promise<DocumentCheckResult> {
  // One at a time: each file is a request of its own, because a request can only carry so much.
  const scans: ScanResponse[] = [];
  for (const file of files) scans.push(await scan(file));

  const seen = new Set<string>();
  const passports = scans
    .flatMap((s) => s.passports)
    .filter((p) => {
      const key = `${p.expiry}|${p.passportNumber}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((p) => ({ expiry: asDate(p.expiry), passportNumber: p.passportNumber }));

  // The first file's reading that verified, else the first that found anything at all.
  const best =
    scans.find((s) => s.reading.source === "mrz") ??
    scans.find((s) => s.reading.source) ??
    scans.find((s) => s.reading.passportNumber) ??
    scans[0];
  const verified = best.reading.source === "mrz";

  return {
    reading: { ...best.reading, expiry: asDate(best.reading.expiry) },
    passports,
    poorQuality: !verified && scans.some((s) => s.poorQuality),
    outOfTime: scans.some((s) => s.outOfTime),
    text: scans.map((s) => s.text ?? "").join("\n"),
  };
}
