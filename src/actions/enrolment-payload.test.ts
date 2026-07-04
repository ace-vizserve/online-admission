import { describe, expect, it } from "vitest";
import {
  buildEnrolmentApplicationPayload,
  buildStudentDocumentUpdatePayload,
  getFileValue,
  getStatus,
  type EnrolmentFlowConfig,
} from "./enrolment-payload";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HFSE_CONFIG: EnrolmentFlowConfig = {
  category: "New",
  includeMedicalInfo: true,
  includeLearningNeeds: true,
  includeStpFields: true,
};

const VIZ_CONFIG: EnrolmentFlowConfig = {
  category: "VizSchool New",
  includeMedicalInfo: false,
  includeLearningNeeds: false,
  includeStpFields: false,
  vizSchoolProgram: "Full Fee",
};

function fullHfseDetails(overrides: Record<string, unknown> = {}) {
  return {
    stpApplicationType: "",
    studentInfo: {
      studentDetails: {
        isValid: true,
        firstName: "Juan",
        lastName: "Dela Cruz",
        middleName: "Santos",
      },
      addressContact: {
        isValid: true,
        homeAddress: "123 Main St",
        postalCode: "123456",
        homePhone: "",
      },
      medicalInformation: {
        isValid: true,
        paracetamolConsent: true,
        medicalChecklist: {
          allergies: true,
          none: false,
          other: false,
          allergyDetails: "Peanuts",
        },
      },
    },
    familyInfo: {
      motherInfo: {
        motherFirstName: "Maria",
        motherLastName: "Dela Cruz",
        motherMiddleName: "Reyes",
      },
      fatherInfo: {
        isValid: true,
        fatherFirstName: "Jose",
        fatherLastName: "Dela Cruz",
        noFatherInfo: false,
      },
      guardianInfo: {
        noGuardianInfo: true,
      },
      siblingsInfo: {
        siblings: [
          {
            siblingFullName: "Ana Dela Cruz",
            siblingBirthDay: new Date("2015-01-01"),
            siblingReligion: "Other",
            siblingOtherReligion: "Iglesia",
            siblingSchoolCompany: "Some School",
            siblingEducationOccupation: "Student",
          },
        ],
      },
    },
    enrollmentInfo: {
      isValid: true,
      levelApplied: "Grade 1",
      discount: ["Sibling discount", "Referred by someone", "Early bird"],
      additionalLearningNeeds: ["Others (please specify)"],
      additionalLearningNeedsOthers: "Speech therapy",
    },
    uploadRequirements: {
      studentUploadRequirements: {
        isValid: true,
        idPicture: "https://files/id.png",
        birthCert: "https://files/birth.pdf",
        toFollowDocs: ["medical"],
      },
      parentGuardianUploadRequirements: {
        isValid: true,
        hasFatherInfo: true,
        hasGuardianInfo: false,
        toFollowDocs: [],
        motherPassport: "https://files/mother-passport.pdf",
        fatherPass: "https://files/father-pass.pdf",
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildEnrolmentApplicationPayload — undefined-safety (the reported crash)
// ---------------------------------------------------------------------------

describe("buildEnrolmentApplicationPayload — does not throw on missing slices", () => {
  it("returns a payload for a completely empty form-state", () => {
    expect(() => buildEnrolmentApplicationPayload({}, HFSE_CONFIG)).not.toThrow();
  });

  it("returns a payload for undefined form-state", () => {
    expect(() => buildEnrolmentApplicationPayload(undefined, HFSE_CONFIG)).not.toThrow();
  });

  it.each([
    "uploadRequirements",
    "studentInfo",
    "familyInfo",
    "enrollmentInfo",
  ])("does not throw when top-level slice '%s' is missing", (key) => {
    const details = fullHfseDetails();
    delete (details as Record<string, unknown>)[key];

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw when uploadRequirements.studentUploadRequirements is missing", () => {
    const details = fullHfseDetails();
    delete (details.uploadRequirements as Record<string, unknown>).studentUploadRequirements;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw when uploadRequirements.parentGuardianUploadRequirements is missing", () => {
    const details = fullHfseDetails();
    delete (details.uploadRequirements as Record<string, unknown>).parentGuardianUploadRequirements;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw when studentInfo.studentDetails is missing", () => {
    const details = fullHfseDetails();
    delete (details.studentInfo as Record<string, unknown>).studentDetails;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw when studentInfo.addressContact is missing", () => {
    const details = fullHfseDetails();
    delete (details.studentInfo as Record<string, unknown>).addressContact;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw when studentInfo.medicalInformation is missing (HFSE config)", () => {
    const details = fullHfseDetails();
    delete (details.studentInfo as Record<string, unknown>).medicalInformation;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw when familyInfo.motherInfo is missing (previously crashed on motherLastName.toUpperCase())", () => {
    const details = fullHfseDetails();
    delete (details.familyInfo as Record<string, unknown>).motherInfo;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();

    const built = buildEnrolmentApplicationPayload(details, HFSE_CONFIG);
    expect(built.names.enroleeFullName).toBe("DELA CRUZ, JUAN, SANTOS");
    expect(built.applicationInsertPayload.motherFullName).toBeUndefined();
  });

  it("does not throw when familyInfo.siblingsInfo is missing", () => {
    const details = fullHfseDetails();
    delete (details.familyInfo as Record<string, unknown>).siblingsInfo;

    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("does not throw for the VizSchool config, which has no medicalInformation/stp fields at all", () => {
    const details = fullHfseDetails();
    delete (details.studentInfo as Record<string, unknown>).medicalInformation;

    expect(() => buildEnrolmentApplicationPayload(details, VIZ_CONFIG)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildEnrolmentApplicationPayload — does not mutate the caller's form-state
// ---------------------------------------------------------------------------

describe("buildEnrolmentApplicationPayload — does not mutate input", () => {
  function deepFreeze<T>(value: T): T {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value as Record<string, unknown>).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  }

  it("does not throw when the entire form-state (mirroring the live Zustand store) is deep-frozen", () => {
    const details = deepFreeze(fullHfseDetails());

    // Submit dialogs shallow-spread `formState`, so nested slices are the same references
    // as the persisted store. Any `delete`/assignment on those slices would throw here
    // under strict mode against a frozen object — proving the builder never mutates input.
    expect(() => buildEnrolmentApplicationPayload(details, HFSE_CONFIG)).not.toThrow();
  });

  it("leaves a non-frozen input byte-for-byte identical after building", () => {
    const details = fullHfseDetails();
    const snapshotBefore = JSON.stringify(details);

    buildEnrolmentApplicationPayload(details, HFSE_CONFIG);

    expect(JSON.stringify(details)).toBe(snapshotBefore);
  });
});

// ---------------------------------------------------------------------------
// buildEnrolmentApplicationPayload — UI-only keys stripped
// ---------------------------------------------------------------------------

describe("buildEnrolmentApplicationPayload — strips UI-only keys", () => {
  it("omits isValid, noFatherInfo, noGuardianInfo, medicalChecklist.none/other, additionalLearningNeedsOthers, raw discount", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    const payload = built.applicationInsertPayload;

    expect(payload.isValid).toBeUndefined();
    expect(payload.noFatherInfo).toBeUndefined();
    expect(payload.noGuardianInfo).toBeUndefined();
    expect(payload.none).toBeUndefined();
    expect(payload.other).toBeUndefined();
    expect(payload.additionalLearningNeedsOthers).toBeUndefined();
    expect(payload.discount).toBeUndefined();
    expect(payload.hasFatherInfo).toBeUndefined();
    expect(payload.hasGuardianInfo).toBeUndefined();
  });

  it("strips isValid/hasFatherInfo/hasGuardianInfo from the returned parentGuardianUploadRequirements", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);

    expect(built.parentGuardianUploadRequirements.isValid).toBeUndefined();
    expect(built.parentGuardianUploadRequirements.hasFatherInfo).toBeUndefined();
    expect(built.parentGuardianUploadRequirements.hasGuardianInfo).toBeUndefined();
    // Real document fields survive.
    expect(built.parentGuardianUploadRequirements.motherPassport).toBe("https://files/mother-passport.pdf");
  });
});

// ---------------------------------------------------------------------------
// buildEnrolmentApplicationPayload — transforms
// ---------------------------------------------------------------------------

describe("buildEnrolmentApplicationPayload — transforms", () => {
  it("flattens siblings into siblingFullName1 etc., mapping 'Other' religion to the free-text value", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    const payload = built.applicationInsertPayload;

    expect(payload.siblingFullName1).toBe("Ana Dela Cruz");
    expect(payload.siblingReligion1).toBe("Iglesia");
  });

  it("flattens discounts into discountN keyed by original array index, excluding 'Referred by someone'", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    const payload = built.applicationInsertPayload;

    // discount = ["Sibling discount", "Referred by someone", "Early bird"]
    expect(payload.discount1).toBe("Sibling discount");
    expect(payload.discount2).toBeUndefined();
    expect(payload.discount3).toBe("Early bird");
  });

  it("joins additionalLearningNeeds into a comma string and sets otherLearningNeeds when 'Others (please specify)' is selected", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    const payload = built.applicationInsertPayload;

    expect(payload.additionalLearningNeeds).toBe("Others (please specify)");
    expect(payload.otherLearningNeeds).toBe("Speech therapy");
  });

  it("sets otherLearningNeeds to null when 'Others (please specify)' is not selected", () => {
    const details = fullHfseDetails({
      enrollmentInfo: {
        isValid: true,
        levelApplied: "Grade 1",
        additionalLearningNeeds: ["ADHD"],
        additionalLearningNeedsOthers: "should be ignored",
      },
    });
    const built = buildEnrolmentApplicationPayload(details, HFSE_CONFIG);

    expect(built.applicationInsertPayload.additionalLearningNeeds).toBe("ADHD");
    expect(built.applicationInsertPayload.otherLearningNeeds).toBeNull();
  });

  it("omits the learning-needs transform entirely when includeLearningNeeds is false (VizSchool)", () => {
    const details = fullHfseDetails();
    const built = buildEnrolmentApplicationPayload(details, VIZ_CONFIG);

    expect(built.applicationInsertPayload.additionalLearningNeeds).toBeUndefined();
    expect(built.applicationInsertPayload.otherLearningNeeds).toBeUndefined();
  });

  it("builds LAST, FIRST, MIDDLE uppercase full names for mother unconditionally", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    expect(built.applicationInsertPayload.motherFullName).toBe("DELA CRUZ, MARIA, REYES");
  });

  it("builds the father full name only when hasFatherInfo is true", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    expect(built.applicationInsertPayload.fatherFullName).toBe("DELA CRUZ, JOSE");
  });

  it("does not build a guardian full name when hasGuardianInfo is false", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    // motherFullName/fatherFullName/guardianFullName default to "" and removeEmptyKeys drops empty strings.
    expect(built.applicationInsertPayload.guardianFullName).toBeUndefined();
  });

  it("computes the student's enroleeFullName from studentDetails", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    expect(built.names.enroleeFullName).toBe("DELA CRUZ, JUAN, SANTOS");
    expect(built.applicationInsertPayload.enroleeFullName).toBe("DELA CRUZ, JUAN, SANTOS");
  });
});

