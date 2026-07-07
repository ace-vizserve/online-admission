import { DraftFlowType, listDraftsRemote } from "@/actions/drafts";
import useSession from "@/hooks/use-session";
import { useQuery } from "@tanstack/react-query";

/**
 * Lists drafts for a flow type, database-only: the database is the source of truth, so this
 * never seeds from or falls back to localStorage - a draft removed server-side (discarded on
 * another device, or expired) will not show up here even if a stale copy lingers in this
 * browser's local cache. `refetchOnMount: true` overrides the app-wide `refetchOnMount: false`
 * default (src/main.tsx) because drafts specifically need a fresh check every time this becomes
 * enabled (e.g. each time a drafts drawer is opened via `enabled`).
 */
export function useDraftsList(type: DraftFlowType, enabled = true) {
  const { session } = useSession();

  return useQuery({
    queryKey: ["drafts", type],
    queryFn: () => listDraftsRemote(type),
    enabled: enabled && session != null,
    refetchOnMount: true,
  });
}
