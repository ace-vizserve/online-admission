import { Session } from "@supabase/supabase-js";

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

async function callMoveStudentAY(session: Session, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(FUNCTION_URL, {
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
