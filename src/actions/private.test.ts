/**
 * `getPreviousParentGuardianDocuments` / `getFamilyInformation` (src/actions/private.ts).
 *
 * Covers the cross-year "carry the parent's latest documents into a new enrollment" merge
 * (each of the 6 document slots resolved independently across applications/years — see
 * merge-parent-guardian-documents.ts for the pure algorithm itself), the untouched pinned
 * (`enroleeNumber`) re-enrollment branch, error handling, and the ownership-filter fix that now
 * includes `guardianEmail` (previously father/mother-only) on both functions.
 *
 * The new-enrollment (`!enroleeNumber`) app-row query is un-singled (`.select().or().order()
 * .limit()`, awaited directly) — the mock resolves those via `options.rows`. The pinned
 * (`enroleeNumber`) branch and `getFamilyInformation` both end in `.maybeSingle()` — those are
 * resolved via `options.singleRows`, keyed by exact table name, so distinct academic-year tables
 * can return distinct single-row results.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type SupabaseMockOptions } from "@/test/supabase-mock";

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { getPreviousParentGuardianDocuments, getFamilyInformation } = await import("./private");

const SESSION_EMAIL = "parent@example.com";

const AY2027_APPLICATIONS = "ay2027_enrolment_applications";
const AY2027_DOCUMENTS = "ay2027_enrolment_documents";
const AY2026_APPLICATIONS = "ay2026_enrolment_applications";
const AY2026_DOCUMENTS = "ay2026_enrolment_documents";
const AY2025_APPLICATIONS = "ay2025_enrolment_applications";
const AY2025_DOCUMENTS = "ay2025_enrolment_documents";
// BACKEND_ACADEMIC_YEARS = ["ay9999", "ay2027", "ay2026", "ay2025"] — ay9999 is tried first, so
// getFamilyInformation's own (unchanged, not-pinned) year-cascade lands here by default.
const AY9999_APPLICATIONS = "ay9999_enrolment_applications";

function appRow(overrides: Record<string, unknown> = {}) {
  return {
    enroleeNumber: "E270001",
    motherPass: null,
    motherPassportExpiry: null,
    motherPassExpiry: null,
    motherPassport: null,
    fatherPass: null,
    fatherPassportExpiry: null,
    fatherPassExpiry: null,
    fatherPassport: null,
    guardianPass: null,
    guardianPassportExpiry: null,
    guardianPassExpiry: null,
    guardianPassport: null,
    ...overrides,
  };
}

function docRow(overrides: Record<string, unknown> = {}) {
  return {
    enroleeNumber: "E270001",
    motherPassport: null,
    motherPass: null,
    fatherPassport: null,
    fatherPass: null,
    guardianPassport: null,
    guardianPass: null,
    ...overrides,
  };
}

function harnessWith(options: Omit<SupabaseMockOptions, "sessionEmail"> = {}) {
  const harness = createSupabaseMock({ sessionEmail: SESSION_EMAIL, ...options });
  mockState.from = harness.supabase.from;
  mockState.auth.getSession = harness.supabase.auth.getSession;
  return harness;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPreviousParentGuardianDocuments — new enrollment (no enroleeNumber, cross-year merge)", () => {
  it("returns everything from the newest year's newest row when it has every document (regression baseline)", async () => {
    harnessWith({
      rows: {
        [AY2027_APPLICATIONS]: [
          appRow({
            enroleeNumber: "E270001",
            motherPassport: "M1111111",
            motherPassportExpiry: "2030-01-01",
            fatherPassport: "F1111111",
            fatherPassportExpiry: "2030-02-01",
            guardianPassport: "G1111111",
            guardianPassportExpiry: "2030-03-01",
          }),
        ],
        [AY2027_DOCUMENTS]: [
          docRow({
            enroleeNumber: "E270001",
            motherPassport: "https://files.example.com/mother-2027.pdf",
            fatherPassport: "https://files.example.com/father-2027.pdf",
            guardianPassport: "https://files.example.com/guardian-2027.pdf",
          }),
        ],
      },
    });

    const result = await getPreviousParentGuardianDocuments();

    expect(result?.parentGuardianUploadRequirements).toMatchObject({
      motherPassport: "https://files.example.com/mother-2027.pdf",
      motherPassportNumber: "M1111111",
      fatherPassport: "https://files.example.com/father-2027.pdf",
      fatherPassportNumber: "F1111111",
      guardianPassport: "https://files.example.com/guardian-2027.pdf",
      guardianPassportNumber: "G1111111",
    });
  });

  it("merges across academic years: fills mother/father from the newest year and guardian from an older year the newest year lacks", async () => {
    harnessWith({
      rows: {
        [AY2027_APPLICATIONS]: [
          appRow({
            enroleeNumber: "E270001",
            motherPassport: "M1111111",
            motherPassportExpiry: "2030-01-01",
            fatherPassport: "F1111111",
            fatherPassportExpiry: "2030-02-01",
            // no guardian info on this, the newest, application
          }),
        ],
        [AY2027_DOCUMENTS]: [
          docRow({
            enroleeNumber: "E270001",
            motherPassport: "https://files.example.com/mother-2027.pdf",
            fatherPassport: "https://files.example.com/father-2027.pdf",
          }),
        ],
        [AY2026_APPLICATIONS]: [
          appRow({
            enroleeNumber: "E260050",
            guardianPassport: "G0000000",
            guardianPassportExpiry: "2029-01-01",
          }),
        ],
        [AY2026_DOCUMENTS]: [
          docRow({ enroleeNumber: "E260050", guardianPassport: "https://files.example.com/guardian-2026.pdf" }),
        ],
      },
    });

    const result = await getPreviousParentGuardianDocuments();

    expect(result?.parentGuardianUploadRequirements).toMatchObject({
      motherPassport: "https://files.example.com/mother-2027.pdf",
      fatherPassport: "https://files.example.com/father-2027.pdf",
      guardianPassport: "https://files.example.com/guardian-2026.pdf",
      guardianPassportNumber: "G0000000",
    });
  });

  it("stops scanning once every slot is filled — never queries an older year it doesn't need", async () => {
    const harness = harnessWith({
      rows: {
        [AY2027_APPLICATIONS]: [
          appRow({
            enroleeNumber: "E270001",
            motherPassport: "M1",
            fatherPassport: "F1",
            guardianPassport: "G1",
            motherPass: "Type1",
            fatherPass: "Type2",
            guardianPass: "Type3",
          }),
        ],
        [AY2027_DOCUMENTS]: [
          docRow({
            enroleeNumber: "E270001",
            motherPassport: "https://files.example.com/1.pdf",
            fatherPassport: "https://files.example.com/2.pdf",
            guardianPassport: "https://files.example.com/3.pdf",
            motherPass: "https://files.example.com/4.pdf",
            fatherPass: "https://files.example.com/5.pdf",
            guardianPass: "https://files.example.com/6.pdf",
          }),
        ],
        // If the scan didn't stop early, it would also hit ay2026/ay2025 — assert below that it never does.
        [AY2026_APPLICATIONS]: [appRow({ enroleeNumber: "E260050" })],
      },
    });

    await getPreviousParentGuardianDocuments();

    expect(harness.calls.some((c) => c.table === AY2026_APPLICATIONS)).toBe(false);
    expect(harness.calls.some((c) => c.table === AY2025_APPLICATIONS)).toBe(false);
  });

  it("falls all the way back to an older year when the newest years have no applications at all", async () => {
    harnessWith({
      rows: {
        [AY2025_APPLICATIONS]: [appRow({ enroleeNumber: "E250099", motherPassport: "M9999999" })],
        [AY2025_DOCUMENTS]: [docRow({ enroleeNumber: "E250099", motherPassport: "https://files.example.com/mother-2025.pdf" })],
      },
    });

    const result = await getPreviousParentGuardianDocuments();

    expect(result?.parentGuardianUploadRequirements?.motherPassport).toBe("https://files.example.com/mother-2025.pdf");
  });

  it("returns {} when the parent has never submitted an application in any academic year", async () => {
    harnessWith({ rows: {} });

    const result = await getPreviousParentGuardianDocuments();

    expect(result).toEqual({});
  });

  it("returns a shape with hasFatherInfo/hasGuardianInfo (not an early {} return) when an application exists but no parent documents were ever uploaded", async () => {
    harnessWith({
      rows: {
        [AY2027_APPLICATIONS]: [appRow({ enroleeNumber: "E270001" })], // no docs seeded — nothing to merge
      },
      singleRows: {
        // getFamilyInformation's own (untouched) year-cascade lands on ay9999 first by default.
        [AY9999_APPLICATIONS]: {
          data: appRow({ enroleeNumber: "E270001", fatherFirstName: "Jose", fatherLastName: "Cruz" }),
        },
      },
    });

    const result = await getPreviousParentGuardianDocuments();

    expect(result).toHaveProperty("parentGuardianUploadRequirements");
    expect(result?.parentGuardianUploadRequirements).not.toHaveProperty("motherPassport");
    expect(result?.parentGuardianUploadRequirements?.hasFatherInfo).toBe(true);
  });

  it("filters applications by father/mother/guardian email (guardianEmail now included, not just father/mother)", async () => {
    const harness = harnessWith({
      rows: { [AY2027_APPLICATIONS]: [appRow({ enroleeNumber: "E270001" })] },
    });

    await getPreviousParentGuardianDocuments();

    const applicationsCall = harness.calls.find((c) => c.table === AY2027_APPLICATIONS);
    expect(applicationsCall?.filters.or).toBe(
      `fatherEmail.eq.${SESSION_EMAIL},motherEmail.eq.${SESSION_EMAIL},guardianEmail.eq.${SESSION_EMAIL}`,
    );
  });

  it("toasts and returns undefined when an applications query errors", async () => {
    harnessWith({
      rows: {},
      errorOn: (call) => (call.table === AY2027_APPLICATIONS && call.op === "select" ? { message: "applications down" } : null),
    });

    const { toast } = await import("sonner");
    const result = await getPreviousParentGuardianDocuments();

    expect(result).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("applications down");
  });

  it("toasts and returns undefined when a documents query errors", async () => {
    harnessWith({
      rows: { [AY2027_APPLICATIONS]: [appRow({ enroleeNumber: "E270001" })] },
      errorOn: (call) => (call.table === AY2027_DOCUMENTS && call.op === "select" ? { message: "documents down" } : null),
    });

    const { toast } = await import("sonner");
    const result = await getPreviousParentGuardianDocuments();

    expect(result).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("documents down");
  });

  it("returns undefined without a toast when there is no authenticated session", async () => {
    const harness = createSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = async () => ({ data: { session: null } });

    const { toast } = await import("sonner");
    const result = await getPreviousParentGuardianDocuments();

    expect(result).toBeUndefined();
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("getPreviousParentGuardianDocuments — re-enrollment (enroleeNumber pinned)", () => {
  const ENROLEE_NUMBER = "E260050"; // "26" suffix resolves to ay2026

  it("fetches only that exact application's own documents (unchanged single-row behavior)", async () => {
    harnessWith({
      singleRows: {
        [AY2026_APPLICATIONS]: {
          data: appRow({ enroleeNumber: ENROLEE_NUMBER, motherPassport: "M1234567", motherPassportExpiry: "2030-01-01" }),
        },
        [AY2026_DOCUMENTS]: {
          data: docRow({ enroleeNumber: ENROLEE_NUMBER, motherPassport: "https://files.example.com/mother.pdf" }),
        },
      },
    });

    const result = await getPreviousParentGuardianDocuments(ENROLEE_NUMBER);

    expect(result?.parentGuardianUploadRequirements).toMatchObject({
      motherPassport: "https://files.example.com/mother.pdf",
      motherPassportNumber: "M1234567",
    });
  });

  it("returns {} when no owned application matches that enroleeNumber", async () => {
    harnessWith({ singleRows: { [AY2026_APPLICATIONS]: { data: null } } });

    const result = await getPreviousParentGuardianDocuments(ENROLEE_NUMBER);

    expect(result).toEqual({});
  });
});

describe("getFamilyInformation", () => {
  it("filters by father/mother/guardian email (guardianEmail now included)", async () => {
    const harness = harnessWith({
      singleRows: { [AY9999_APPLICATIONS]: { data: appRow({ enroleeNumber: "E270001", fatherFirstName: "Jose" }) } },
    });

    await getFamilyInformation();

    const applicationsCall = harness.calls.find((c) => c.table === AY9999_APPLICATIONS);
    expect(applicationsCall?.filters.or).toBe(
      `fatherEmail.eq.${SESSION_EMAIL},motherEmail.eq.${SESSION_EMAIL},guardianEmail.eq.${SESSION_EMAIL}`,
    );
  });

  it("finds a guardian-only login's family info (previously locked out by the father/mother-only filter)", async () => {
    harnessWith({
      singleRows: {
        [AY9999_APPLICATIONS]: {
          data: appRow({
            enroleeNumber: "E270001",
            guardianFirstName: "Ana",
            guardianLastName: "Reyes",
            guardianEmail: "guardian-only@example.com",
          }),
        },
      },
    });

    const result = await getFamilyInformation();

    expect(result?.guardianInfo).toMatchObject({ guardianFirstName: "Ana", guardianLastName: "Reyes" });
  });
});
