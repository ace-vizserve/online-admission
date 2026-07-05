import { supabase } from "@/lib/client";

export type DraftFlowType = "hfse-is" | "viz-school";

export type DraftRecord = {
  draftId: string;
  type: DraftFlowType;
  academicYear: string;
  formState: Record<string, unknown>;
  currentTab: string;
  activeTab: string;
  completedTabs: string[];
  createdAt: Date | string;
  lastSavedAt: Date | string;
  expiresAt: Date | string;
};

// Mirrors the shape of a localStorage-persisted draft entry (src/lib/draft-storage.ts)
// so the remote and local read paths can be merged/consumed identically.
export type RemoteDraftEntry = {
  state: {
    draftId: string;
    type: DraftFlowType;
    academicYear: string;
    formState: Record<string, unknown>;
    currentTab: string;
    activeTab: string;
    completedTabs: string[];
    createdAt: string;
    lastSavedAt: string;
    expiresAt: string;
  };
};

type DraftRow = {
  draft_id: string;
  user_id: string;
  type: DraftFlowType;
  academic_year: string | null;
  form_state: Record<string, unknown>;
  current_tab: string | null;
  active_tab: string | null;
  completed_tabs: string[];
  created_at: string;
  last_saved_at: string;
  expires_at: string;
};

async function requireUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) throw new Error("Not authenticated");

  return session.user.id;
}

function rowToDraftEntry(row: DraftRow): RemoteDraftEntry {
  return {
    state: {
      draftId: row.draft_id,
      type: row.type,
      academicYear: row.academic_year ?? "",
      formState: row.form_state,
      currentTab: row.current_tab ?? "",
      activeTab: row.active_tab ?? "",
      completedTabs: row.completed_tabs,
      createdAt: row.created_at,
      lastSavedAt: row.last_saved_at,
      expiresAt: row.expires_at,
    },
  };
}

export async function saveDraftRemote(draft: DraftRecord) {
  const userId = await requireUserId();

  const row = {
    draft_id: draft.draftId,
    user_id: userId,
    type: draft.type,
    academic_year: draft.academicYear,
    form_state: draft.formState,
    current_tab: draft.currentTab,
    active_tab: draft.activeTab,
    completed_tabs: draft.completedTabs,
    created_at: new Date(draft.createdAt).toISOString(),
    last_saved_at: new Date(draft.lastSavedAt).toISOString(),
    expires_at: new Date(draft.expiresAt).toISOString(),
  };

  const { error } = await supabase.from("application_drafts").upsert(row, { onConflict: "draft_id" });

  if (error) throw new Error(error.message);
}

export async function listDraftsRemote(type: DraftFlowType): Promise<RemoteDraftEntry[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("application_drafts")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .gt("expires_at", new Date().toISOString())
    .order("last_saved_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data as DraftRow[]).map(rowToDraftEntry);
}

export async function loadDraftRemote(draftId: string): Promise<RemoteDraftEntry | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("application_drafts")
    .select("*")
    .eq("draft_id", draftId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) return null;

  return rowToDraftEntry(data as DraftRow);
}

export async function deleteDraftRemote(draftId: string) {
  const userId = await requireUserId();

  const { error } = await supabase.from("application_drafts").delete().eq("draft_id", draftId).eq("user_id", userId);

  if (error) throw new Error(error.message);
}
