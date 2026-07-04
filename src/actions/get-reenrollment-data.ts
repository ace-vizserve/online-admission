import { academicYearFromEnroleeNumber } from "@/config/academic-years";
import { supabase } from "@/lib/client";
import { extractSiblings, removeEmptyKeys } from "@/lib/utils";
import { EnrolOldStudentFormState } from "@/types";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";

export type ReEnrollmentData = {
  studentInfo: EnrolOldStudentFormState["studentInfo"];
  familyInfo: EnrolOldStudentFormState["familyInfo"];
  studentUploadRequirements: Record<string, unknown>;
  parentGuardianUploadRequirements: Record<string, unknown>;
  levelApplied: string;
  fatherEmail: string | null;
  guardianEmail: string | null;
};

/**
 * Consolidates the old re-enrollment flow's 6 separate per-step fetches (student info,
 * family info, enrollment info, student documents, parent/guardian documents) into a single
 * applications + documents round trip, so the flow can hydrate its store once at entry
 * instead of once per step. Mirrors the exact reshaping each of those fetchers already did
 * (getStudentInformation, getFamilyInformation, getPreviousStudentDocuments,
 * getPreviousParentGuardianDocuments, getStudentEnrollmentInformation in private.ts) so the
 * store slices this produces are byte-for-byte compatible with what the tabs already expect.
 */
