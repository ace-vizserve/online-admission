// Deno edge functions can't import from `src/` — this is a deliberate, faithful port of
// `src/actions/enrolment-payload.ts` + the handful of `src/lib/utils.ts` helpers it depends
// on, kept byte-for-byte equivalent in behavior. If the client-side version changes, mirror
// the change here too.
//
// deno-lint-ignore-file no-explicit-any

export const APPLICATION_TYPES = [
  "New Student Pass Application",
  "New STP Application (Current HFSE Student)",
  "Student Pass Transfer Application",
];

function obj(value: unknown): Record<string, any> {
  return value != null && typeof value === "object" ? (value as Record<string, any>) : {};
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

export function removeEmptyKeys(record: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};

  const bigintFields = [
    "contactPersonNumber",
    "fatherMobile",
    "motherMobile",
    "guardianMobile",
    "homePhone",
    "postalCode",
  ];

  Object.entries(record).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "" || value === "null") return;
    if (bigintFields.includes(key) && isNaN(Number(value))) return;
    cleaned[key] = value;
  });

  return cleaned;
}

export function flattenSiblings(siblings: any[]) {
  const flattened: Record<string, unknown> = {};

  siblings.slice(0, 5).forEach((sibling, index) => {
    const i = index + 1;
    const religion =
      sibling.siblingReligion === "Other" && sibling.siblingOtherReligion
        ? sibling.siblingOtherReligion
        : sibling.siblingReligion;

    flattened[`siblingFullName${i}`] = sibling.siblingFullName;
    flattened[`siblingBirthDay${i}`] = sibling.siblingBirthDay;
    flattened[`siblingReligion${i}`] = religion;
    flattened[`siblingSchoolCompany${i}`] = sibling.siblingSchoolCompany;
    flattened[`siblingEducationOccupation${i}`] = sibling.siblingEducationOccupation;
  });

  return flattened;
}

export function filterKeysBySubstring(record: Record<string, unknown>, substring: string) {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key.includes(substring)));
}

export type EnrolmentFlowConfig = {
  category: "New" | "Current" | "VizSchool New" | "VizSchool Current";
  includeMedicalInfo: boolean;
  includeLearningNeeds: boolean;
  includeStpFields: boolean;
  preCourseDetails?: Record<string, unknown>;
  vizSchoolProgram?: string;
  existingStudentNumber?: string;
};

/**
 * Reshapes the recovery page's accumulated form state into the payload the
 * `_enrolment_applications` insert/update expects, plus everything the caller needs for the
 * follow-up document writes. Mirrors `buildEnrolmentApplicationPayload` in
 * `src/actions/enrolment-payload.ts` — see that file for the full rationale of each guard.
 */
