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

export type AdminStudent = {
  enroleeNumber: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  levelApplied: string;
  studentNumber: string;
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
