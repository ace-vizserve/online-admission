import { saveDraftRemote } from "@/actions/drafts";
import { createNewStudentDraft, DRAFT_EXPIRY_DAYS } from "@/lib/draft-storage";
import { wait } from "@/lib/utils";
import { createNewStudentDraftStore } from "@/zustand-store";
import { useQueryClient } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Per-step saves (willExit: false) write locally right away but sync to the database on a
// debounce so rapid step submits coalesce into a single remote write of the latest snapshot.
const REMOTE_SYNC_DEBOUNCE_MS = 1500;

type Props = {
  setFormState: (data: Record<string, unknown>) => void;
  formState: Record<string, unknown> & { draftId?: string; createdAt?: Date };
  currentTab: string;
  completedTabs: string[];
  activeTab: string;
  type: "hfse-is" | "viz-school";
  academicYear: string;
};

export function useSaveApplication({
  setFormState,
  formState,
  academicYear,
  activeTab,
  completedTabs,
  currentTab,
  type,
}: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const remoteSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPendingRemoteSync = useCallback(() => {
    if (remoteSyncTimer.current) {
      clearTimeout(remoteSyncTimer.current);
      remoteSyncTimer.current = null;
    }
  }, []);

  // The dialogs read drafts database-only now, so a step submit (willExit: false) must still
  // reach the database eventually - just debounced, so rapid submits don't fire a remote write
  // each time.
  const scheduleRemoteSync = useCallback(
    (draftRecord: Parameters<typeof saveDraftRemote>[0]) => {
      cancelPendingRemoteSync();
      remoteSyncTimer.current = setTimeout(() => {
        remoteSyncTimer.current = null;
        saveDraftRemote(draftRecord)
          .then(() => queryClient.invalidateQueries({ queryKey: ["drafts"] }))
          .catch(() => {
            // Best-effort background sync: local save already succeeded, and the next step
            // submit (or Save & exit) will retry.
          });
      }, REMOTE_SYNC_DEBOUNCE_MS);
    },
    [cancelPendingRemoteSync, queryClient],
  );

  // A pending debounced sync is dropped (not flushed) on unmount: the freshest data is always
  // in localStorage, and leaving the flow means the next save (or resume) re-persists it, so
  // there's no need to fire an async write during teardown.
  useEffect(() => cancelPendingRemoteSync, [cancelPendingRemoteSync]);

  const saveApplication = useCallback(
    async ({ willExit }: { willExit: boolean }) => {
      try {
        setIsLoading(true);

        let draftId = formState?.draftId;

        if (!draftId) {
          draftId = createNewStudentDraft();
          setFormState({ draftId });
        }

        // The resume flow never carries createdAt into formState (only the draft store's
        // top-level field), so formState?.createdAt is effectively always undefined for a
        // resumed draft. Falling back straight to `new Date()` would re-stamp created_at on
        // every save. Read the store's already-rehydrated value instead - it's the true creation
        // time (restored from the database on resume, see resolve-draft.ts). The store's own
        // initializer always sets createdAt (to `new Date()` for a genuinely brand-new draft, see
        // zustand-store.ts), so this is never undefined - no further fallback is needed.
        const draftStore = createNewStudentDraftStore(type, draftId);
        const existingCreatedAt = draftStore.getState().createdAt;

        const draftRecord = {
          draftId,
          type,
          academicYear,
          currentTab,
          activeTab,
          completedTabs,
          formState: {
            ...formState,
            draftId,
          },
          lastSavedAt: new Date(),
          createdAt: formState?.createdAt ?? existingCreatedAt,
          expiresAt: addDays(new Date(), DRAFT_EXPIRY_DAYS),
        };

        draftStore.setState(draftRecord);

        if (willExit) {
          cancelPendingRemoteSync();

          try {
            await saveDraftRemote(draftRecord);
            // The sidebar badge and dashboard count are database-backed (useDraftRows) and
            // don't remount on this navigation, so they need an explicit invalidation to
            // pick up a newly-created or newly-synced draft.
            queryClient.invalidateQueries({ queryKey: ["drafts"] });
          } catch {
            // Offline-first: the local save above already succeeded. Remote sync is
            // best-effort and will retry on the next Save & exit.
            toast.info("Saved on this device", {
              description: "We couldn't reach the server to sync this draft. It'll sync next time you're online.",
            });
          }

          await wait(1000);
          toast.success("Your application has been saved!", {
            description: "Your progress is saved. You may leave this page and resume later from Drafts.",
          });
          await wait(500);

          navigate("/admission/dashboard", { state: { justSaved: true } });
        } else {
          scheduleRemoteSync(draftRecord);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      academicYear,
      activeTab,
      cancelPendingRemoteSync,
      completedTabs,
      currentTab,
      formState,
      navigate,
      queryClient,
      scheduleRemoteSync,
      setFormState,
      type,
    ],
  );

  return {
    saveApplication,
    isLoading,
  };
}
