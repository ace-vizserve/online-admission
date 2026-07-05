import { DraftFlowType, RemoteDraftEntry } from "@/actions/drafts";
import { syncDraftsForType } from "@/actions/sync-drafts";
import { listNewStudentDrafts } from "@/lib/draft-storage";
import { useQuery } from "@tanstack/react-query";

/**
 * Lists drafts for a flow type, offline-first: `data` is populated synchronously from the
 * local cache (localStorage) via `initialData` so there's no loading state, then
 * `syncDraftsForType` runs in the background to merge in the server's copy (see
 * src/actions/sync-drafts.ts) — a draft started on another browser/device shows up once that
 * resolves. `refetchOnMount: true` overrides the app-wide `refetchOnMount: false` default
 * (src/main.tsx) because drafts specifically need a fresh cross-device check every time this
 * becomes enabled (e.g. each time a drafts drawer is opened via `enabled`).
 */
export function useDraftsList(type: DraftFlowType, enabled = true) {
  return useQuery({
    queryKey: ["drafts", type],
    queryFn: () => syncDraftsForType(type),
    initialData: () => listNewStudentDrafts(type) as RemoteDraftEntry[],
    enabled,
    refetchOnMount: true,
  });
}
