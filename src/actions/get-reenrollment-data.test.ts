import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock";

const mockState = vi.hoisted(() => ({
  from: (() => ({})) as (table: string) => unknown,
  auth: { getSession: (async () => ({ data: { session: null } })) as () => Promise<unknown> },
}));

vi.mock("@/lib/client", () => ({ supabase: mockState }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const { getReEnrollmentData } = await import("./get-reenrollment-data");

const ACADEMIC_YEAR = "ay2026";
const ENROLEE_NUMBER = "E260050"; // "26" suffix resolves to ay2026 via academicYearFromEnroleeNumber
const APPLICATIONS_TABLE = `${ACADEMIC_YEAR}_enrolment_applications`;
const DOCUMENTS_TABLE = `${ACADEMIC_YEAR}_enrolment_documents`;

function baseApplicationRow(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Juan",
    middleName: "Santos",
    lastName: "Dela Cruz",
    birthDay: "2016-05-01",
    preferredName: "Juan",
    gender: "Male",
    primaryLanguage: "English",
    religion: "Catholic",
    religionOther: null,
    nric: "S1234567A",
    homeAddress: "123 Main St",
    postalCode: 123456,
    nationality: "Singaporean",
    homePhone: 65123456,
    contactPerson: "Maria Dela Cruz",
    contactPersonNumber: 65123457,
    livingWithWhom: "Both Parents",
    parentMaritalStatus: "Married",
    levelApplied: "Primary One",
    fatherEmail: "jose@example.com",
    guardianEmail: null,
    motherEmail: "maria@example.com",
    passportNumber: "P1234567",
    pass: "Dependent's Pass",
    passportExpiry: "2030-01-01",
    passExpiry: "2028-01-01",
    motherFirstName: "Maria",
    motherPass: "Long Term Visit Pass",
    motherPassport: "M1234567",
    motherPassportExpiry: "2030-01-01",
    motherPassExpiry: "2028-01-01",
    fatherFirstName: "Jose",
    fatherPass: "Employment Pass",
    fatherPassport: "F1234567",
    fatherPassportExpiry: "2030-06-01",
    fatherPassExpiry: "2028-06-01",
    guardianFirstName: null,
    guardianPass: null,
    guardianPassport: null,
    guardianPassportExpiry: null,
    guardianPassExpiry: null,
    siblingFullName1: "Ana Dela Cruz",
    siblingBirthDay1: "2014-01-01",
    siblingReligion1: "Catholic",
    siblingSchoolCompany1: "HFSE",
    siblingEducationOccupation1: "Grade 3",
    ...overrides,
  };
}

function baseDocumentRow(overrides: Record<string, unknown> = {}) {
  return {
    medical: "https://files.example.com/medical.pdf",
    passport: "https://files.example.com/student-passport.pdf",
    birthCert: "https://files.example.com/birth-cert.pdf",
    pass: "https://files.example.com/student-pass.pdf",
    educCert: "https://files.example.com/educ-cert.pdf",
    motherPass: "https://files.example.com/mother-pass.pdf",
    motherPassport: "https://files.example.com/mother-passport.pdf",
    fatherPass: "https://files.example.com/father-pass.pdf",
    fatherPassport: "https://files.example.com/father-passport.pdf",
    ...overrides,
  };
}

describe("getReEnrollmentData", () => {
  let harness: ReturnType<typeof createSupabaseMock>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns fully-shaped student/family/upload slices on the happy path (mother+father present, guardian absent)", async () => {
    harness = createSupabaseMock({
      rows: {
        [APPLICATIONS_TABLE]: [
          baseApplicationRow({
            dietaryRestrictions: "Halal",
            allergies: true,
            allergyDetails: "Peanuts",
            paracetamolConsent: true,
            motherWhatsappTeamsConsent: false,
          }),
        ],
        [DOCUMENTS_TABLE]: [baseDocumentRow()],
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result?.studentInfo.studentDetails).toMatchObject({
      firstName: "Juan",
      middleName: "Santos",
      lastName: "Dela Cruz",
      nric: "S1234567A",
      religionOther: null,
      dietaryRestrictions: "Halal",
    });
    expect(result?.studentInfo.addressContact).toMatchObject({
      homeAddress: "123 Main St",
      postalCode: "123456",
      homePhone: "65123456",
      contactPersonNumber: "65123457",
    });
    expect(result?.studentInfo.medicalInformation).toEqual({
      medicalChecklist: {
        allergies: true,
        asthma: false,
        heartConditions: false,
        epilepsy: false,
        diabetes: false,
        eczema: false,
        foodAllergies: false,
        other: false,
        none: false,
        allergyDetails: "Peanuts",
        foodAllergyDetails: "",
        otherMedicalConditions: "",
      },
      paracetamolConsent: true,
    });

    expect(result?.familyInfo.motherInfo).toMatchObject({ motherFirstName: "Maria" });
    // A real `false` boolean must stay a boolean, not become the truthy string "false" — that
    // was the pre-existing bug this fetcher fixes vs. the original getFamilyInformation.
    expect(result?.familyInfo.motherInfo?.motherWhatsappTeamsConsent).toBe(false);
    expect(result?.familyInfo.fatherInfo).toMatchObject({ fatherFirstName: "Jose" });
    expect(result?.familyInfo.guardianInfo).toBeUndefined();
    expect(result?.familyInfo.siblingsInfo.siblings).toEqual([
      {
        siblingFullName: "Ana Dela Cruz",
        siblingBirthDay: "2014-01-01",
        siblingReligion: "Catholic",
        siblingEducationOccupation: "Grade 3",
        siblingSchoolCompany: "HFSE",
      },
    ]);

    expect(result?.studentUploadRequirements).toMatchObject({
      passportNumber: "P1234567",
      passType: "Dependent's Pass",
      passport: "https://files.example.com/student-passport.pdf",
      pass: "https://files.example.com/student-pass.pdf",
      birthCert: "https://files.example.com/birth-cert.pdf",
      medical: "https://files.example.com/medical.pdf",
      educCert: "https://files.example.com/educ-cert.pdf",
    });

    expect(result?.parentGuardianUploadRequirements).toMatchObject({
      motherPassType: "Long Term Visit Pass",
      motherPassportNumber: "M1234567",
      fatherPassType: "Employment Pass",
      fatherPassportNumber: "F1234567",
      hasFatherInfo: true,
      hasGuardianInfo: false,
    });
    expect(result?.parentGuardianUploadRequirements).not.toHaveProperty("guardianPassType");

    expect(result?.levelApplied).toBe("Primary One");
    expect(result?.fatherEmail).toBe("jose@example.com");
    expect(result?.guardianEmail).toBeNull();
  });

  it("omits mother/father slices and marks hasFatherInfo false when only guardian info is present (no siblings)", async () => {
    harness = createSupabaseMock({
      rows: {
        [APPLICATIONS_TABLE]: [
          baseApplicationRow({
            motherFirstName: null,
            motherPass: null,
            motherPassport: null,
            motherPassportExpiry: null,
            motherPassExpiry: null,
            motherEmail: null,
            fatherFirstName: null,
            fatherPass: null,
            fatherPassport: null,
            fatherPassportExpiry: null,
            fatherPassExpiry: null,
            fatherEmail: null,
            guardianFirstName: "Ana",
            guardianLastName: "Reyes",
            guardianEmail: "ana@example.com",
            siblingFullName1: null,
            siblingBirthDay1: null,
            siblingReligion1: null,
            siblingSchoolCompany1: null,
            siblingEducationOccupation1: null,
          }),
        ],
        [DOCUMENTS_TABLE]: [],
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result?.familyInfo.motherInfo).toBeUndefined();
    expect(result?.familyInfo.fatherInfo).toBeUndefined();
    expect(result?.familyInfo.guardianInfo).toMatchObject({ guardianFirstName: "Ana", guardianLastName: "Reyes" });
    expect(result?.familyInfo.siblingsInfo.siblings).toEqual([]);

    expect(result?.parentGuardianUploadRequirements.hasFatherInfo).toBe(false);
    expect(result?.parentGuardianUploadRequirements.hasGuardianInfo).toBe(true);

    // No documents row — file-backed fields collapse away, only application-sourced fields remain.
    expect(result?.studentUploadRequirements).not.toHaveProperty("birthCert");
    expect(result?.studentUploadRequirements).not.toHaveProperty("medical");
    expect(result?.studentUploadRequirements).not.toHaveProperty("passport");
    expect(result?.studentUploadRequirements).toMatchObject({
      passportNumber: "P1234567",
      passType: "Dependent's Pass",
    });
  });

  it("falls back to empty/null defaults for optional fields the application row leaves blank", async () => {
    harness = createSupabaseMock({
      rows: {
        [APPLICATIONS_TABLE]: [
          baseApplicationRow({
            middleName: null,
            religionOther: undefined,
            passportExpiry: null,
            passExpiry: null,
            pass: null,
          }),
        ],
        [DOCUMENTS_TABLE]: [baseDocumentRow()],
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result?.studentInfo.studentDetails.middleName).toBe("");
    expect(result?.studentInfo.studentDetails.religionOther).toBeNull();
    expect(result?.studentUploadRequirements).not.toHaveProperty("passportExpiry");
    expect(result?.studentUploadRequirements).not.toHaveProperty("passExpiry");
    expect(result?.studentUploadRequirements).not.toHaveProperty("passType");
  });

  it("derives medicalChecklist.other/none from otherMedicalConditions when no checklist booleans are set", async () => {
    harness = createSupabaseMock({
      rows: {
        [APPLICATIONS_TABLE]: [baseApplicationRow({ otherMedicalConditions: "Motion sickness" })],
        [DOCUMENTS_TABLE]: [],
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result?.studentInfo.medicalInformation?.medicalChecklist).toMatchObject({
      other: true,
      none: false,
      otherMedicalConditions: "Motion sickness",
    });
  });

  it("marks medicalChecklist.none true and dietaryRestrictions/paracetamolConsent default when the row has no medical data at all", async () => {
    harness = createSupabaseMock({
      rows: {
        [APPLICATIONS_TABLE]: [baseApplicationRow()],
        [DOCUMENTS_TABLE]: [],
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result?.studentInfo.studentDetails.dietaryRestrictions).toBe("");
    expect(result?.studentInfo.medicalInformation?.medicalChecklist.none).toBe(true);
    expect(result?.studentInfo.medicalInformation?.paracetamolConsent).toBe(false);
  });

  it("returns null without a toast when the ownership-scoped lookup finds no owned application", async () => {
    harness = createSupabaseMock({
      rows: {
        [APPLICATIONS_TABLE]: [],
      },
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const { toast } = await import("sonner");
    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts and returns undefined when there is no authenticated session", async () => {
    harness = createSupabaseMock();
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = async () => ({ data: { session: null } });

    const { toast } = await import("sonner");
    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("Not authenticated");
  });

  it("toasts and returns undefined when the applications query errors", async () => {
    harness = createSupabaseMock({
      errorOn: (call) => (call.table === APPLICATIONS_TABLE && call.op === "select" ? { message: "applications down" } : null),
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const { toast } = await import("sonner");
    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("applications down");
  });

  it("toasts and returns undefined when the documents query errors", async () => {
    harness = createSupabaseMock({
      rows: { [APPLICATIONS_TABLE]: [baseApplicationRow()] },
      errorOn: (call) => (call.table === DOCUMENTS_TABLE && call.op === "select" ? { message: "documents down" } : null),
    });
    mockState.from = harness.supabase.from;
    mockState.auth.getSession = harness.supabase.auth.getSession;

    const { toast } = await import("sonner");
    const result = await getReEnrollmentData({ enroleeNumber: ENROLEE_NUMBER });

    expect(result).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("documents down");
  });
});
