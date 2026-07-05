import { DraftFlowType, loadDraftRemote, RemoteDraftEntry } from "@/actions/drafts";
import { listNewStudentDrafts } from "@/lib/draft-storage";
import { createNewStudentDraftStore } from "@/zustand-store";

/**
 * Resolves a draft to resume by draftId: checks the local cache first (instant, offline-safe),
 * and falls back to a server lookup when there's no local match (e.g. the draft was started on
 * a different browser/device). A remote hit is written into the local cache before returning so
 * subsequent resumes/lists on this device are instant too. Returns null if the draft isn't found
 * anywhere, or if the remote lookup fails (offline / not authenticated).
 */
export async function resolveResumeDraft(draftId: string, type: DraftFlowType): Promise<RemoteDraftEntry | null> {
  const localDrafts = listNewStudentDrafts(type) as RemoteDraftEntry[];
  const localMatch = localDrafts.find((entry) => entry.state?.draftId === draftId);

  if (localMatch) return localMatch;

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
    return null;
  }
}
