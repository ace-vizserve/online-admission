import { CHECK_TIMED_OUT, DocumentCheck, DocumentDetails } from "@/components/private/shared/upload-requirements/use-document-check";
import { supabase } from "@/lib/client";
import { sisFetch } from "@/lib/sis";

export type DocumentReadingReport = {
  /** `not_read`: not a document the OCR check reads, so only its scan quality gets reported. */
  status: "read" | "unreadable" | "timed_out" | "failed" | "not_read";
  /** Every passport read from the file, with only its check-digit-verified values. */
  passports: { expiry: string | null; number: string | null }[];
};

const day = (value: unknown) => {
  const date = value ? new Date(value as string | Date) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
};

/** What the check found. */
export function documentReadingReport({ state }: Pick<DocumentCheck, "state">): DocumentReadingReport {
  if (state.phase === "failed") {
    return { status: state.error === CHECK_TIMED_OUT ? "timed_out" : "failed", passports: [] };
  }
  if (state.phase !== "done") return { status: "not_read", passports: [] };
  const passports = state.result.passports.map((p) => ({ expiry: day(p.expiry), number: p.passportNumber }));
  if (passports.length) return { status: "read", passports };
  return { status: state.result.outOfTime ? "timed_out" : "unreadable", passports };
}

/** The file's scan quality from the portal's server, or null if it couldn't be measured. */
async function measureQuality(fileUrl: string) {
  const { data } = await supabase.auth.getSession();
  const response = await fetch("/api/document-quality", {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session?.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fileUrl }),
  });
  return response.ok ? ((await response.json()) as Record<string, unknown>) : null;
}

/**
 * Tells the SIS what's known about a file just uploaded, for the admin who reviews it: what the OCR
 * check read, and how good the scan is. Keyed by the file's URL, because a wizard upload happens before
 * its application exists. The upload has already succeeded by now and the admin can still see the file
 * itself, so a failure here is logged, never shown to the parent.
 */
export async function sendDocumentReading(fileUrl: string, check: Pick<DocumentCheck, "state">, entered: DocumentDetails) {
  try {
    await sisFetch("api/parent/v2/document-readings", {
      method: "POST",
      json: {
        fileUrl,
        ...documentReadingReport(check),
        quality: await measureQuality(fileUrl),
        enteredNumber: entered.number ? String(entered.number) : null,
        enteredExpiry: day(entered.expiry),
      },
    });
  } catch (error) {
    console.error("Couldn't send the document reading to the SIS", error);
  }
}
