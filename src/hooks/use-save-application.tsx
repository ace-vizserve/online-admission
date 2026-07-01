import { createNewStudentDraft, DRAFT_EXPIRY_DAYS, wait } from "@/lib/utils";
import { createNewStudentDraftStore } from "@/zustand-store";
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

        createNewStudentDraftStore(type, draftId).setState({
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
        });

        if (willExit) {
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
    [academicYear, activeTab, completedTabs, currentTab, formState, navigate, setFormState, type],
  );

  return {
    saveApplication,
    isLoading,
  };
}
