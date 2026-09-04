export type StepKey = "studentInfo" | "familyInfo" | "enrollmentInfo" | "uploadRequirements";
export type WizardFlow = "hfse-is" | "viz-school" | "open-house";

/**
 * Maps a step route URL to its StepKey.
 * Returns null for routes with no isValid tracking (e.g. "account-info" on Open House)
 * — callers treat null as always-valid so that step never turns red.
 */
export function stepKeyFromUrl(url: string): StepKey | null {
  if (url.endsWith("student-info")) return "studentInfo";
  if (url.endsWith("family-info")) return "familyInfo";
  if (url.endsWith("enrollment-info")) return "enrollmentInfo";
  if (url.endsWith("upload-requirements")) return "uploadRequirements";
  return null;
}

/**
 * A father slice is "satisfied" either by an explicit confirmed submission (isValid) or by
 * being marked not-applicable (noFatherInfo) — the single source of truth for this rule, reused
 * everywhere else in the Family Information step (per-tab advance gates, badges) that needs to
 * know whether the father requirement is met, so they can't drift out of sync with getStepValidity.
 */
export function isFatherInfoSatisfied(fatherInfo?: { isValid?: boolean; noFatherInfo?: boolean }): boolean {
  return fatherInfo?.noFatherInfo === true || fatherInfo?.isValid === true;
}

/**
 * Derives per-step validity from the stored per-slice isValid flags in formState.
 * All values default to false when the slice or flag is absent, ensuring an
 * incomplete or corrupted draft never shows a false-green state.
 *
 * Validity rules:
 * - studentInfo:  studentDetails.isValid && addressContact.isValid && (viz-school || medicalInformation.isValid)
 * - familyInfo:   motherInfo.isValid && (fatherInfo.noFatherInfo || fatherInfo.isValid)
 *                 (guardianInfo and siblings have no isValid flag and are not required at submit)
 * - enrollmentInfo: enrollmentInfo.isValid
 * - uploadRequirements: studentUploadRequirements.isValid && parentGuardianUploadRequirements.isValid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStepValidity(formState: any, flow: WizardFlow): Record<StepKey, boolean> {
  const studentInfo = formState?.studentInfo ?? {};
  const familyInfo = formState?.familyInfo ?? {};
  const enrollmentInfo = formState?.enrollmentInfo ?? {};
  const uploadRequirements = formState?.uploadRequirements ?? {};

  const studentDetailsValid: boolean = studentInfo?.studentDetails?.isValid === true;
  const addressContactValid: boolean = studentInfo?.addressContact?.isValid === true;
  const medicalValid: boolean =
    flow === "viz-school" ? true : studentInfo?.medicalInformation?.isValid === true;

  const motherValid: boolean = familyInfo?.motherInfo?.isValid === true;
  const fatherValid: boolean = isFatherInfoSatisfied(familyInfo?.fatherInfo);

  return {
    studentInfo: studentDetailsValid && addressContactValid && medicalValid,
    familyInfo: motherValid && fatherValid,
    enrollmentInfo: enrollmentInfo?.isValid === true,
    uploadRequirements:
      uploadRequirements?.studentUploadRequirements?.isValid === true &&
      uploadRequirements?.parentGuardianUploadRequirements?.isValid === true,
  };
}

export const STEP_ORDER: StepKey[] = ["studentInfo", "familyInfo", "enrollmentInfo", "uploadRequirements"];

const STEP_URLS: Record<"hfse-is" | "viz-school", Record<StepKey, string>> = {
  "hfse-is": {
    studentInfo: "/enrol-student/new/student-info",
    familyInfo: "/enrol-student/new/family-info",
    enrollmentInfo: "/enrol-student/new/enrollment-info",
    uploadRequirements: "/enrol-student/new/upload-requirements",
  },
  "viz-school": {
    studentInfo: "/vizschool/enrol-student/new/student-info",
    familyInfo: "/vizschool/enrol-student/new/family-info",
    enrollmentInfo: "/vizschool/enrol-student/new/enrollment-info",
    uploadRequirements: "/vizschool/enrol-student/new/upload-requirements",
  },
};

/**
 * URL of the earliest step *before* `step` whose data is incomplete, or null when every step
 * ahead of it is satisfied. Step pages use it to send a parent to the gap instead of rendering
 * a step whose prerequisites were never met.
 *
 * Two properties this relies on:
 *
 * - It only ever points backwards from the calling step, so a chain of these guards always
 *   terminates at student-info and can never loop.
 * - It tests validity, not presence. The per-tab autosave writes a slice object on the first
 *   keystroke, so a presence check ("studentDetails != null") is satisfied by a step the parent
 *   only started typing into and never confirmed - which is how an unfinished Student
 *   Information step could sit behind three completed ones.
 */
export function firstIncompleteStepUrl(
  formState: unknown,
  flow: "hfse-is" | "viz-school",
  step: StepKey,
): string | null {
  const validity = getStepValidity(formState, flow);

  for (const key of STEP_ORDER) {
    if (key === step) return null;
    if (!validity[key]) return STEP_URLS[flow][key];
  }

  return null;
}
