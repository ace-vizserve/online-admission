import { saveDraftRemote } from "@/actions/drafts";
import { createNewStudentDraft, DRAFT_EXPIRY_DAYS } from "@/lib/draft-storage";
import { wait } from "@/lib/utils";
import { createNewStudentDraftStore } from "@/zustand-store";
import { useQueryClient } from "@tanstack/react-query";
import { addDays } from "date-fns";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

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

  const saveApplication = useCallback(
    async ({ willExit }: { willExit: boolean }) => {
      try {
        setIsLoading(true);

        let draftId = formState?.draftId;

        if (!draftId) {
          draftId = createNewStudentDraft();
          setFormState({ draftId });
        }

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
          createdAt: formState?.createdAt ?? new Date(),
          expiresAt: addDays(new Date(), DRAFT_EXPIRY_DAYS),
        };

        createNewStudentDraftStore(type, draftId).setState(draftRecord);

        if (willExit) {
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
          navigate("/admission/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [academicYear, activeTab, completedTabs, currentTab, formState, navigate, queryClient, setFormState, type],
  );

  return {
    saveApplication,
    isLoading,
  };
}
