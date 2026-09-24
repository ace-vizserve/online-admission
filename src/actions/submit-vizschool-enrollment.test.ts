import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type RecordedCall } from "@/test/supabase-mock";
import { vizSchoolNewStudentFixture } from "@/test/fixtures/enrollment";

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { submitVizSchoolEnrollment, getNewStudentDiscounts, getCurrentStudentDiscounts, submitParentFeedback } =
  await import("./private");

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

// The VizSchool wizards store the selector key `vizschool-ay2026`, but there is no `vizschool-ay2026_*`
// table in production (42P01) — VizSchool rows live in the shared per-year tables.
describe("the VizSchool selector key reaches the shared per-year tables", () => {
  let harness: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    harness = createSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;
  });

  it.each(["VizSchool New", "VizSchool Current"] as const)(
    "submitVizSchoolEnrollment(%s) with vizschool-ay2026 writes every row to ay2026_* and numbers it for 26",
    async (enrolleeType) => {
      const result = await submitVizSchoolEnrollment(
        vizSchoolNewStudentFixture(),
        "vizschool-ay2026",
        SCHOOL_FEE,
        enrolleeType,
      );

      expect(result).toEqual({ generatedEnroleeNumber: "E260001" });
      const tables = [...new Set(harness.calls.map((call) => call.table))];
      expect(tables.length).toBeGreaterThan(0);
      for (const table of tables) {
        expect(table).toMatch(/^ay2026_/);
      }
      expect(tables).toEqual(
        expect.arrayContaining(["ay2026_enrolment_applications", "ay2026_enrolment_documents", "ay2026_enrolment_status"]),
      );
      const studentNumberUpdate = findCall(harness.calls, {
        table: "ay2026_enrolment_applications",
        op: "update",
        hasKey: "studentNumber",
      });
      expect(studentNumberUpdate?.payload?.studentNumber).toBe("V260001");
    },
  );

  it("the discount lookups read ay2026_discount_codes, still filtered to VizSchool codes", async () => {
    await getNewStudentDiscounts(true, "vizschool-ay2026");
    await getCurrentStudentDiscounts(true, "vizschool-ay2026");

    expect(harness.calls.map((call) => call.table)).toEqual(["ay2026_discount_codes", "ay2026_discount_codes"]);
    expect(harness.calls[0].filters.or).toContain("VizSchool New");
    expect(harness.calls[1].filters.or).toContain("VizSchool Current");
  });

  it("an HFSE-IS key is left as it is", async () => {
    await getNewStudentDiscounts(false, "ay2027");
    expect(harness.calls[0].table).toBe("ay2027_discount_codes");
  });

  it("the post-submit feedback survey updates ay2026_enrolment_applications", async () => {
    await submitParentFeedback({
      academicYear: "vizschool-ay2026",
      enroleeNumber: "E260001",
      feedbackRating: null,
      feedbackConsent: false,
      howDidYouKnowAboutHFSEIS: "Facebook",
    });

    expect(harness.calls).toHaveLength(1);
    expect(harness.calls[0]).toMatchObject({ table: "ay2026_enrolment_applications", op: "update" });
  });
});
