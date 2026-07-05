import { applicationTypes } from "@/data";
import { supabase } from "@/lib/client";
import { flattenSiblings, removeEmptyKeys } from "@/lib/utils";
import { PreCourseDetails } from "@/types";
import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";

/**
 * Shared payload-building + document-write logic for `submitEnrollment`,
 * `submitExistingEnrollment`, and `submitVizSchoolEnrollment` (src/actions/private.ts).
 *
 * Those three functions are statically typed as if every wizard step's slice is
 * guaranteed present (`EnrolNewStudentFormState` etc. declare `studentInfo`, `familyInfo`,
 * `uploadRequirements`, etc. as required). In practice the persisted Zustand store is
 * `Partial<FormState>` — a step the user never visited/saved, or state left half-written by
 * a previous failed submit, means a slice can genuinely be `undefined` at runtime despite
 * what the static type claims. The previous implementation read straight through those
 * slices (`enrollmentDetails.uploadRequirements.studentUploadRequirements.isValid`) and
 * `delete`d nested keys directly on the caller's object, which:
 *
 *  1. threw `TypeError: Cannot read properties of undefined` the instant a slice was
 *     missing — *before* Supabase was ever touched, and
 *  2. mutated the live Zustand store in place, because submit dialogs only shallow-spread
 *     `formState` before calling submit (`{ ...formState, stpApplicationType }`), so every
 *     nested object is the same reference as the persisted store. A failed submit left the
 *     store missing keys, compounding on retry.
 *
 * Every accessor below defaults a missing slice to `{}`/`[]` and builds *new* objects
 * instead of deleting keys from the input, so a partial form-state can never throw here and
 * the caller's store is never touched.
 */

