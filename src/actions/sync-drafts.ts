import { listDraftsRemote } from "@/actions/drafts";
import type { DraftRow } from "@/components/private/drafts/draft-ticket";
import { isExpired, sortDrafts } from "@/lib/draft-storage";
import { EnrolNewStudentDraftStore } from "@/zustand-store";

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
