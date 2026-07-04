import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type RecordedCall } from "@/test/supabase-mock";
import { hfseNewStudentFixture } from "@/test/fixtures/enrollment";
import type { PreCourseDetails } from "@/types";

// The Supabase client is a module-level singleton (src/lib/client.ts). We replace its
// exported object's methods in-place each test rather than reassigning the export binding,
// so submitEnrollment's captured `supabase` reference always sees the current mock.
const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { submitEnrollment } = await import("./private");

const ACADEMIC_YEAR = "ay2026";
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

describe("submitEnrollment", () => {
  let harness: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    harness = createSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;
  });

  it("inserts an applications row (category New, Registered) and generates H/E-prefixed numbers from the same insert id", async () => {
    const result = await submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    expect(result).toEqual({ generatedEnroleeNumber: "E260001" });

    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall?.payload?.category).toBe("New");
    expect(insertCall?.payload?.applicationStatus).toBe("Registered");
    expect(insertCall?.payload?.enroleeFullName).toBe("DELA CRUZ, JUAN, SANTOS");
    expect(insertCall?.payload?.motherFullName).toBe("DELA CRUZ, MARIA, REYES");

    const studentNumberUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "studentNumber",
    });
    expect(studentNumberUpdate?.payload?.studentNumber).toBe("H260001");
  });

  it("never sends UI-only keys to the applications insert", async () => {
    await submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall?.payload?.isValid).toBeUndefined();
    expect(insertCall?.payload?.hasFatherInfo).toBeUndefined();
    expect(insertCall?.payload?.hasGuardianInfo).toBeUndefined();
    expect(insertCall?.payload?.noFatherInfo).toBeUndefined();
    expect(insertCall?.payload?.noGuardianInfo).toBeUndefined();
    expect(insertCall?.payload?.discount).toBeUndefined();
    // Fixture's "Referred by someone" discount entry is excluded, "Sibling discount" kept at its index.
    expect(insertCall?.payload?.discount1).toBe("Sibling discount");
  });

  it("writes the documents row keyed by the generated numbers, honoring toFollowDocs", async () => {
    await submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const documentsInsert = findCall(harness.calls, { table: "ay2026_enrolment_documents", op: "insert" });
    expect(documentsInsert?.payload?.studentNumber).toBe("H260001");
    expect(documentsInsert?.payload?.enroleeNumber).toBe("E260001");

    const documentsUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_documents",
      op: "update",
      hasKey: "medicalStatus",
    });
    // Fixture marks "medical" as a to-follow doc.
    expect(documentsUpdate?.payload?.medical).toBeNull();
    expect(documentsUpdate?.payload?.medicalStatus).toBe("To follow");
    expect(documentsUpdate?.payload?.idPicture).toBe("https://files.example.com/student/id-picture.png");
    expect(documentsUpdate?.payload?.idPictureStatus).toBe("Uploaded");
  });

  it("writes mother and father pass/passport fields, skips guardian (noGuardianInfo)", async () => {
    await submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const motherAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "motherPassport",
    });
    expect(motherAppUpdate?.payload?.motherPassport).toBe("M1234567");

    const fatherAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "fatherPassport",
    });
    expect(fatherAppUpdate?.payload?.fatherPassport).toBe("F1234567");

    const guardianAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "guardianPassport",
    });
    expect(guardianAppUpdate).toBeUndefined();
  });

  it("inserts the status row with Submitted status, the levelApplied, and enroleeType New", async () => {
    await submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const statusInsert = findCall(harness.calls, { table: "ay2026_enrolment_status", op: "insert" });
    expect(statusInsert?.payload?.levelApplied).toBe("Grade 1");
    expect(statusInsert?.payload?.applicationStatus).toBe("Submitted");
    expect(statusInsert?.payload?.enroleeType).toBe("New");
    expect(statusInsert?.payload?.enroleeNumber).toBe("E260001");
  });

  it("writes calls in the expected sequence: insert app -> studentNumber -> enroleeNumber -> documents insert/update -> parent docs -> status insert", async () => {
    await submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS);

    const sequence = harness.calls.map((c) => `${c.op}:${c.table}`);
    expect(sequence.slice(0, 5)).toEqual([
      "insert:ay2026_enrolment_applications",
      "update:ay2026_enrolment_applications",
      "update:ay2026_enrolment_applications",
      "insert:ay2026_enrolment_documents",
      "update:ay2026_enrolment_documents",
    ]);
    expect(sequence.at(-1)).toBe("insert:ay2026_enrolment_status");
  });

  it("propagates a Supabase error from the initial applications insert without writing anything else", async () => {
    harness = createSupabaseMock({
      errorOn: (call) =>
        call.op === "insert" && call.table === "ay2026_enrolment_applications" && call.selectCols === "id"
          ? { message: "insert failed" }
          : null,
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(submitEnrollment(hfseNewStudentFixture(), ACADEMIC_YEAR, PRE_COURSE_DETAILS)).rejects.toThrow(
      "insert failed",
    );
    expect(harness.calls).toHaveLength(1);
  });
});
