import { getReEnrollmentData, ReEnrollmentData } from "@/actions/get-reenrollment-data";
import { getNextGradeLevels } from "@/lib/utils";
import { useEnrolOldStudentStore } from "@/zustand-store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Fetches the old re-enrollment flow's existing application + documents once (via
 * getReEnrollmentData) and seeds `useEnrolOldStudentStore` — replacing the 6 separate
 * per-step fetches the flow used to make. Each slice is only seeded while it's still empty,
 * so a slow-resolving fetch can never clobber data the user already saved locally.
 */
export function useHydrateReEnrollment(enroleeNumber: string | undefined) {
  const formState = useEnrolOldStudentStore((state) => state.formState);
  const setFormState = useEnrolOldStudentStore((state) => state.setFormState);

  const query = useQuery({
    queryKey: ["re-enrollment", enroleeNumber],
    queryFn: async () => getReEnrollmentData({ enroleeNumber: enroleeNumber! }),
    enabled: !!enroleeNumber,
  });

  const { data, isSuccess } = query;

  useEffect(() => {
    if (!isSuccess || !data) return;

    const seed: Record<string, unknown> = {};

    const hasStudentInfo = Object.keys(formState.studentInfo ?? {}).length > 0;
    const hasFamilyInfo = Object.keys(formState.familyInfo ?? {}).length > 0;
    const hasStudentUploadReq = Object.keys(formState.uploadRequirements?.studentUploadRequirements ?? {}).length > 0;
    const hasParentGuardianUploadReq = Object.keys(
      formState.uploadRequirements?.parentGuardianUploadRequirements ?? {},
    ).length > 0;

    if (!hasStudentInfo) seed.studentInfo = data.studentInfo;
    if (!hasFamilyInfo) seed.familyInfo = data.familyInfo;

    const hasLevelApplied = Boolean(formState.enrollmentInfo?.levelApplied);

    if (!hasLevelApplied) {
      const allowedNextLevels = getNextGradeLevels(data.levelApplied);

      seed.enrollmentInfo = {
        ...formState.enrollmentInfo,
        levelApplied: allowedNextLevels[0] ?? "",
      };
    }

    if (!hasStudentUploadReq || !hasParentGuardianUploadReq) {
      seed.uploadRequirements = {
        studentUploadRequirements: hasStudentUploadReq
          ? formState.uploadRequirements?.studentUploadRequirements
          : data.studentUploadRequirements,
        parentGuardianUploadRequirements: hasParentGuardianUploadReq
          ? formState.uploadRequirements?.parentGuardianUploadRequirements
          : data.parentGuardianUploadRequirements,
      };
    }

    if (Object.keys(seed).length > 0) {
      setFormState(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isSuccess]);

  return {
    isPending: !!enroleeNumber && query.isPending,
    // getReEnrollmentData resolves to `null` (not an error) when no application is owned by
    // the current user for this enroleeNumber — e.g. a stale link or a mismatched account.
    isNotFound: isSuccess && data === null,
    data: data as ReEnrollmentData | null | undefined,
  };
}
