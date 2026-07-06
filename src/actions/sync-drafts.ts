import { DraftFlowType, listDraftsRemote, RemoteDraftEntry } from "@/actions/drafts";
import type { DraftRow } from "@/components/private/drafts/draft-ticket";
import { isExpired, listNewStudentDrafts, sortDrafts } from "@/lib/draft-storage";
import { EnrolNewStudentDraftStore, createNewStudentDraftStore } from "@/zustand-store";

function hydrateLocalCache(type: DraftFlowType, entry: RemoteDraftEntry) {
  createNewStudentDraftStore(type, entry.state.draftId).setState({
    draftId: entry.state.draftId,
    type: entry.state.type,
    academicYear: entry.state.academicYear,
    formState: entry.state.formState,
    currentTab: entry.state.currentTab,
    activeTab: entry.state.activeTab,
    completedTabs: entry.state.completedTabs,
    createdAt: new Date(entry.state.createdAt),
    lastSavedAt: new Date(entry.state.lastSavedAt),
    expiresAt: new Date(entry.state.expiresAt),
  });
}

/**
 * Merges locally-cached drafts with the server's copy for the given flow type, keyed by
 * draftId, keeping whichever side has the newer lastSavedAt. Any remote draft that's missing
 * locally or newer than the local copy is written into the local cache (localStorage) so it
 * stays resumable offline afterwards. Falls back to local-only data if the remote fetch fails
 * (offline / not authenticated) — local is the offline-first source of truth for reads.
 */
export async function syncDraftsForType(type: DraftFlowType): Promise<RemoteDraftEntry[]> {
  const local = listNewStudentDrafts(type) as RemoteDraftEntry[];

  let remote: RemoteDraftEntry[];
  try {
    remote = await listDraftsRemote(type);
  } catch {
    return local;
  }

  const byId = new Map<string, RemoteDraftEntry>();

  for (const entry of local) {
    byId.set(entry.state.draftId, entry);
  }

  for (const entry of remote) {
    const existing = byId.get(entry.state.draftId);
    const isNewer = !existing || new Date(entry.state.lastSavedAt) > new Date(existing.state.lastSavedAt);

    if (isNewer) {
      byId.set(entry.state.draftId, entry);
      hydrateLocalCache(type, entry);
    }
  }

  return Array.from(byId.values());
}

/**
 * Database-only drafts list: the database is the source of truth for what drafts exist, so
 * this does not read or fall back to localStorage — a draft removed from the server (e.g.
 * discarded on another device) will not show up here even if a stale copy still lingers in
 * this browser's local cache.
 */
export async function getRemoteDraftRows(): Promise<DraftRow[]> {
  const [hfse, viz] = await Promise.all([listDraftsRemote("hfse-is"), listDraftsRemote("viz-school")]);

  const rows: DraftRow[] = [
    ...hfse.map((d) => ({ state: d.state as unknown as EnrolNewStudentDraftStore, flowType: "hfse-is" as const })),
    ...viz.map((d) => ({ state: d.state as unknown as EnrolNewStudentDraftStore, flowType: "viz-school" as const })),
  ];

  return sortDrafts(
    rows.filter((r) => !isExpired(r.state.expiresAt)),
    "lastUpdated",
  ) as DraftRow[];
}
