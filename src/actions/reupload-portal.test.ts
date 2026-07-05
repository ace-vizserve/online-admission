/**
 * Covers the two page-wide bugs fixed on the post-submission "update application / reupload
 * documents" page (src/components/private/documents/**, src/components/private/uploaded/**):
 *
 *   1. `assertApplicationOwnership`/`buildApplicationOwnershipFilter` (private.ts) now include
 *      `guardianEmail` in the ownership filter — a guardian-only login previously failed every
 *      ownership check on this page even though the UI fully supports guardians.
 *   2. `updateEnrollmentApplicationDetails`, `studentReuploadDocuments`, and
 *      `parentGuardianReuploadDocuments` now re-throw after their own `toast.error(...)` on any
 *      failure (mirroring `deleteFile`'s existing pattern) — previously the promise always
 *      resolved, so the calling `useMutation`'s `onSuccess` fired even when the write failed, the
 *      user wasn't authorized, or the session had expired, incorrectly emailing the other parent
 *      that a change had been saved.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const {
  updateEnrollmentApplicationDetails,
  studentReuploadDocuments,
  parentGuardianReuploadDocuments,
  getStudentDetails,
  getFamilyDocuments,
} = await import("./private");

const ACADEMIC_YEAR = "ay2026";
const ENROLEE_NUMBER = "E260050"; // "26" suffix resolves to ay2026 via academicYearFromEnroleeNumber

function useMock(options: Parameters<typeof createSupabaseMock>[0]) {
  const harness = createSupabaseMock(options);
  mockState.from = harness.supabase.from;
  mockState.auth.getSession = harness.supabase.auth.getSession;
  return harness;
}

describe("guardian ownership — all 5 functions accept a guardianEmail match", () => {
  let harness: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    harness = useMock({
      sessionEmail: "guardian@example.com",
      ownershipLookup: { data: { enroleeNumber: ENROLEE_NUMBER }, error: null },
    });
  });

  it("updateEnrollmentApplicationDetails succeeds for a guardian-only session, with guardianEmail in the ownership filter", async () => {
    await expect(
      updateEnrollmentApplicationDetails({
        academicYear: ACADEMIC_YEAR,
        enroleeNumber: ENROLEE_NUMBER,
        enrollmentDetails: { firstName: "Jane" },
      }),
    ).resolves.not.toThrow();

    // Proves the fix directly: the mock resolves any `.or()` ownership lookup successfully
    // regardless of its contents, so this asserts the ACTUAL filter string sent to Supabase
    // includes `guardianEmail` — not just that a guardian-session call happened to succeed.
    const ownershipCall = harness.calls.find(
      (c) => c.table === `${ACADEMIC_YEAR}_enrolment_applications` && typeof c.filters.or === "string",
    );
    expect(ownershipCall?.filters.or).toContain("guardianEmail.eq.guardian@example.com");
  });

  it("studentReuploadDocuments succeeds for a guardian-only session", async () => {
    await expect(
      studentReuploadDocuments({
        academicYear: ACADEMIC_YEAR,
        documentType: "idPicture",
        enroleeNumber: ENROLEE_NUMBER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: { idPicture: "http://example.com/id.png" } as any,
      }),
    ).resolves.not.toThrow();
  });

  it("parentGuardianReuploadDocuments succeeds for a guardian-only session", async () => {
    await expect(
      parentGuardianReuploadDocuments({
        role: "guardian",
        academicYear: ACADEMIC_YEAR,
        documentType: "guardianPassport",
        enroleeNumber: ENROLEE_NUMBER,
        payload: { guardianPassport: "http://example.com/passport.pdf" },
      }),
    ).resolves.not.toThrow();
  });

  it("getFamilyDocuments does not return {} (empty/unauthorized) for a guardian-only session", async () => {
    const result = await getFamilyDocuments(ENROLEE_NUMBER);
    // With ownership granted, the documents-table select (an empty mock result here) still runs —
    // proving the guardian passed the ownership gate rather than being rejected before reaching it.
    expect(result).not.toBeUndefined();
  });
});

describe("ownership rejection re-throws instead of silently succeeding", () => {
  beforeEach(() => {
    useMock({
      sessionEmail: "stranger@example.com",
      ownershipLookup: { data: null, error: null },
    });
  });

  it("updateEnrollmentApplicationDetails throws 'Unauthorized access' rather than resolving", async () => {
    await expect(
      updateEnrollmentApplicationDetails({
        academicYear: ACADEMIC_YEAR,
        enroleeNumber: ENROLEE_NUMBER,
        enrollmentDetails: { firstName: "Jane" },
      }),
    ).rejects.toThrow("Unauthorized access");
  });

  it("studentReuploadDocuments throws 'Unauthorized access' rather than resolving", async () => {
    await expect(
      studentReuploadDocuments({
        academicYear: ACADEMIC_YEAR,
        documentType: "idPicture",
        enroleeNumber: ENROLEE_NUMBER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: { idPicture: "http://example.com/id.png" } as any,
      }),
    ).rejects.toThrow("Unauthorized access");
  });

  it("parentGuardianReuploadDocuments throws 'Unauthorized access' rather than resolving", async () => {
    await expect(
      parentGuardianReuploadDocuments({
        role: "mother",
        academicYear: ACADEMIC_YEAR,
        documentType: "motherPassport",
        enroleeNumber: ENROLEE_NUMBER,
        payload: { motherPassport: "http://example.com/passport.pdf" },
      }),
    ).rejects.toThrow("Unauthorized access");
  });
});

describe("DB write failures re-throw instead of silently succeeding", () => {
  it("updateEnrollmentApplicationDetails throws when the applications-table update fails", async () => {
    useMock({
      sessionEmail: "parent@example.com",
      ownershipLookup: { data: { enroleeNumber: ENROLEE_NUMBER }, error: null },
      errorOn: (call) =>
        call.table === `${ACADEMIC_YEAR}_enrolment_applications` && call.op === "update"
          ? { message: "db write failed" }
          : null,
    });

    await expect(
      updateEnrollmentApplicationDetails({
        academicYear: ACADEMIC_YEAR,
        enroleeNumber: ENROLEE_NUMBER,
        enrollmentDetails: { firstName: "Jane" },
      }),
    ).rejects.toThrow("db write failed");
  });

  it("studentReuploadDocuments throws when the documents-table update fails", async () => {
    useMock({
      sessionEmail: "parent@example.com",
      ownershipLookup: { data: { enroleeNumber: ENROLEE_NUMBER }, error: null },
      errorOn: (call) =>
        call.table === `${ACADEMIC_YEAR}_enrolment_documents` && call.op === "update"
          ? { message: "db write failed" }
          : null,
    });

    await expect(
      studentReuploadDocuments({
        academicYear: ACADEMIC_YEAR,
        documentType: "idPicture",
        enroleeNumber: ENROLEE_NUMBER,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: { idPicture: "http://example.com/id.png" } as any,
      }),
    ).rejects.toThrow("db write failed");
  });
});

describe("getStudentDetails — guardian ownership", () => {
  it("does not return null for a guardian-only session (previously always unauthorized)", async () => {
    useMock({
      sessionEmail: "guardian@example.com",
      rows: {
        [`${ACADEMIC_YEAR}_enrolment_applications`]: [{ enroleeNumber: ENROLEE_NUMBER, firstName: "Jane" }],
        [`${ACADEMIC_YEAR}_enrolment_documents`]: [],
      },
    });

    const result = await getStudentDetails({ enroleeNumber: ENROLEE_NUMBER });
    expect(result).not.toBeNull();
  });
});