export async function getReEnrollmentData({
  enroleeNumber,
}: {
  enroleeNumber: string;
}): Promise<ReEnrollmentData | null | undefined> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) throw new Error("Not authenticated");

    const academicYear = academicYearFromEnroleeNumber(enroleeNumber);

    const { data: applications, error: applicationsError } = await supabase
      .from(`${academicYear}_enrolment_applications`)
      .select("*")
      .eq("enroleeNumber", enroleeNumber)
      .or(`fatherEmail.eq.${session.user.email},motherEmail.eq.${session.user.email}`);

    if (applicationsError) throw new Error(applicationsError.message);
    if (applications.length === 0) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const application = applications[0] as any;

    const { data: documentRows, error: documentsError } = await supabase
      .from(`${academicYear}_enrolment_documents`)
      .select("*")
      .eq("enroleeNumber", enroleeNumber);

    if (documentsError) throw new Error(documentsError.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = (documentRows?.[0] ?? {}) as any;

    // studentInfo — same field mapping as getStudentInformation, plus dietaryRestrictions
    // (a real column on the applications table — see buildEnrolmentApplicationPayload,
    // enrolment-payload.ts:239 — that the original fetcher never read back).
    const studentDetails = {
      firstName: application.firstName,
      middleName: application.middleName ?? "",
      lastName: application.lastName,
      birthDay: application.birthDay,
      preferredName: application.preferredName,
      gender: application.gender,
      primaryLanguage: application.primaryLanguage,
      religion: application.religion,
      religionOther: application.religionOther ?? null,
      nric: application.nric,
      dietaryRestrictions: application.dietaryRestrictions ?? "",
    };

    const addressContact = {
      homeAddress: application.homeAddress,
      postalCode: String(application.postalCode),
      nationality: application.nationality,
      homePhone: String(application.homePhone),
      contactPerson: application.contactPerson,
      contactPersonNumber: String(application.contactPersonNumber),
      livingWithWhom: application.livingWithWhom,
      parentMaritalStatus: application.parentMaritalStatus,
    };

    // medicalInformation — the medical checklist is flattened onto individual applications
    // columns on submit (buildEnrolmentApplicationPayload, enrolment-payload.ts:101-112), with
    // `none`/`other` deliberately stripped before insert; re-derive them the same way the form
    // itself keeps them in sync (`other` tracks whether its detail text is filled; `none` means
    // no condition — including `other` — is set).
    const otherMedicalConditions = application.otherMedicalConditions ?? "";
    const conditionFlags = {
      allergies: Boolean(application.allergies),
      asthma: Boolean(application.asthma),
      heartConditions: Boolean(application.heartConditions),
      epilepsy: Boolean(application.epilepsy),
      diabetes: Boolean(application.diabetes),
      eczema: Boolean(application.eczema),
      foodAllergies: Boolean(application.foodAllergies),
      other: Boolean(otherMedicalConditions),
    };
    const hasAnyCondition = Object.values(conditionFlags).some(Boolean);

    const medicalInformation = {
      medicalChecklist: {
        ...conditionFlags,
        none: !hasAnyCondition,
        allergyDetails: application.allergyDetails ?? "",
        foodAllergyDetails: application.foodAllergyDetails ?? "",
        otherMedicalConditions,
      },
      paracetamolConsent: Boolean(application.paracetamolConsent),
    };

    // familyInfo — same mother/father/guardian key-split + siblings as getFamilyInformation,
    // except booleans (e.g. motherWhatsappTeamsConsent) are kept as booleans instead of being
    // stringified — the original's `String(value)` turned `false` into the truthy string
    // "false", which callers' `Boolean(...)` coercion then read back as `true`.
    const motherInfo: Record<string, unknown> = {};
    const fatherInfo: Record<string, unknown> = {};
    const guardianInfo: Record<string, unknown> = {};
    const siblings = extractSiblings(application);

    Object.keys(application).forEach((key) => {
      const value = application[key];
      if (value == null || value === "") return;

      const normalizedValue = typeof value === "boolean" ? value : String(value);

      if (key.includes("mother")) motherInfo[key] = normalizedValue;
      else if (key.includes("father")) fatherInfo[key] = normalizedValue;
      else if (key.includes("guardian")) guardianInfo[key] = normalizedValue;
    });

    const familyInfoResult: Record<string, unknown> = {
      siblingsInfo: { siblings },
    };
    if (Object.keys(motherInfo).length) familyInfoResult.motherInfo = motherInfo;
    if (Object.keys(fatherInfo).length) familyInfoResult.fatherInfo = fatherInfo;
    if (Object.keys(guardianInfo).length) familyInfoResult.guardianInfo = guardianInfo;

    const familyInfo = removeEmptyKeys(familyInfoResult) as unknown as EnrolOldStudentFormState["familyInfo"];

    // studentUploadRequirements — same as getPreviousStudentDocuments
    const { passportNumber, pass: passType, passportExpiry, passExpiry } = application;
    const { medical, passport, birthCert, pass, educCert } = document;

    const studentUploadRequirements = removeEmptyKeys({
      birthCert: birthCert ?? "",
      medical: medical ?? "",
      educCert: educCert ?? "",
      passport: passport ?? "",
      passportNumber,
      passportExpiry: passportExpiry ?? "",
      pass: pass ?? "",
      passExpiry: passExpiry ?? "",
      passType: passType ?? "",
    });

    // parentGuardianUploadRequirements — same as getPreviousParentGuardianDocuments
    const motherDocuments = {
      ...removeEmptyKeys({
        motherPass: document.motherPass,
        motherPassType: application.motherPass,
        motherPassExpiry: application.motherPassExpiry,
      }),
      ...removeEmptyKeys({
        motherPassport: document.motherPassport,
        motherPassportNumber: application.motherPassport,
        motherPassportExpiry: application.motherPassportExpiry,
      }),
    };

    const fatherDocuments = {
      ...removeEmptyKeys({
        fatherPass: document.fatherPass,
        fatherPassType: application.fatherPass,
        fatherPassExpiry: application.fatherPassExpiry,
      }),
      ...removeEmptyKeys({
        fatherPassport: document.fatherPassport,
        fatherPassportNumber: application.fatherPassport,
        fatherPassportExpiry: application.fatherPassportExpiry,
      }),
    };

    const guardianDocuments = {
      ...removeEmptyKeys({
        guardianPass: document.guardianPass,
        guardianPassType: application.guardianPass,
        guardianPassExpiry: application.guardianPassExpiry,
      }),
      ...removeEmptyKeys({
        guardianPassport: document.guardianPassport,
        guardianPassportNumber: application.guardianPassport,
        guardianPassportExpiry: application.guardianPassportExpiry,
      }),
    };

    const parentGuardianUploadRequirements = {
      ...motherDocuments,
      ...fatherDocuments,
      ...guardianDocuments,
      hasFatherInfo: Object.keys(fatherInfo).length > 1,
      hasGuardianInfo: Object.keys(guardianInfo).length > 1,
    };

    return {
      studentInfo: { studentDetails, addressContact, medicalInformation } as EnrolOldStudentFormState["studentInfo"],
      familyInfo,
      studentUploadRequirements,
      parentGuardianUploadRequirements,
      levelApplied: application.levelApplied,
      fatherEmail: application.fatherEmail ?? null,
      guardianEmail: application.guardianEmail ?? null,
    };
  } catch (error) {
    const err = error as AuthError;
    toast.error(err.message);
  }
}
