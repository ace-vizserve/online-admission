import { describe, expect, it } from "vitest";
import { getStepValidity, isFatherInfoSatisfied, stepKeyFromUrl } from "./step-validity";

// ---------------------------------------------------------------------------
// stepKeyFromUrl
// ---------------------------------------------------------------------------

describe("stepKeyFromUrl", () => {
  it.each([
    ["/enrol-student/new/student-info", "studentInfo"],
    ["/enrol-student/new/family-info", "familyInfo"],
    ["/enrol-student/new/enrollment-info", "enrollmentInfo"],
    ["/enrol-student/new/upload-requirements", "uploadRequirements"],
    ["/vizschool/enrol-student/new/student-info", "studentInfo"],
  ])("maps %s → %s", (url, expected) => {
    expect(stepKeyFromUrl(url)).toBe(expected);
  });

  it.each([
    "/enrol-student/new/account-info",
    "/enrol-student/new/documents",
    "/admission/dashboard",
    "",
  ])("returns null for unknown route: %s", (url) => {
    expect(stepKeyFromUrl(url)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isFatherInfoSatisfied
// ---------------------------------------------------------------------------

describe("isFatherInfoSatisfied", () => {
  it("is satisfied when isValid is true", () => {
    expect(isFatherInfoSatisfied({ isValid: true })).toBe(true);
  });

  it("is satisfied when noFatherInfo is true, even without isValid", () => {
    expect(isFatherInfoSatisfied({ noFatherInfo: true })).toBe(true);
  });

  it("is satisfied when both isValid and noFatherInfo are true", () => {
    expect(isFatherInfoSatisfied({ isValid: true, noFatherInfo: true })).toBe(true);
  });

  it("is not satisfied when neither flag is set", () => {
    expect(isFatherInfoSatisfied({})).toBe(false);
  });

  it("is not satisfied when isValid is false and noFatherInfo is unset", () => {
    expect(isFatherInfoSatisfied({ isValid: false })).toBe(false);
  });

  it("is not satisfied for undefined fatherInfo (no false-green)", () => {
    expect(isFatherInfoSatisfied(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getStepValidity — helper builders
// ---------------------------------------------------------------------------

const VALID_STATE = {
  studentInfo: {
    studentDetails: { isValid: true },
    addressContact: { isValid: true },
    medicalInformation: { isValid: true },
  },
  familyInfo: {
    motherInfo: { isValid: true },
    fatherInfo: { isValid: true },
  },
  enrollmentInfo: { isValid: true },
  uploadRequirements: {
    studentUploadRequirements: { isValid: true },
    parentGuardianUploadRequirements: { isValid: true },
  },
};

// ---------------------------------------------------------------------------
// HFSE-IS flow
// ---------------------------------------------------------------------------

describe("getStepValidity — hfse-is", () => {
  it("all true when every slice is valid", () => {
    expect(getStepValidity(VALID_STATE, "hfse-is")).toEqual({
      studentInfo: true,
      familyInfo: true,
      enrollmentInfo: true,
      uploadRequirements: true,
    });
  });

  // studentInfo ──────────────────────────────────────────────────────────────

  it("studentInfo false when studentDetails.isValid is missing", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: { ...VALID_STATE.studentInfo, studentDetails: {} },
    };
    expect(getStepValidity(state, "hfse-is").studentInfo).toBe(false);
  });

  it("studentInfo false when studentDetails.isValid is false (not true)", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: {
        ...VALID_STATE.studentInfo,
        studentDetails: { isValid: false },
      },
    };
    expect(getStepValidity(state, "hfse-is").studentInfo).toBe(false);
  });

  it("studentInfo false when addressContact.isValid is missing", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: { ...VALID_STATE.studentInfo, addressContact: {} },
    };
    expect(getStepValidity(state, "hfse-is").studentInfo).toBe(false);
  });

  it("studentInfo false when medicalInformation.isValid is missing (hfse-is requires it)", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: { ...VALID_STATE.studentInfo, medicalInformation: {} },
    };
    expect(getStepValidity(state, "hfse-is").studentInfo).toBe(false);
  });

  // familyInfo ───────────────────────────────────────────────────────────────

  it("familyInfo true when father has noFatherInfo=true (skips fatherInfo.isValid)", () => {
    const state = {
      ...VALID_STATE,
      familyInfo: {
        motherInfo: { isValid: true },
        fatherInfo: { noFatherInfo: true },
      },
    };
    expect(getStepValidity(state, "hfse-is").familyInfo).toBe(true);
  });

  it("familyInfo false when mother isValid is missing", () => {
    const state = {
      ...VALID_STATE,
      familyInfo: {
        motherInfo: {},
        fatherInfo: { isValid: true },
      },
    };
    expect(getStepValidity(state, "hfse-is").familyInfo).toBe(false);
  });

  it("familyInfo false when mother invalid even with father valid", () => {
    const state = {
      ...VALID_STATE,
      familyInfo: {
        motherInfo: { isValid: false },
        fatherInfo: { isValid: true },
      },
    };
    expect(getStepValidity(state, "hfse-is").familyInfo).toBe(false);
  });

  it("familyInfo false when both mother and father are empty", () => {
    const state = {
      ...VALID_STATE,
      familyInfo: { motherInfo: {}, fatherInfo: {} },
    };
    expect(getStepValidity(state, "hfse-is").familyInfo).toBe(false);
  });

  // uploadRequirements ───────────────────────────────────────────────────────

  it("uploadRequirements false when only studentUpload is valid", () => {
    const state = {
      ...VALID_STATE,
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: {},
      },
    };
    expect(getStepValidity(state, "hfse-is").uploadRequirements).toBe(false);
  });

  it("uploadRequirements false when only parentGuardian is valid", () => {
    const state = {
      ...VALID_STATE,
      uploadRequirements: {
        studentUploadRequirements: {},
        parentGuardianUploadRequirements: { isValid: true },
      },
    };
    expect(getStepValidity(state, "hfse-is").uploadRequirements).toBe(false);
  });

  // edge: empty / undefined formState ───────────────────────────────────────

  it("returns all false for empty formState object", () => {
    expect(getStepValidity({}, "hfse-is")).toEqual({
      studentInfo: false,
      familyInfo: false,
      enrollmentInfo: false,
      uploadRequirements: false,
    });
  });

  it("returns all false for undefined formState (no false-green)", () => {
    expect(getStepValidity(undefined, "hfse-is")).toEqual({
      studentInfo: false,
      familyInfo: false,
      enrollmentInfo: false,
      uploadRequirements: false,
    });
  });

  it("rejects isValid: 1 (truthy but not strictly true)", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: {
        ...VALID_STATE.studentInfo,
        studentDetails: { isValid: 1 }, // truthy but !== true
      },
    };
    expect(getStepValidity(state, "hfse-is").studentInfo).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// VizSchool flow — medical is always valid
// ---------------------------------------------------------------------------

describe("getStepValidity — viz-school", () => {
  it("studentInfo true without medicalInformation.isValid for viz-school", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        // no medicalInformation key at all
      },
    };
    expect(getStepValidity(state, "viz-school").studentInfo).toBe(true);
  });

  it("studentInfo true even if medicalInformation.isValid is false for viz-school", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: {
        ...VALID_STATE.studentInfo,
        medicalInformation: { isValid: false },
      },
    };
    expect(getStepValidity(state, "viz-school").studentInfo).toBe(true);
  });

  it("studentInfo false for viz-school when addressContact.isValid is missing", () => {
    const state = {
      ...VALID_STATE,
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: {},
      },
    };
    expect(getStepValidity(state, "viz-school").studentInfo).toBe(false);
  });

  it("all true for viz-school when student + family + enrollment + upload are valid", () => {
    const state = {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        // medicalInformation absent — viz-school ignores it
      },
      familyInfo: {
        motherInfo: { isValid: true },
        fatherInfo: { isValid: true },
      },
      enrollmentInfo: { isValid: true },
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { isValid: true },
      },
    };
    expect(getStepValidity(state, "viz-school")).toEqual({
      studentInfo: true,
      familyInfo: true,
      enrollmentInfo: true,
      uploadRequirements: true,
    });
  });
});