function obj(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function upper(value: unknown): string {
  return typeof value === "string" ? value.toUpperCase() : "";
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export type EnrolmentFlowConfig = {
  /** Value written to the `category` column. */
  category: "New" | "Current" | "VizSchool New" | "VizSchool Current";
  /** HFSE-IS flows carry a medical checklist; VizSchool's schema has none. */
  includeMedicalInfo: boolean;
  /** HFSE-IS `enrollmentInfo` has `additionalLearningNeeds`; VizSchool's schema omits it. */
  includeLearningNeeds: boolean;
  /** HFSE-IS flows carry Student Pass application fields; VizSchool does not. */
  includeStpFields: boolean;
  /** HFSE-IS only — pre-course acknowledgement fields spread into the insert. */
  preCourseDetails?: PreCourseDetails;
  /** VizSchool only — written to the `vizSchoolProgram` column. */
  vizSchoolProgram?: string;
  /** `submitExistingEnrollment` reuses the student's existing studentNumber instead of generating one. */
  existingStudentNumber?: string;
};

/**
 * Reshapes a wizard's accumulated form-state into the payload the `_enrolment_applications`
 * insert expects, plus everything the caller needs for the follow-up document/status writes.
 * Never throws on a missing slice; never mutates `details`.
 */
export function buildEnrolmentApplicationPayload(details: unknown, config: EnrolmentFlowConfig) {
  const root = obj(details);

  // ---- student upload requirements (document file/URL fields) ---------------------------
  const studentUploadRequirements = obj(obj(root.uploadRequirements).studentUploadRequirements);
  const {
    birthCert,
    idPicture,
    medical,
    pass,
    passExpiry,
    passType,
    passport,
    passportExpiry,
    passportNumber,
    educCert,
  } = studentUploadRequirements;
  const studentToFollowDocs = arr(studentUploadRequirements.toFollowDocs) as string[];

  // ---- student details --------------------------------------------------------------------
  const studentDetailsSlice = obj(obj(root.studentInfo).studentDetails);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isValid: _studentDetailsIsValid, ...studentDetailsClean } = studentDetailsSlice;

  // ---- address & contact (cleaned of empty values) ----------------------------------------
  const addressContactSlice = obj(obj(root.studentInfo).addressContact);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isValid: _addressContactIsValid, ...addressContactRaw } = addressContactSlice;
  const cleanedAddressContact = removeEmptyKeys(addressContactRaw);

  // ---- medical checklist (HFSE-IS only) ----------------------------------------------------
  let medicalFields: Record<string, unknown> = {};
  if (config.includeMedicalInfo) {
    const medicalInformation = obj(obj(root.studentInfo).medicalInformation);
    const medicalChecklist = obj(medicalInformation.medicalChecklist);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { none: _none, other: _other, ...medicalChecklistClean } = medicalChecklist;
    medicalFields = {
      ...medicalChecklistClean,
      paracetamolConsent: medicalInformation.paracetamolConsent,
    };
  }

  // ---- family info: mother/father/guardian/siblings, merged + full names computed --------
  const familyInfoSlice = obj(root.familyInfo);
  const motherInfo = obj(familyInfoSlice.motherInfo);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { noFatherInfo: _noFatherInfo, ...fatherInfo } = obj(familyInfoSlice.fatherInfo);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { noGuardianInfo: _noGuardianInfo, ...guardianInfo } = obj(familyInfoSlice.guardianInfo);
  const siblings = arr(obj(familyInfoSlice.siblingsInfo).siblings);
  const flattenedSiblings = siblings.length
    ? flattenSiblings(siblings as Parameters<typeof flattenSiblings>[0])
    : {};

  const familyInfo: Record<string, unknown> = {
    motherFullName: "",
    fatherFullName: "",
    guardianFullName: "",
    ...motherInfo,
    ...fatherInfo,
    ...guardianInfo,
    ...flattenedSiblings,
  };

  if (familyInfo.motherMiddleName == null) delete familyInfo.motherMiddleName;
  if (familyInfo.fatherMiddleName == null) delete familyInfo.fatherMiddleName;
  if (familyInfo.guardianMiddleName == null) delete familyInfo.guardianMiddleName;
  delete familyInfo.isValid;

  const parentGuardianUploadRequirementsSlice = obj(obj(root.uploadRequirements).parentGuardianUploadRequirements);
  const hasFatherInfo = Boolean(parentGuardianUploadRequirementsSlice.hasFatherInfo);
  const hasGuardianInfo = Boolean(parentGuardianUploadRequirementsSlice.hasGuardianInfo);
  const parentGuardianToFollowDocs = arr(parentGuardianUploadRequirementsSlice.toFollowDocs) as string[];

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isValid: _pgIsValid,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasFatherInfo: _hasFatherInfo,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasGuardianInfo: _hasGuardianInfo,
    ...parentGuardianUploadRequirements
  } = parentGuardianUploadRequirementsSlice;

  // Every parent/guardian full name is guarded the same way now. Previously mother's was
  // built unconditionally with no optional chaining (`familyInfo.motherLastName.toUpperCase()`)
  // while father/guardian were guarded — that threw if mother info was ever absent.
  if (familyInfo.fatherLastName && hasFatherInfo) {
    const middle = upper(familyInfo.fatherMiddleName);
    familyInfo.fatherFullName = `${upper(familyInfo.fatherLastName)}, ${upper(familyInfo.fatherFirstName)}${
      middle ? `, ${middle}` : ""
    }`;
  }

  if (hasGuardianInfo) {
    const middle = upper(familyInfo.guardianMiddleName);
    familyInfo.guardianFullName = `${upper(familyInfo.guardianLastName)}, ${upper(familyInfo.guardianFirstName)}${
      middle ? `, ${middle}` : ""
    }`;
  }

  // Guarded the same way as father/guardian above — mother previously assumed always-present
  // and built `${familyInfo.motherLastName.toUpperCase()}...` unconditionally, which threw if
  // mother info was ever absent. An absent mother now just leaves motherFullName as "" (the
  // default set above), which removeEmptyKeys drops, instead of crashing or writing "` , `".
  if (familyInfo.motherLastName || familyInfo.motherFirstName) {
    const middle = upper(familyInfo.motherMiddleName);
    familyInfo.motherFullName = `${upper(familyInfo.motherLastName)}, ${upper(familyInfo.motherFirstName)}${
      middle ? `, ${middle}` : ""
    }`;
  }

  const cleanedFamilyInfo = removeEmptyKeys(familyInfo);

  // ---- enrollment info: discounts flattened, learning needs joined (HFSE-IS only) --------
  const enrollmentInfoSlice = obj(root.enrollmentInfo);
  const discounts = arr(enrollmentInfoSlice.discount) as (string | undefined)[];
  const flattenedDiscounts: Record<string, unknown> = {};
  discounts.forEach((discount, index) => {
    if (!discount?.includes("Referred by someone")) {
      flattenedDiscounts[`discount${index + 1}`] = discount;
    }
  });

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isValid: _enrollmentInfoIsValid,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    discount: _discount,
    additionalLearningNeedsOthers,
    additionalLearningNeeds,
    ...restEnrollmentInfo
  } = enrollmentInfoSlice;

  const learningNeedsFields: Record<string, unknown> = {};
  if (config.includeLearningNeeds && Array.isArray(additionalLearningNeeds)) {
    learningNeedsFields.additionalLearningNeeds = additionalLearningNeeds.join(", ");
    learningNeedsFields.otherLearningNeeds = additionalLearningNeeds.includes("Others (please specify)")
      ? additionalLearningNeedsOthers
      : null;
  }

  const enrollmentInfoClean = {
    ...restEnrollmentInfo,
    ...flattenedDiscounts,
    ...learningNeedsFields,
  };

  // ---- names ---------------------------------------------------------------------------
  const firstName = upper(studentDetailsClean.firstName);
  const lastName = upper(studentDetailsClean.lastName);
  const middleName = upper(studentDetailsClean.middleName);
  const enroleeFullName = `${lastName}, ${firstName}${middleName ? `, ${middleName}` : ""}`;

  // ---- STP application fields (HFSE-IS only) -----------------------------------------------
  const stpFields: Record<string, unknown> = {};
  if (config.includeStpFields) {
    const stpApplicationType = applicationTypes.includes(str(root.stpApplicationType))
      ? (root.stpApplicationType as string)
      : null;
    stpFields.stpApplicationType = stpApplicationType;
    stpFields.stpApplicationStatus = stpApplicationType ? "Pending" : null;
  }

  const applicationInsertPayload: Record<string, unknown> = {
    ...(config.existingStudentNumber ? { studentNumber: config.existingStudentNumber } : {}),
    ...(config.preCourseDetails ?? {}),
    ...studentDetailsClean,
    ...cleanedAddressContact,
    ...medicalFields,
    enroleeFullName,
    ...stpFields,
    enroleePhoto: idPicture,
    category: config.category,
    pass: passType,
    passExpiry,
    passportNumber,
    passportExpiry,
    ...cleanedFamilyInfo,
    ...enrollmentInfoClean,
    applicationStatus: "Registered",
    ...(config.vizSchoolProgram !== undefined ? { vizSchoolProgram: config.vizSchoolProgram } : {}),
  };

  return {
    applicationInsertPayload,
    names: { firstName, lastName, middleName, enroleeFullName },
    studentDocFields: { birthCert, idPicture, medical, pass, passExpiry, passport, passportExpiry, educCert },
    studentToFollowDocs,
    parentGuardianUploadRequirements,
    parentGuardianToFollowDocs,
    levelApplied: enrollmentInfoSlice.levelApplied,
  };
}

