import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type RecordedCall } from "@/test/supabase-mock";
import { vizSchoolNewStudentFixture } from "@/test/fixtures/enrollment";

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { submitVizSchoolEnrollment } = await import("./private");

const ACADEMIC_YEAR = "ay2026";
const SCHOOL_FEE = "Full Fee";

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

describe("submitVizSchoolEnrollment", () => {
  let harness: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    harness = createSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;
  });

  it("inserts an applications row with category/enroleeType 'VizSchool New' and vizSchoolProgram, generates V/E-prefixed numbers", async () => {
    const result = await submitVizSchoolEnrollment(
      vizSchoolNewStudentFixture(),
      ACADEMIC_YEAR,
      SCHOOL_FEE,
      "VizSchool New",
    );

    expect(result).toEqual({ generatedEnroleeNumber: "E260001" });

    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall?.payload?.category).toBe("VizSchool New");
    expect(insertCall?.payload?.vizSchoolProgram).toBe("Full Fee");
    expect(insertCall?.payload?.applicationStatus).toBe("Registered");

    const studentNumberUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "studentNumber",
    });
    expect(studentNumberUpdate?.payload?.studentNumber).toBe("V260001");
  });

  it("never sends medical or STP fields (VizSchool schema has none)", async () => {
    await submitVizSchoolEnrollment(vizSchoolNewStudentFixture(), ACADEMIC_YEAR, SCHOOL_FEE, "VizSchool New");

    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall?.payload?.paracetamolConsent).toBeUndefined();
    expect(insertCall?.payload?.stpApplicationType).toBeUndefined();
    expect(insertCall?.payload?.stpApplicationStatus).toBeUndefined();
    expect(insertCall?.payload?.isValid).toBeUndefined();
  });

  it("writes the documents row and honors an empty toFollowDocs (all docs marked Uploaded)", async () => {
    await submitVizSchoolEnrollment(vizSchoolNewStudentFixture(), ACADEMIC_YEAR, SCHOOL_FEE, "VizSchool New");

    const documentsInsert = findCall(harness.calls, { table: "ay2026_enrolment_documents", op: "insert" });
    expect(documentsInsert?.payload?.studentNumber).toBe("V260001");
    expect(documentsInsert?.payload?.enroleeNumber).toBe("E260001");

    const documentsUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_documents",
      op: "update",
      hasKey: "idPictureStatus",
    });
    expect(documentsUpdate?.payload?.idPictureStatus).toBe("Uploaded");
    expect(documentsUpdate?.payload?.medical).toBeNull();
    expect(documentsUpdate?.payload?.medicalStatus).toBeNull();
  });

  it("writes mother pass/passport fields, skips father and guardian (noFatherInfo/noGuardianInfo)", async () => {
    await submitVizSchoolEnrollment(vizSchoolNewStudentFixture(), ACADEMIC_YEAR, SCHOOL_FEE, "VizSchool New");

    const motherAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "motherPassport",
    });
    expect(motherAppUpdate?.payload?.motherPassport).toBe("M7654321");

    const fatherAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "fatherPassport",
    });
    expect(fatherAppUpdate).toBeUndefined();

    const guardianAppUpdate = findCall(harness.calls, {
      table: "ay2026_enrolment_applications",
      op: "update",
      hasKey: "guardianPassport",
    });
    expect(guardianAppUpdate).toBeUndefined();
  });

  it("uses the enrolleeType parameter for both category and the status row's enroleeType (VizSchool Current)", async () => {
    await submitVizSchoolEnrollment(vizSchoolNewStudentFixture(), ACADEMIC_YEAR, SCHOOL_FEE, "VizSchool Current");

    const insertCall = findCall(harness.calls, { table: "ay2026_enrolment_applications", op: "insert" });
    expect(insertCall?.payload?.category).toBe("VizSchool Current");

    const statusInsert = findCall(harness.calls, { table: "ay2026_enrolment_status", op: "insert" });
    expect(statusInsert?.payload?.enroleeType).toBe("VizSchool Current");
    expect(statusInsert?.payload?.applicationStatus).toBe("Submitted");
  });

  it("propagates a Supabase error from the initial applications insert", async () => {
    harness = createSupabaseMock({
      errorOn: (call) =>
        call.op === "insert" && call.table === "ay2026_enrolment_applications" && call.selectCols === "id"
          ? { message: "insert failed" }
          : null,
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    await expect(
      submitVizSchoolEnrollment(vizSchoolNewStudentFixture(), ACADEMIC_YEAR, SCHOOL_FEE, "VizSchool New"),
    ).rejects.toThrow("insert failed");
  });
});
