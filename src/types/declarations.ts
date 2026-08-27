/**
 * Types for the SIS Student Absence & Travel Declaration API (`/api/parent/v2/*`).
 *
 * The SIS owns these records; the portal only reads and files them. Shapes transcribed from the
 * SIS handoff, not inferred — where a field is nullable here, the SIS genuinely returns null.
 */

export type DeclarationStatus = "pending" | "approved" | "rejected" | "cancelled";

export type DeclarationType = "absence" | "travel";

/**
 * A child the signed-in parent may file for, from `GET /api/parent/v2/enrolled-students`.
 *
 * There are no internal ids: `studentNumber` is the only identifier the API accepts, so it is
 * also the React key and the form value. `className` arrives pre-composed ("P4 Diligence").
 */
export type EnrolledStudent = {
  studentNumber: string;
  name: string;
  levelCode: string;
  sectionName: string;
  className: string;
};

/** One filed declaration, for one child, from `GET /api/parent/v2/declarations`. */
export type Declaration = {
  id: string;
  /** Shared by every child on one submission — siblings are filed together, approved separately. */
  filingGroupId: string;
  declarationType: DeclarationType;
  studentNumber: string;
  studentName: string;
  /** `YYYY-MM-DD`, date-only — not a timestamp. */
  startDate: string;
  /** `YYYY-MM-DD`, date-only. Equal to `startDate` for a single-day absence. */
  endDate: string;
  withMedical: boolean;
  evidenceUrl: string | null;
  hasUpload: boolean;
  /** Null on an absence. */
  destinationCountry: string | null;
  destinationCity: string | null;
  parentNote: string | null;
  status: DeclarationStatus;
  /**
   * The parent-facing wording for `status` — "With the school" rather than "Pending", because
   * *pending* reads as *stuck* to a parent watching a form they filed about a sick child.
   * Always render this, never `status`.
   */
  statusLabel: string;
  /** Full ISO timestamp, unlike the date-only `startDate`/`endDate`. */
  filedAt: string;
};

/** The summary view returned for each child on a fresh 201 filing. */
export type FiledDeclaration = Pick<Declaration, "id" | "studentNumber" | "studentName" | "status">;

/**
 * `POST /api/parent/v2/declarations`.
 *
 * A 200 carrying `alreadyFiled` is SUCCESS, not an error: a parent double-tapping submit on a bad
 * connection gets back the filing that already exists instead of creating a second one. On that
 * path the SIS returns full declaration views rather than the 201 summaries.
 */
export type FileDeclarationResponse = {
  filingGroupId: string;
  declarations: FiledDeclaration[] | Declaration[];
  alreadyFiled?: true;
};

/** `POST /api/parent/v2/declarations/evidence` — the server-checked storage path to send back. */
export type EvidenceUploadResponse = { path: string };