export function buildEnrolmentApplicationPayload(details: unknown, config: EnrolmentFlowConfig) {
  const root = obj(details);

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

  const studentDetailsSlice = obj(obj(root.studentInfo).studentDetails);
  const { isValid: _studentDetailsIsValid, ...studentDetailsClean } = studentDetailsSlice;

  const addressContactSlice = obj(obj(root.studentInfo).addressContact);
  const { isValid: _addressContactIsValid, ...addressContactRaw } = addressContactSlice;
  const cleanedAddressContact = removeEmptyKeys(addressContactRaw);

  let medicalFields: Record<string, unknown> = {};
  if (config.includeMedicalInfo) {
    const medicalInformation = obj(obj(root.studentInfo).medicalInformation);
    const medicalChecklist = obj(medicalInformation.medicalChecklist);
    const { none: _none, other: _other, ...medicalChecklistClean } = medicalChecklist;
    medicalFields = {
      ...medicalChecklistClean,
      paracetamolConsent: medicalInformation.paracetamolConsent,
    };
  }

  const familyInfoSlice = obj(root.familyInfo);
  const motherInfo = obj(familyInfoSlice.motherInfo);
  const { noFatherInfo: _noFatherInfo, ...fatherInfo } = obj(familyInfoSlice.fatherInfo);
  const { noGuardianInfo: _noGuardianInfo, ...guardianInfo } = obj(familyInfoSlice.guardianInfo);
  const siblings = arr(obj(familyInfoSlice.siblingsInfo).siblings);
  const flattenedSiblings = siblings.length ? flattenSiblings(siblings as any[]) : {};

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
    isValid: _pgIsValid,
    hasFatherInfo: _hasFatherInfo,
    hasGuardianInfo: _hasGuardianInfo,
    ...parentGuardianUploadRequirements
  } = parentGuardianUploadRequirementsSlice;

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

  if (familyInfo.motherLastName || familyInfo.motherFirstName) {
    const middle = upper(familyInfo.motherMiddleName);
    familyInfo.motherFullName = `${upper(familyInfo.motherLastName)}, ${upper(familyInfo.motherFirstName)}${
      middle ? `, ${middle}` : ""
    }`;
  }

  const cleanedFamilyInfo = removeEmptyKeys(familyInfo);

  const enrollmentInfoSlice = obj(root.enrollmentInfo);
  const discounts = arr(enrollmentInfoSlice.discount) as (string | undefined)[];
  const flattenedDiscounts: Record<string, unknown> = {};
  discounts.forEach((discount, index) => {
    if (!discount?.includes("Referred by someone")) {
      flattenedDiscounts[`discount${index + 1}`] = discount;
    }
  });

  const {
    isValid: _enrollmentInfoIsValid,
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

  const firstName = upper(studentDetailsClean.firstName);
  const lastName = upper(studentDetailsClean.lastName);
  const middleName = upper(studentDetailsClean.middleName);
  const enroleeFullName = `${lastName}, ${firstName}${middleName ? `, ${middleName}` : ""}`;

  const stpFields: Record<string, unknown> = {};
  if (config.includeStpFields) {
    const stpApplicationType = APPLICATION_TYPES.includes(str(root.stpApplicationType))
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

/**
 * Writes one parent/guardian's pass/passport fields to both the applications row and the
 * documents row. Mirrors `processParentGuardian` in `src/actions/enrolment-payload.ts`, but
 * takes the service-role client as a parameter (no shared module-level `supabase` import
 * available in an edge function) and returns the first error instead of toasting.
 */
export async function processParentGuardian(
  supabaseAdmin: any,
  {
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
  },
): Promise<string | null> {
  if (!documents || Object.keys(documents).length <= 1) return null;

  const isToFollow = (docKey: string) => toFollowDocs.includes(docKey);
  const passKey = `${role}Pass`;
  const passportKey = `${role}Passport`;

  const passType = documents[`${role}PassType`];
  const passExpiry = documents[`${role}PassExpiry`];
  const passportNumber = documents[`${role}PassportNumber`];
  const passportExpiry = documents[`${role}PassportExpiry`];

  const { error: applicationError } = await supabaseAdmin
    .from(`${academicYear}_enrolment_applications`)
    .update({
      [`${role}Pass`]: getFileValue(passType, passKey, toFollowDocs),
      [`${role}PassExpiry`]: isToFollow(passKey) ? null : passExpiry,
      [`${role}Passport`]: getFileValue(passportNumber, passportKey, toFollowDocs),
      [`${role}PassportExpiry`]: isToFollow(passportKey) ? null : passportExpiry,
    })
    .eq("studentNumber", studentNumber)
    .eq("enroleeNumber", enroleeNumber);

  if (applicationError) return applicationError.message;

  const { error: documentError } = await supabaseAdmin
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

  if (documentError) return documentError.message;
  return null;
}

/** category → EnrolmentFlowConfig booleans, mirroring the call sites in `src/actions/private.ts`. */
export function configForCategory(
  category: EnrolmentFlowConfig["category"],
  extra: { preCourseDetails?: Record<string, unknown>; vizSchoolProgram?: string; existingStudentNumber?: string },
): EnrolmentFlowConfig {
  const isHfseIs = category === "New" || category === "Current";
  return {
    category,
    includeMedicalInfo: isHfseIs,
    includeLearningNeeds: isHfseIs,
    includeStpFields: isHfseIs,
    ...extra,
  };
}

/**
 * Columns that are unconditionally required on every `_enrolment_applications` row, grouped
 * by the recovery form tab that collects them (mirrors `recoveryFormSchema` in
 * src/zod-schema.ts and the original wizard's 4-tab grouping). Deliberately excludes
 * father/guardian columns: those are legitimately null when a parent has no father/guardian
 * info to give, and there's no column that distinguishes "intentionally absent" from
 * "started but never finished" — checking them would misreport every single-parent family
 * as an incomplete record.
 */
const REQUIRED_APPLICATION_FIELDS_BY_SECTION: Record<string, string[]> = {
  studentInfo: [
    "firstName",
    "lastName",
    "preferredName",
    "birthDay",
    "gender",
    "primaryLanguage",
    "religion",
    "homeAddress",
    "postalCode",
    "homePhone",
    "contactPerson",
    "contactPersonNumber",
    "livingWithWhom",
    "parentMaritalStatus",
  ],
  familyInfo: [
    "motherFirstName",
    "motherLastName",
    "motherBirthDay",
    "motherNationality",
    "motherReligion",
    "motherNric",
    "motherMobile",
    "motherEmail",
    "motherCompanyName",
    "motherPosition",
  ],
  enrollmentInfo: [
    "levelApplied",
    "classType",
    "preferredSchedule",
    "availSchoolBus",
    "availStudentCare",
    "paymentOption",
    "contractSignatory",
    "preferredPaymentScheme",
    "preferredPaymentMethod",
  ],
};

function isSectionIncomplete(application: Record<string, any>, section: string): boolean {
  if (section === "studentInfo" && application.paracetamolConsent == null) return true;
  return (REQUIRED_APPLICATION_FIELDS_BY_SECTION[section] ?? []).some((field) => {
    const value = application[field];
    return value == null || value === "";
  });
}

/** Which of studentInfo/familyInfo/enrollmentInfo are missing required fields on this row. */
export function incompleteApplicationSections(application: Record<string, any>): string[] {
  return Object.keys(REQUIRED_APPLICATION_FIELDS_BY_SECTION).filter((section) =>
    isSectionIncomplete(application, section),
  );
}

/**
 * True when an existing `_enrolment_applications` row is missing one or more required
 * fields — i.e. the row was created but the form was never finished.
 */
export function isApplicationIncomplete(application: Record<string, any>): boolean {
  return incompleteApplicationSections(application).length > 0;
}

function extractSiblings(application: Record<string, any>) {
  const siblings: Record<string, unknown>[] = [];
  if (application?.siblingFullName1 == null) return siblings;

  for (let i = 1; i <= 5; i++) {
    const siblingFullName = application[`siblingFullName${i}`] ?? "";
    const siblingBirthDay = application[`siblingBirthDay${i}`] ?? "";
    const siblingReligion = application[`siblingReligion${i}`] ?? "";
    const siblingEducationOccupation = application[`siblingEducationOccupation${i}`] ?? "";
    const siblingSchoolCompany = application[`siblingSchoolCompany${i}`] ?? "";

    if (siblingFullName || siblingBirthDay || siblingReligion || siblingEducationOccupation || siblingSchoolCompany) {
      siblings.push({ siblingFullName, siblingBirthDay, siblingReligion, siblingEducationOccupation, siblingSchoolCompany });
    }
  }

  return siblings;
}

/**
 * Reshapes an existing (possibly incomplete) `_enrolment_applications` row — plus its
 * `_enrolment_documents` row, if any — back into the nested form-state shape
 * `recoveryFormSchema` expects, so the recovery page can prefill instead of asking the parent
 * to re-type data that's already saved. Mirrors `getReEnrollmentData`
 * (src/actions/get-reenrollment-data.ts), extended with the enrollment-info and upload
 * fields that flow needed via a separate fetch but this one folds in directly.
 */
export function mapApplicationToFormState(
  application: Record<string, any> | null,
  document: Record<string, any> | null,
) {
  const app = application ?? {};
  const doc = document ?? {};

  const studentDetails = {
    firstName: app.firstName ?? "",
    middleName: app.middleName ?? "",
    lastName: app.lastName ?? "",
    preferredName: app.preferredName ?? "",
    birthDay: app.birthDay ?? undefined,
    gender: app.gender ?? "",
    primaryLanguage: app.primaryLanguage ?? "",
    religion: app.religion ?? "",
    religionOther: app.religionOther ?? "",
    nric: app.nric ?? "",
    dietaryRestrictions: app.dietaryRestrictions ?? "",
  };

  const addressContact = {
    homeAddress: app.homeAddress ?? "",
    postalCode: app.postalCode != null ? String(app.postalCode) : "",
    nationality: app.nationality ?? "",
    homePhone: app.homePhone != null ? String(app.homePhone) : "",
    contactPerson: app.contactPerson ?? "",
    contactPersonNumber: app.contactPersonNumber != null ? String(app.contactPersonNumber) : "",
    livingWithWhom: app.livingWithWhom ?? "",
    parentMaritalStatus: app.parentMaritalStatus ?? "",
  };

  const otherMedicalConditions = app.otherMedicalConditions ?? "";
  const conditionFlags = {
    allergies: Boolean(app.allergies),
    asthma: Boolean(app.asthma),
    heartConditions: Boolean(app.heartConditions),
    epilepsy: Boolean(app.epilepsy),
    diabetes: Boolean(app.diabetes),
    eczema: Boolean(app.eczema),
    foodAllergies: Boolean(app.foodAllergies),
    other: Boolean(otherMedicalConditions),
  };
  const hasAnyCondition = Object.values(conditionFlags).some(Boolean);

  const medicalInformation = {
    medicalChecklist: {
      ...conditionFlags,
      none: !hasAnyCondition,
      allergyDetails: app.allergyDetails ?? "",
      foodAllergyDetails: app.foodAllergyDetails ?? "",
      otherMedicalConditions,
    },
    paracetamolConsent: app.paracetamolConsent ?? false,
  };

  const motherInfo = {
    motherFirstName: app.motherFirstName ?? "",
    motherMiddleName: app.motherMiddleName ?? "",
    motherLastName: app.motherLastName ?? "",
    motherPreferredName: app.motherPreferredName ?? "",
    motherBirthDay: app.motherBirthDay ?? undefined,
    motherNationality: app.motherNationality ?? "",
    motherReligion: app.motherReligion ?? "",
    motherNric: app.motherNric ?? "",
    motherMobile: app.motherMobile ?? "",
    motherEmail: app.motherEmail ?? "",
    motherCompanyName: app.motherCompanyName ?? "",
    motherPosition: app.motherPosition ?? "",
  };

  const hasFatherInfo = Boolean(app.fatherFirstName);
  const fatherInfo = {
    noFatherInfo: !hasFatherInfo,
    fatherFirstName: app.fatherFirstName ?? "",
    fatherMiddleName: app.fatherMiddleName ?? "",
    fatherLastName: app.fatherLastName ?? "",
    fatherPreferredName: app.fatherPreferredName ?? "",
    fatherBirthDay: app.fatherBirthDay ?? undefined,
    fatherNationality: app.fatherNationality ?? "",
    fatherReligion: app.fatherReligion ?? "",
    fatherNric: app.fatherNric ?? "",
    fatherMobile: app.fatherMobile ?? "",
    fatherEmail: app.fatherEmail ?? "",
    fatherCompanyName: app.fatherCompanyName ?? "",
    fatherPosition: app.fatherPosition ?? "",
  };

  const hasGuardianInfo = Boolean(app.guardianFirstName);
  const guardianInfo = {
    noGuardianInfo: !hasGuardianInfo,
    guardianFirstName: app.guardianFirstName ?? "",
    guardianMiddleName: app.guardianMiddleName ?? "",
    guardianLastName: app.guardianLastName ?? "",
    guardianPreferredName: app.guardianPreferredName ?? "",
    guardianBirthDay: app.guardianBirthDay ?? undefined,
    guardianNationality: app.guardianNationality ?? "",
    guardianReligion: app.guardianReligion ?? "",
    guardianNric: app.guardianNric ?? "",
    guardianMobile: app.guardianMobile ?? "",
    guardianEmail: app.guardianEmail ?? "",
    guardianCompanyName: app.guardianCompanyName ?? "",
    guardianPosition: app.guardianPosition ?? "",
  };

  const enrollmentInfo = {
    levelApplied: app.levelApplied ?? "",
    classType: app.classType ?? "",
    preferredSchedule: app.preferredSchedule ?? "",
    availSchoolBus: app.availSchoolBus ?? "",
    availStudentCare: app.availStudentCare ?? "",
    studentCareProgram: app.studentCareProgram ?? "",
    paymentOption: app.paymentOption ?? "",
    contractSignatory: app.contractSignatory ?? "",
    socialMediaConsent: app.socialMediaConsent ?? false,
    preferredPaymentScheme: app.preferredPaymentScheme ?? "",
    preferredPaymentMethod: app.preferredPaymentMethod ?? "",
  };

  const studentUploadRequirements = {
    idPicture: app.enroleePhoto ?? doc.idPicture ?? undefined,
    birthCert: doc.birthCert ?? undefined,
    educCert: doc.educCert ?? undefined,
    medical: doc.medical ?? undefined,
    passport: doc.passport ?? undefined,
    passportNumber: app.passportNumber ?? "",
    passportExpiry: app.passportExpiry ?? undefined,
    pass: doc.pass ?? undefined,
    passType: app.pass ?? "",
    passExpiry: app.passExpiry ?? undefined,
    toFollowDocs: [],
  };

  const parentGuardianUploadRequirements = {
    motherPassport: doc.motherPassport ?? undefined,
    motherPassportNumber: app.motherPassport ?? "",
    motherPassportExpiry: app.motherPassportExpiry ?? undefined,
    motherPass: doc.motherPass ?? undefined,
    motherPassType: app.motherPass ?? "",
    motherPassExpiry: app.motherPassExpiry ?? undefined,
    fatherPassport: doc.fatherPassport ?? undefined,
    fatherPassportNumber: app.fatherPassport ?? "",
    fatherPassportExpiry: app.fatherPassportExpiry ?? undefined,
    fatherPass: doc.fatherPass ?? undefined,
    fatherPassType: app.fatherPass ?? "",
    fatherPassExpiry: app.fatherPassExpiry ?? undefined,
    guardianPassport: doc.guardianPassport ?? undefined,
    guardianPassportNumber: app.guardianPassport ?? "",
    guardianPassportExpiry: app.guardianPassportExpiry ?? undefined,
    guardianPass: doc.guardianPass ?? undefined,
    guardianPassType: app.guardianPass ?? "",
    guardianPassExpiry: app.guardianPassExpiry ?? undefined,
    hasFatherInfo,
    hasGuardianInfo,
    toFollowDocs: [],
  };

  return {
    studentInfo: { studentDetails, addressContact, medicalInformation },
    familyInfo: { motherInfo, fatherInfo, guardianInfo, siblingsInfo: { siblings: extractSiblings(app) } },
    enrollmentInfo,
    uploadRequirements: { studentUploadRequirements, parentGuardianUploadRequirements },
  };
}
