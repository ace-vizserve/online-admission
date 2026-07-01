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
  const fatherNoInfo: boolean = familyInfo?.fatherInfo?.noFatherInfo === true;
  const fatherValid: boolean = fatherNoInfo || familyInfo?.fatherInfo?.isValid === true;

  return {
    studentInfo: studentDetailsValid && addressContactValid && medicalValid,
    familyInfo: motherValid && fatherValid,
    enrollmentInfo: enrollmentInfo?.isValid === true,
    uploadRequirements:
      uploadRequirements?.studentUploadRequirements?.isValid === true &&
      uploadRequirements?.parentGuardianUploadRequirements?.isValid === true,
  };
}
