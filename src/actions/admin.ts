import { ADMIN_EMAILS } from "@/config/admin";
import { supabase } from "@/lib/client";
import { LoginSchema } from "@/zod-schema";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export async function adminLogin({ email, password }: LoginSchema) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    toast.error(error.message);
    return;
  }
  if (!ADMIN_EMAILS.includes(data.user.email ?? "")) {
    await supabase.auth.signOut();
    toast.error("This account does not have admin access.");
  }
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/move-student-ay`;

// Wire format of list-students: any column except enroleeNumber (filtered server-side)
// can be null on incomplete rows.
export type AdminStudent = {
  enroleeNumber: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  levelApplied: string | null;
  studentNumber: string | null;
};

export type MoveStudentResult = {
  newEnroleeNumber: string;
  newStudentNumber: string;
};

export type BulkMoveRowResult = {
  enroleeNumber: string;
  ok: boolean;
  newEnroleeNumber?: string;
  newStudentNumber?: string;
  error?: string;
};

export type BulkMoveResult = {
  results: BulkMoveRowResult[];
  moved: number;
  failed: number;
};

async function callFunction(url: string, session: Session, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data;
}

async function callMoveStudentAY(session: Session, body: Record<string, unknown>): Promise<unknown> {
  return callFunction(FUNCTION_URL, session, body);
}

export async function listStudentsInAY(session: Session, sourceAY: string): Promise<AdminStudent[]> {
  const data = await callMoveStudentAY(session, { action: "list-students", sourceAY });
  return (data as { students: AdminStudent[] }).students;
}

export async function moveStudentAY(
  session: Session,
  params: { sourceAY: string; targetAY: string; enroleeNumber: string },
): Promise<MoveStudentResult> {
  const data = await callMoveStudentAY(session, { action: "move", ...params });
  return data as MoveStudentResult;
}

export async function moveStudentsBulkAY(
  session: Session,
  params: { sourceAY: string; targetAY: string; enroleeNumbers: string[] },
): Promise<BulkMoveResult> {
  const data = await callMoveStudentAY(session, { action: "move-bulk", ...params });
  return data as BulkMoveResult;
}

const SET_PASSWORD_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-set-password`;

export type AdminAccount = {
  id: string;
  email: string;
  fullName: string;
  relationship: string;
  emailConfirmed: boolean;
  lastSignInAt: string | null;
};

export async function listAdminAccounts(session: Session): Promise<AdminAccount[]> {
  const data = await callFunction(SET_PASSWORD_FUNCTION_URL, session, { action: "list-accounts" });
  return (data as { accounts: AdminAccount[] }).accounts;
}

export async function adminSetPassword(
  session: Session,
  params: { email: string; password: string },
): Promise<void> {
  await callFunction(SET_PASSWORD_FUNCTION_URL, session, { action: "set-password", ...params });
}

export type ExistingParentAccount = Omit<AdminAccount, "id"> & { createdAt: string | null };

export type CreatedParentAccount = {
  email: string;
  fullName: string;
  relationship: string;
};

// Duplicate-email creation is rejected with the existing account's details so the
// page can render them instead of a bare error string.
export class ExistingParentAccountError extends Error {
  existing: ExistingParentAccount;

  constructor(message: string, existing: ExistingParentAccount) {
    super(message);
    this.name = "ExistingParentAccountError";
    this.existing = existing;
  }
}

const RECOVERY_LINK_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recovery-link`;

export type RecoverySection = "studentInfo" | "familyInfo" | "enrollmentInfo" | "uploads";

export const RECOVERY_SECTION_LABEL: Record<RecoverySection, string> = {
  studentInfo: "Student Info",
  familyInfo: "Family Info",
  enrollmentInfo: "Enrollment Info",
  uploads: "Documents",
};

export type RecoveryCheckResult =
  | { complete: true; academicYear: string; enroleeNumber: string }
  | {
      complete?: false;
      academicYear: string;
      enroleeNumber: string;
      studentNumber: string | null;
      category: string;
      studentName: string | null;
      present: { applications: boolean; documents: boolean; status: boolean };
      // `present.applications === true` alongside this means the row exists but is missing
      // required fields — the recovery link will UPDATE it, not INSERT a new one.
      applicationsIncomplete: boolean;
      missing: string[];
      suggestedSections: RecoverySection[];
      // Prefill for the recipient-email field — whatever's already on the applications row,
      // or null when that row doesn't exist. Always shown to the admin to confirm/edit, never
      // sent anywhere silently.
      knownEmails: string | null;
    };

export type RecoveryLinkResult = {
  token: string;
  url: string;
  missing: string[];
  sections: RecoverySection[];
  studentName: string | null;
  category: string;
  emailSent: boolean;
  emailError?: string;
};

export async function adminCheckRecovery(session: Session, params: { enroleeNumber: string }): Promise<RecoveryCheckResult> {
  const data = await callFunction(RECOVERY_LINK_FUNCTION_URL, session, { action: "check", ...params });
  return data as RecoveryCheckResult;
}

export async function adminGenerateRecoveryLink(
  session: Session,
  params: { enroleeNumber: string; sections?: RecoverySection[]; recipientEmails?: string },
): Promise<RecoveryLinkResult> {
  const data = await callFunction(RECOVERY_LINK_FUNCTION_URL, session, { action: "generate", ...params });
  return data as RecoveryLinkResult;
}

export async function adminCreateParentAccount(
  session: Session,
  params: { firstName: string; lastName: string; relationship: "mother" | "father"; email: string; password: string },
): Promise<CreatedParentAccount> {
  const res = await fetch(SET_PASSWORD_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action: "create-account", ...params, email: params.email.toLowerCase() }),
  });
  const data = (await res.json()) as {
    error?: string;
    existing?: ExistingParentAccount;
    account?: CreatedParentAccount;
  };
  if (res.status === 409 && data.existing) {
    throw new ExistingParentAccountError(data.error ?? "An account with this email already exists", data.existing);
  }
  if (!res.ok || !data.account) throw new Error(data.error ?? "Request failed");
  return data.account;
}
