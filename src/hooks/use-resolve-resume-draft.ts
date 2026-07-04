import { DraftFlowType } from "@/actions/drafts";
import { resolveResumeDraft } from "@/actions/resolve-draft";
import { useQuery } from "@tanstack/react-query";

/**
 * Resolves a draft to resume (see src/actions/resolve-draft.ts — local cache first, falling
 * back to a server lookup). `data` is `null` when the draft isn't found anywhere (a distinct,
 * non-error outcome, mirroring useHydrateReEnrollment's isNotFound shape), not just when the
 * lookup is still pending.
 */
export function useResolveResumeDraft(resumeDraftId: string | undefined, type: DraftFlowType) {
  return useQuery({
    queryKey: ["resolve-resume-draft", resumeDraftId, type],
    queryFn: () => resolveResumeDraft(resumeDraftId!, type),
    enabled: !!resumeDraftId,
  });
}
