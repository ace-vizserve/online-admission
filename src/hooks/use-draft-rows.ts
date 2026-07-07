import { getRemoteDraftRows } from "@/actions/sync-drafts";
import useSession from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";

/**
 * Database-backed drafts list for the combined hfse-is + viz-school drafts page, the sidebar
 * badge, and the dashboard count widget. The database is the source of truth: unlike the old
 * offline-first useMergedDraftRows, this does not seed from localStorage, so it exposes a real
 * loading state and never shows a draft that's been removed server-side.
 */
export function useDraftRows() {
  const { session } = useSession();

  return useQuery({
    queryKey: ["drafts", "remote-rows"],
    queryFn: getRemoteDraftRows,
    enabled: session != null,
    refetchOnMount: true,
  });
}
