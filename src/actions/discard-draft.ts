import { deleteDraftRemote, DraftFlowType } from "@/actions/drafts";
import { removeNewStudentDraft } from "@/lib/draft-storage";

export async function discardDraft(draftId: string | undefined, type: DraftFlowType) {
  if (!draftId) return;

  removeNewStudentDraft(draftId, type);

  try {
    await deleteDraftRemote(draftId);
  } catch {
    // Offline-first: the local removal above already succeeded. Remote cleanup is
    // best-effort and the draft will simply expire server-side if this never syncs.
  }
}