// ---------------------------------------------------------------------------
// buildEnrolmentApplicationPayload — per-flow config
// ---------------------------------------------------------------------------

describe("buildEnrolmentApplicationPayload — flow config", () => {
  it("includes medical + STP fields only when configured (HFSE)", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    const payload = built.applicationInsertPayload;

    expect(payload.paracetamolConsent).toBe(true);
    expect(payload.allergies).toBe(true);
    expect(payload).toHaveProperty("stpApplicationStatus");
  });

  it("omits medical + STP fields for VizSchool config", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), VIZ_CONFIG);
    const payload = built.applicationInsertPayload;

    expect(payload.paracetamolConsent).toBeUndefined();
    expect(payload.allergies).toBeUndefined();
    expect(payload.stpApplicationType).toBeUndefined();
    expect(payload.stpApplicationStatus).toBeUndefined();
  });

  it("includes vizSchoolProgram only when configured", () => {
    const hfseBuilt = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    const vizBuilt = buildEnrolmentApplicationPayload(fullHfseDetails(), VIZ_CONFIG);

    expect(hfseBuilt.applicationInsertPayload.vizSchoolProgram).toBeUndefined();
    expect(vizBuilt.applicationInsertPayload.vizSchoolProgram).toBe("Full Fee");
  });

  it("reuses existingStudentNumber when configured (submitExistingEnrollment path)", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), {
      ...HFSE_CONFIG,
      category: "Current",
      existingStudentNumber: "H260001",
    });

    expect(built.applicationInsertPayload.studentNumber).toBe("H260001");
  });

  it("sets category to the configured value", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), VIZ_CONFIG);
    expect(built.applicationInsertPayload.category).toBe("VizSchool New");
  });

  it("always sets applicationStatus to Registered", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    expect(built.applicationInsertPayload.applicationStatus).toBe("Registered");
  });
});

