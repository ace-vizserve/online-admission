import { RecoveryFormInput } from "@/zod-schema";
import { supabase } from "@/lib/client";

/**
 * Public (no-login) wrappers around the `recovery-link` edge function's parent-facing
 * actions. Mirrors the `supabase.functions.invoke` pattern already used by
 * `checkEmailExists` (src/lib/utils.ts) for anon-key edge function calls — unlike
 * `src/actions/admin.ts`, there is no session to attach here, the token itself is the
 * authorization.
 */

export type RecoverySection = "studentInfo" | "familyInfo" | "enrollmentInfo" | "uploads";

export type RecoveryTokenState =
  | { complete: true }
  | {
      complete?: false;
      enroleeNumber: string;
      academicYear: string;
      category: "New" | "Current" | "VizSchool New" | "VizSchool Current";
      studentName: string | null;
      missing: string[];
      sections: RecoverySection[];
      /** Reshaped existing `_applications`/`_documents` data to prefill the form with, or
       * `null` when `_applications` doesn't exist yet at all. Dates arrive as ISO strings
       * (JSON has no Date type) — the page revives them before calling `form.reset()`. */
      existingData: RecoveryFormInput | null;
    };

async function invokeRecovery<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("recovery-link", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export async function getRecoveryToken(token: string): Promise<RecoveryTokenState> {
  return invokeRecovery<RecoveryTokenState>({ action: "get", token });
}

export type SignedRecoveryUpload = {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
};

export async function signRecoveryUpload(
  token: string,
  field: string,
  filename: string,
): Promise<SignedRecoveryUpload> {
  return invokeRecovery<SignedRecoveryUpload>({ action: "sign-upload", token, field, filename });
}

export async function submitRecovery(
  token: string,
  formState: unknown,
): Promise<{ ok: true; enroleeNumber?: string; studentNumber?: string; alreadyComplete?: boolean }> {
  return invokeRecovery({ action: "submit", token, formState });
}
