import { getMergedDraftRows } from "@/actions/sync-drafts";
import { getDraftRows } from "@/components/private/drafts/draft-ticket";
import { useQuery } from "@tanstack/react-query";

/**
 * Same offline-first shape as useDraftsList (src/hooks/use-drafts-list.ts), but for the
 * combined hfse-is + viz-school drafts page: shows the local snapshot instantly via
 * `initialData`, then merges in each flow's server copy in the background.
 */
export function useMergedDraftRows() {
  return useQuery({
    queryKey: ["drafts", "merged-rows"],
    queryFn: () => getMergedDraftRows(),
    initialData: () => getDraftRows(),
    refetchOnMount: true,
  });
}
