import { getReEnrollmentData, ReEnrollmentData } from "@/actions/get-reenrollment-data";
import { loadReenrolDraftRemote } from "@/actions/drafts";
import { isExpired } from "@/lib/draft-storage";
import { getNextGradeLevels } from "@/lib/utils";
import { useEnrolOldStudentStore } from "@/zustand-store";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/**
 * Fetches the old re-enrollment flow's existing application + documents once (via
 * getReEnrollmentData) and seeds `useEnrolOldStudentStore` — replacing the 6 separate
 * per-step fetches the flow used to make. Each slice is only seeded while it's still empty,
 * so a slow-resolving fetch can never clobber data the user already saved locally.
 *
 * The store now persists to localStorage (see zustand-store.ts) so a parent's per-tab saves
 * survive closing the tab, not just a reload. Because localStorage isn't tab-scoped, a stale
 * draft could otherwise outlive its usefulness in two ways this hook guards against before
 * seeding:
 *  - it belongs to a *different* enrolee (opened another student's link in the same browser
 *    without exiting first) — cross-student bleed;
 *  - it's past its 30-day expiry — resuming ancient edits nobody remembers making.
 * Either case clears the store first, so the seed below falls through to remote/server data.
 *
 * localStorage alone doesn't survive a cleared cache, a different device, or the ephemeral
 * storage some in-app browsers fall back to (see safe-storage.ts) — the scenario that actually
 * prompted this fix (a parent's saves vanishing). When there's no usable local draft, this hook
 * also checks for a database-backed draft (useSyncReenrolDraft, called from OldStudentLayout,
 * is what keeps that DB copy up to date) and adopts it before falling back to the untouched
 * server originals. A remote draft never needs to be compared against a *present* local one by
 * timestamp — the remote copy is always a debounced echo of local saves, so it can never be
 * fresher than a local draft that's still valid; it only matters as a fallback once the local
 * copy is missing, foreign, or expired.
 */
export function useHydrateReEnrollment(enroleeNumber: string | undefined) {
  const formState = useEnrolOldStudentStore((state) => state.formState);
  const setFormState = useEnrolOldStudentStore((state) => state.setFormState);
  const setEnroleeNumber = useEnrolOldStudentStore((state) => state.setEnroleeNumber);
  const clearState = useEnrolOldStudentStore((state) => state.clearState);
  const persistedEnroleeNumber = useEnrolOldStudentStore((state) => state.enroleeNumber);
  const persistedExpiresAt = useEnrolOldStudentStore((state) => state.expiresAt);

  const query = useQuery({
    queryKey: ["re-enrollment", enroleeNumber],
    queryFn: async () => getReEnrollmentData({ enroleeNumber: enroleeNumber! }),
    enabled: !!enroleeNumber,
  });

  const remoteDraftQuery = useQuery({
    queryKey: ["re-enrollment-remote-draft", enroleeNumber],
    queryFn: async () => loadReenrolDraftRemote(enroleeNumber!),
    enabled: !!enroleeNumber,
  });

  const { data, isSuccess } = query;

  // Reconciliation + seeding run in one effect, once per enrolee. Splitting these into two
  // effects (reconcile-then-seed) would race: clearState() updates the store asynchronously,
  // so a same-commit seed effect could still read the pre-clear `formState` closure and wrongly
  // conclude a slice is "already populated" with data that's about to be wiped.
  const reconciledFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!enroleeNumber || !isSuccess || !data) return;
    // Wait for the remote-draft lookup too, so a slow request can't cause this to fall through
    // to server data before we've actually checked whether a remote draft should win instead.
    if (!remoteDraftQuery.isSuccess) return;
    if (reconciledFor.current === enroleeNumber) return;
    reconciledFor.current = enroleeNumber;

    const isDifferentEnrolee = persistedEnroleeNumber != null && persistedEnroleeNumber !== enroleeNumber;
    const isDraftExpired = persistedExpiresAt != null && isExpired(persistedExpiresAt);
    const shouldResetDraft = isDifferentEnrolee || isDraftExpired;

    if (shouldResetDraft) {
      clearState();
    }

    // If we just reset, treat the local draft as an empty slate rather than reading `formState`
    // — the clearState() call above hasn't propagated to this render yet, so `formState` here
    // would still be the stale/foreign draft we're in the middle of discarding.
    const localFormState: typeof formState = shouldResetDraft ? {} : formState;
    const hasLocalDraft = Object.keys(localFormState).length > 0;

    const remoteDraft = remoteDraftQuery.data;
    const isRemoteDraftUsable = remoteDraft != null && !isExpired(remoteDraft.state.expiresAt);

    // Adopt the remote draft only when there's no usable local one — see the doc comment above
    // for why no lastSavedAt comparison against a present local draft is needed.
    const adoptedRemoteFormState: typeof formState | null =
      !hasLocalDraft && isRemoteDraftUsable ? (remoteDraft!.state.formState as typeof formState) : null;
    const baseFormState: typeof formState = adoptedRemoteFormState ?? localFormState;

    const seed: Record<string, unknown> = {};

    const hasStudentInfo = Object.keys(baseFormState.studentInfo ?? {}).length > 0;
    const hasFamilyInfo = Object.keys(baseFormState.familyInfo ?? {}).length > 0;
    const hasStudentUploadReq =
      Object.keys(baseFormState.uploadRequirements?.studentUploadRequirements ?? {}).length > 0;
    const hasParentGuardianUploadReq = Object.keys(
      baseFormState.uploadRequirements?.parentGuardianUploadRequirements ?? {},
    ).length > 0;

    if (!hasStudentInfo) seed.studentInfo = data.studentInfo;
    if (!hasFamilyInfo) seed.familyInfo = data.familyInfo;

    const hasLevelApplied = Boolean(baseFormState.enrollmentInfo?.levelApplied);

    if (!hasLevelApplied) {
      const allowedNextLevels = getNextGradeLevels(data.levelApplied);

      seed.enrollmentInfo = {
        ...baseFormState.enrollmentInfo,
        levelApplied: allowedNextLevels[0] ?? "",
      };
    }

    if (!hasStudentUploadReq || !hasParentGuardianUploadReq) {
      seed.uploadRequirements = {
        studentUploadRequirements: hasStudentUploadReq
          ? baseFormState.uploadRequirements?.studentUploadRequirements
          : data.studentUploadRequirements,
        parentGuardianUploadRequirements: hasParentGuardianUploadReq
          ? baseFormState.uploadRequirements?.parentGuardianUploadRequirements
          : data.parentGuardianUploadRequirements,
      };
    }

    // When adopting a remote draft, its slices aren't in the store yet — write them alongside
    // whatever `seed` fills in from the server, in one combined update.
    const toWrite = adoptedRemoteFormState ? { ...adoptedRemoteFormState, ...seed } : seed;

    if (Object.keys(toWrite).length > 0) {
      setFormState(toWrite);
    }

    setEnroleeNumber(enroleeNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enroleeNumber, data, isSuccess, remoteDraftQuery.isSuccess, remoteDraftQuery.data]);

  return {
    isPending: !!enroleeNumber && query.isPending,
    // getReEnrollmentData resolves to `null` (not an error) when no application is owned by
    // the current user for this enroleeNumber — e.g. a stale link or a mismatched account.
    isNotFound: isSuccess && data === null,
    data: data as ReEnrollmentData | null | undefined,
  };
}
