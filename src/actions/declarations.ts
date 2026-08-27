import { sisFetch } from "@/lib/sis";
import type { DeclarationPayload } from "@/actions/declaration-payload";
import type {
  Declaration,
  DeclarationStatus,
  EnrolledStudent,
  EvidenceUploadResponse,
  FileDeclarationResponse,
} from "@/types/declarations";

/**
 * Read actions for the SIS Student Absence & Travel Declaration API.
 *
 * Unlike most of `src/actions/private.ts`, these deliberately do NOT swallow-and-toast their
 * errors. The SIS writes its failure messages for parents to read, so the page needs `useQuery`
 * to reach an error state in order to show them — a swallowed error would leave the list
 * indistinguishable from "nothing filed yet".
 */

/**
 * The children the signed-in parent may file for.
 *
 * Not `api/parent/v2/students`: that one returns only children with a *currently published
 * report card*, which is a different and much smaller set.
 */
export async function listEnrolledStudents(): Promise<EnrolledStudent[]> {
  const payload = await sisFetch<{ students?: EnrolledStudent[] }>("api/parent/v2/enrolled-students");
  return payload.students ?? [];
}

export type DeclarationFilters = {
  studentNumber?: string;
  status?: DeclarationStatus;
};

/**
 * Every declaration filed for this parent's children, newest first.
 *
 * Scoped by child rather than by who filed, so both parents see the same list — if the mother
 * files, the father sees it too. Do not filter this down to the signed-in parent.
 */
export async function listDeclarations(filters: DeclarationFilters = {}): Promise<Declaration[]> {
  const params = new URLSearchParams();
  if (filters.studentNumber) params.set("studentNumber", filters.studentNumber);
  if (filters.status) params.set("status", filters.status);

  const query = params.toString();
  const payload = await sisFetch<{ declarations?: Declaration[] }>(
    `api/parent/v2/declarations${query ? `?${query}` : ""}`,
  );
  return payload.declarations ?? [];
}

/** What the SIS accepts as a certificate, mirrored into the file picker's `accept`. */
export const EVIDENCE_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
/** The SIS's own ceiling. Deliberately NOT the portal's 4 MB `MAX_UPLOAD_FILE_SIZE`. */
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

/**
 * Uploads one medical certificate and returns the storage path to send with the declaration.
 *
 * The returned path is checked server-side against the uploading parent — a path built by hand
 * on our side is rejected, so it must be passed back exactly as received.
 */
export async function uploadEvidence(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  const payload = await sisFetch<EvidenceUploadResponse>("api/parent/v2/declarations/evidence", {
    method: "POST",
    body,
  });
  return payload.path;
}

/**
 * Files a declaration, creating one record per child.
 *
 * A `200` carrying `alreadyFiled` is SUCCESS, not an error: on a bad connection a double-tapped
 * submit returns the existing filing rather than creating a second one. Callers must show the
 * confirmation on that path.
 */
export async function fileDeclaration(payload: DeclarationPayload): Promise<FileDeclarationResponse> {
  return await sisFetch<FileDeclarationResponse>("api/parent/v2/declarations", {
    method: "POST",
    json: payload,
  });
}