export type BuiltEnrolmentPayload = ReturnType<typeof buildEnrolmentApplicationPayload>;

// ---------------------------------------------------------------------------------------------
// Document status helpers (student docs + per-parent/guardian docs)
// ---------------------------------------------------------------------------------------------

export function getFileValue(file: unknown, docKey: string, toFollowDocs: string[]) {
  return toFollowDocs.includes(docKey) ? null : file || null;
}

export function getStatus(
  file: unknown,
  docKey: string,
  toFollowDocs: string[],
  validLabel: "Uploaded" | "Valid" = "Uploaded",
) {
  if (toFollowDocs.includes(docKey)) return "To follow";
  if (!file) return null;
  return validLabel;
}

export function buildStudentDocumentUpdatePayload(
  fields: BuiltEnrolmentPayload["studentDocFields"],
  toFollowDocs: string[],
) {
  const isToFollow = (docKey: string) => toFollowDocs.includes(docKey);

  return {
    medical: getFileValue(fields.medical, "medical", toFollowDocs),
    medicalStatus: getStatus(fields.medical, "medical", toFollowDocs),

    passport: getFileValue(fields.passport, "passport", toFollowDocs),
    passportExpiry: isToFollow("passport") ? null : fields.passportExpiry,
    passportStatus: getStatus(fields.passport, "passport", toFollowDocs, "Valid"),

    pass: getFileValue(fields.pass, "pass", toFollowDocs),
    passExpiry: isToFollow("pass") ? null : fields.passExpiry,
    passStatus: getStatus(fields.pass, "pass", toFollowDocs, "Valid"),

    birthCert: getFileValue(fields.birthCert, "birthCert", toFollowDocs),
    birthCertStatus: getStatus(fields.birthCert, "birthCert", toFollowDocs),

    educCert: getFileValue(fields.educCert, "educCert", toFollowDocs),
    educCertStatus: getStatus(fields.educCert, "educCert", toFollowDocs),

    idPicture: getFileValue(fields.idPicture, "idPicture", toFollowDocs),
    idPictureStatus: getStatus(fields.idPicture, "idPicture", toFollowDocs),
  };
}

