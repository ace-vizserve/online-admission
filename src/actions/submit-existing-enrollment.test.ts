import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type RecordedCall } from "@/test/supabase-mock";
import { hfseOldStudentFixture } from "@/test/fixtures/enrollment";
import type { PreCourseDetails } from "@/types";

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { submitExistingEnrollment } = await import("./private");

const ACADEMIC_YEAR = "ay2026";
const ENROLEE_NUMBER = "E260050"; // "26" suffix resolves to ay2026 via academicYearFromEnroleeNumber
const PRE_COURSE_DETAILS: PreCourseDetails = {
  preCourseAnswer: "Yes",
  preCourseAcknowledgedAt: new Date("2026-01-01"),
};

function findCall(
  calls: RecordedCall[],
  match: Partial<Pick<RecordedCall, "table" | "op">> & { hasKey?: string },
) {
  return calls.find(
    (c) =>
      (match.table === undefined || c.table === match.table) &&
      (match.op === undefined || c.op === match.op) &&
      (match.hasKey === undefined || (c.payload != null && match.hasKey in c.payload)),
  );
}

describe("submitExistingEnrollment", () => {
  let harness: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    harness = createSupabaseMock({
      ownershipLookup: { data: { studentNumber: "H260050" }, error: null },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;
  });

  it("reuses the looked-up studentNumber (category Current) and only generates a new enroleeNumber", async () => {
    const result = await submitExistingEnrollment(
      hfseOldStudentFixture(),
      ENROLEE_NUMBER,
      ACADEMIC_YEAR,
      PRE_COURSE_DETAILS,
    );

    expect(result).toBe("E260001");

    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall?.payload?.studentNumber).toBe("H260050");
    expect(insertCall?.payload?.category).toBe("Current");

    // No studentNumber-generation update — only the enroleeNumber update.
    const studentNumberUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "studentNumber",
    });
    expect(studentNumberUpdate).toBeUndefined();

    const enroleeNumberUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "enroleeNumber",
    });
    expect(enroleeNumberUpdate?.payload?.enroleeNumber).toBe("E260001");
    expect(enroleeNumberUpdate?.filters.studentNumber).toBe("H260050");
  });

  it("scopes the ownership lookup to the logged-in parent's email via .or()", async () => {
    harness = createSupabaseMock({
      sessionEmail: "returning-parent@example.com",
      ownershipLookup: { data: { studentNumber: "H260050" }, error: null },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await submitExistingEnrollment(hfseOldStudentFixture(), ENROLEE_NUMBER, ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const ownershipLookup = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "select" });
    expect(String(ownershipLookup?.filters.or)).toContain("returning-parent@example.com");
  });

  it("throws instead of silently proceeding when the ownership lookup returns no owned row", async () => {
    harness = createSupabaseMock({
      ownershipLookup: { data: null, error: null },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(
      submitExistingEnrollment(hfseOldStudentFixture(), ENROLEE_NUMBER, ACADEMIC_YEAR, PRE_COURSE_DETAILS),
    ).rejects.toThrow();

    // Nothing should have been written once ownership can't be established.
    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall).toBeUndefined();
  });

  it("throws instead of silently proceeding when the ownership lookup errors", async () => {
    harness = createSupabaseMock({
      ownershipLookup: { data: null, error: { message: "not found" } },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(
      submitExistingEnrollment(hfseOldStudentFixture(), ENROLEE_NUMBER, ACADEMIC_YEAR, PRE_COURSE_DETAILS),
    ).rejects.toThrow("not found");
  });

  it("inserts the status row with enroleeType Current", async () => {
    await submitExistingEnrollment(hfseOldStudentFixture(), ENROLEE_NUMBER, ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const statusInsert = findCall(harness.calls, { table: "ay2026_enrolment_status", op: "insert" });
    expect(statusInsert?.payload?.enroleeType).toBe("Current");
    expect(statusInsert?.payload?.applicationStatus).toBe("Submitted");
  });

  it("writes mother and father pass/passport fields, skips guardian (noGuardianInfo)", async () => {
    await submitExistingEnrollment(hfseOldStudentFixture(), ENROLEE_NUMBER, ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const motherAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "motherPassport",
    });
    expect(motherAppUpdate?.payload?.motherPassport).toBe("M1234567");

    const guardianAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "guardianPassport",
    });
    expect(guardianAppUpdate).toBeUndefined();
  });
});