// ---------------------------------------------------------------------------
// buildEnrolmentApplicationPayload — document fields returned for later steps
// ---------------------------------------------------------------------------

describe("buildEnrolmentApplicationPayload — returned document fields", () => {
  it("returns studentToFollowDocs and studentDocFields for the documents-table update", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);

    expect(built.studentToFollowDocs).toEqual(["medical"]);
    expect(built.studentDocFields.idPicture).toBe("https://files/id.png");
    expect(built.studentDocFields.birthCert).toBe("https://files/birth.pdf");
  });

  it("returns levelApplied for the status-table insert", () => {
    const built = buildEnrolmentApplicationPayload(fullHfseDetails(), HFSE_CONFIG);
    expect(built.levelApplied).toBe("Grade 1");
  });
});

// ---------------------------------------------------------------------------
// getFileValue / getStatus / buildStudentDocumentUpdatePayload
// ---------------------------------------------------------------------------

describe("getFileValue", () => {
  it("returns null for a to-follow doc regardless of file presence", () => {
    expect(getFileValue("https://file.pdf", "medical", ["medical"])).toBeNull();
  });

  it("returns the file value when not to-follow", () => {
    expect(getFileValue("https://file.pdf", "medical", [])).toBe("https://file.pdf");
  });

  it("returns null when no file and not to-follow", () => {
    expect(getFileValue(undefined, "medical", [])).toBeNull();
  });
});