function handleError(error: PostgrestError | null) {
  if (error) {
    toast.error(error.message);
    throw new Error(error.message);
  }
}

/**
 * Writes one parent/guardian's pass/passport fields to both the applications row and the
 * documents row. Shared by all three submit functions (previously copy-pasted three times
 * each, byte-for-byte identical).
 */
export async function processParentGuardian({
  role,
  documents,
  toFollowDocs,
  academicYear,
  studentNumber,
  enroleeNumber,
}: {
  role: "mother" | "father" | "guardian";
  documents: Record<string, unknown> | undefined;
  toFollowDocs: string[];
  academicYear: string;
  studentNumber: string | null | undefined;
  enroleeNumber: string;
}) {
  if (!documents || Object.keys(documents).length <= 1) return;

  const isToFollow = (docKey: string) => toFollowDocs.includes(docKey);
  const passKey = `${role}Pass`;
  const passportKey = `${role}Passport`;

  const passType = documents[`${role}PassType`];
  const passExpiry = documents[`${role}PassExpiry`];
  const passportNumber = documents[`${role}PassportNumber`];
  const passportExpiry = documents[`${role}PassportExpiry`];

  const { error: applicationError } = await supabase
    .from(`${academicYear}_enrolment_applications`)
    .update({
      [`${role}Pass`]: getFileValue(passType, passKey, toFollowDocs),
      [`${role}PassExpiry`]: isToFollow(passKey) ? null : passExpiry,
      [`${role}Passport`]: getFileValue(passportNumber, passportKey, toFollowDocs),
      [`${role}PassportExpiry`]: isToFollow(passportKey) ? null : passportExpiry,
    })
    .eq("studentNumber", studentNumber)
    .eq("enroleeNumber", enroleeNumber);

  handleError(applicationError);

  const { error: documentError } = await supabase
    .from(`${academicYear}_enrolment_documents`)
    .update({
      [`${role}Passport`]: getFileValue(documents[`${role}Passport`], passportKey, toFollowDocs),
      [`${role}PassportExpiry`]: isToFollow(passportKey) ? null : documents[`${role}PassportExpiry`],
      [`${role}PassportStatus`]: getStatus(documents[`${role}Passport`], passportKey, toFollowDocs, "Valid"),

      [`${role}Pass`]: getFileValue(documents[`${role}Pass`], passKey, toFollowDocs),
      [`${role}PassExpiry`]: isToFollow(passKey) ? null : documents[`${role}PassExpiry`],
      [`${role}PassStatus`]: getStatus(documents[`${role}Pass`], passKey, toFollowDocs, "Valid"),
    })
    .eq("studentNumber", studentNumber)
    .eq("enroleeNumber", enroleeNumber);

  handleError(documentError);
}
