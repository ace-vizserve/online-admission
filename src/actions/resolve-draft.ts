import { DraftFlowType, loadDraftRemote, RemoteDraftEntry } from "@/actions/drafts";
import { listNewStudentDrafts } from "@/lib/draft-storage";
import { createNewStudentDraftStore } from "@/zustand-store";

/**
 * Resolves a draft to resume by draftId: the database is checked first, so a Continue always
 * restores the latest saved state (see src/actions/sync-drafts.ts for the DB-only philosophy
 * this mirrors). A remote hit is written into the local cache before returning so a later
 * offline resume of this same draft still works. The local cache is only consulted as a
 * fallback when the remote lookup fails (offline / not authenticated) — it is never preferred
 * over a successful database read, so a stale local copy can't shadow a newer server save.
 * Returns null if the draft isn't found anywhere (including a clean remote "not found", which
 * is treated as deleted rather than falling back to a stale local copy).
 */
export async function resolveResumeDraft(draftId: string, type: DraftFlowType): Promise<RemoteDraftEntry | null> {
  try {
    const remoteEntry = await loadDraftRemote(draftId);
    if (!remoteEntry) return null;

    createNewStudentDraftStore(type, draftId).setState({
      draftId: remoteEntry.state.draftId,
      type: remoteEntry.state.type,
      academicYear: remoteEntry.state.academicYear,
      formState: remoteEntry.state.formState,
      currentTab: remoteEntry.state.currentTab,
      activeTab: remoteEntry.state.activeTab,
      completedTabs: remoteEntry.state.completedTabs,
      createdAt: new Date(remoteEntry.state.createdAt),
      lastSavedAt: new Date(remoteEntry.state.lastSavedAt),
      expiresAt: new Date(remoteEntry.state.expiresAt),
    });

    return remoteEntry;
  } catch {
    // Remote lookup failed (offline / not authenticated) — fall back to the local cache so an
    // offline resume of a previously-synced draft still works.
    const localDrafts = listNewStudentDrafts(type) as RemoteDraftEntry[];
    return localDrafts.find((entry) => entry.state?.draftId === draftId) ?? null;
  }
}
