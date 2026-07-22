import { saveReenrolDraftRemote } from "@/actions/drafts";
import { useEnrolOldStudentStore } from "@/zustand-store";
import { useEffect, useRef } from "react";

// Mirrors REMOTE_SYNC_DEBOUNCE_MS in use-save-application.tsx: rapid per-tab saves coalesce
// into one remote write of the latest snapshot instead of firing on every keystroke-triggered
// setFormState call.
const REMOTE_SYNC_DEBOUNCE_MS = 1500;

/**
 * Keeps the DB-backed re-enrollment draft (application_drafts, type "hfse-is-reenrol", see the
 * 20260722120000 migration) in sync with `useEnrolOldStudentStore`, so a parent's per-tab saves
 * survive more than just this browser's localStorage — a cleared cache, a different device, or
 * an in-app browser whose storage turned out to be ephemeral (see safe-storage.ts). Mount this
 * once for the whole re-enrollment flow (OldStudentLayout) rather than per tab.
 *
 * Fires on every `lastSavedAt` change (stamped by every setFormState call, see zustand-store.ts)
 * except the very first one observed after mount — that one is always the initial hydrate/resume
 * write (see use-hydrate-reenrollment.ts), not a new local edit, so re-echoing it to the database
 * a moment after it was possibly just read *from* the database would be redundant. Real per-tab
 * saves happen only once the hydrate gate (`isHydratingReEnrollment` in OldStudentLayout) has
 * already lifted, so this never has to distinguish "hydrate wrote this" from "a save wrote this"
 * beyond that first skip.
 */
export function useSyncReenrolDraft(enroleeNumber: string | undefined, academicYear: string) {
  const lastSavedAt = useEnrolOldStudentStore((state) => state.lastSavedAt);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (!enroleeNumber || !lastSavedAt) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      const { formState, expiresAt } = useEnrolOldStudentStore.getState();

      saveReenrolDraftRemote({
        enroleeNumber,
        academicYear,
        formState,
        // No separate "true creation time" is tracked locally for a re-enrollment draft (unlike
        // the new-student flow's draftId-keyed store) — created_at drifting to the latest save
        // is an accepted trade-off since nothing surfaces it for this draft type.
        createdAt: lastSavedAt,
        lastSavedAt,
        expiresAt: expiresAt ?? lastSavedAt,
      }).catch(() => {
        // Best-effort background sync: the local (localStorage) save already succeeded, and the
        // next tab save (or the debounce above, next time lastSavedAt changes) will retry.
      });
    }, REMOTE_SYNC_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastSavedAt, enroleeNumber, academicYear]);
}