describe("getStatus", () => {
  it("returns 'To follow' for a to-follow doc", () => {
    expect(getStatus("https://file.pdf", "medical", ["medical"])).toBe("To follow");
  });

  it("returns null when no file and not to-follow", () => {
    expect(getStatus(undefined, "medical", [])).toBeNull();
  });

  it("returns the valid label when a file is present and not to-follow", () => {
    expect(getStatus("https://file.pdf", "passport", [], "Valid")).toBe("Valid");
    expect(getStatus("https://file.pdf", "medical", [])).toBe("Uploaded");
  });
});

describe("buildStudentDocumentUpdatePayload", () => {
  const fields = {
    birthCert: "https://birth.pdf",
    idPicture: "https://id.png",
    medical: undefined,
    pass: undefined,
    passExpiry: undefined,
    passport: "https://passport.pdf",
    passportExpiry: "2030-01-01",
    educCert: undefined,
  };

  it("marks to-follow docs with null value + 'To follow' status", () => {
    const payload = buildStudentDocumentUpdatePayload(fields, ["birthCert"]);
    expect(payload.birthCert).toBeNull();
    expect(payload.birthCertStatus).toBe("To follow");
  });

  it("marks uploaded docs with the file value and the correct status label", () => {
    const payload = buildStudentDocumentUpdatePayload(fields, []);
    expect(payload.idPicture).toBe("https://id.png");
    expect(payload.idPictureStatus).toBe("Uploaded");
    expect(payload.passport).toBe("https://passport.pdf");
    expect(payload.passportStatus).toBe("Valid");
    expect(payload.passportExpiry).toBe("2030-01-01");
  });

  it("marks absent, non-to-follow docs as null value + null status", () => {
    const payload = buildStudentDocumentUpdatePayload(fields, []);
    expect(payload.medical).toBeNull();
    expect(payload.medicalStatus).toBeNull();
  });

  it("nulls out the expiry for a to-follow doc even if a value was carried over", () => {
    const payload = buildStudentDocumentUpdatePayload(fields, ["passport"]);
    expect(payload.passportExpiry).toBeNull();
  });
});
