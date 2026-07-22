import { supabase } from "@/lib/client";
import { generateId } from "@/lib/generate-id";

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

// ---------------------------------------------------------------------------
// Re-enrollment (current-student) drafts
//
// Shares the application_drafts table (see the 20260722120000 migration) but is identified by
// enrolee_number rather than draft_id — unlike a brand-new application there's always a natural
// key to resume by, and the point of a DB-backed draft here is being able to load one even when
// the client has no locally-remembered id (cleared cache, a different device or browser, an
// in-app browser that only ever kept the edit in memory). This is what makes the old flow
// resilient to the failure mode a parent reported: per-tab "Save" edits surviving nothing but
// the current tab's sessionStorage and reverting to the original server data once that tab
// closed.
// ---------------------------------------------------------------------------

const REENROL_DRAFT_TYPE = "hfse-is-reenrol";

export type ReenrolDraftRecord = {
  enroleeNumber: string;
  academicYear: string;
  formState: Record<string, unknown>;
  createdAt: Date | string;
  lastSavedAt: Date | string;
  expiresAt: Date | string;
};

export type RemoteReenrolDraftEntry = {
  state: {
    enroleeNumber: string;
    academicYear: string;
    formState: Record<string, unknown>;
    createdAt: string;
    lastSavedAt: string;
    expiresAt: string;
  };
};

type ReenrolDraftRow = {
  draft_id: string;
  user_id: string;
  type: string;
  enrolee_number: string;
  academic_year: string | null;
  form_state: Record<string, unknown>;
  created_at: string;
  last_saved_at: string;
  expires_at: string;
};

function reenrolRowToDraftEntry(row: ReenrolDraftRow): RemoteReenrolDraftEntry {
  return {
    state: {
      enroleeNumber: row.enrolee_number,
      academicYear: row.academic_year ?? "",
      formState: row.form_state,
      createdAt: row.created_at,
      lastSavedAt: row.last_saved_at,
      expiresAt: row.expires_at,
    },
  };
}

export async function saveReenrolDraftRemote(draft: ReenrolDraftRecord) {
  const userId = await requireUserId();

  const row = {
    // A fresh id on every save is deliberate, not an oversight: re-enrol rows are looked up and
    // conflict-resolved by (user_id, enrolee_number) below, never by draft_id (see the migration
    // comment for why that column pair — not draft_id — is the unique constraint). Nothing on
    // the client remembers this value between saves, so threading a stable one through would
    // only add a lookup with no behavioural benefit.
    draft_id: generateId(),
    user_id: userId,
    type: REENROL_DRAFT_TYPE,
    enrolee_number: draft.enroleeNumber,
    academic_year: draft.academicYear,
    form_state: draft.formState,
    created_at: new Date(draft.createdAt).toISOString(),
    last_saved_at: new Date(draft.lastSavedAt).toISOString(),
    expires_at: new Date(draft.expiresAt).toISOString(),
  };

  const { error } = await supabase.from("application_drafts").upsert(row, { onConflict: "user_id,enrolee_number" });

  if (error) throw new Error(error.message);
}

export async function loadReenrolDraftRemote(enroleeNumber: string): Promise<RemoteReenrolDraftEntry | null> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from("application_drafts")
    .select("*")
    .eq("user_id", userId)
    .eq("enrolee_number", enroleeNumber)
    .eq("type", REENROL_DRAFT_TYPE)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) return null;

  return reenrolRowToDraftEntry(data as ReenrolDraftRow);
}

export async function deleteReenrolDraftRemote(enroleeNumber: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from("application_drafts")
    .delete()
    .eq("user_id", userId)
    .eq("enrolee_number", enroleeNumber);

  if (error) throw new Error(error.message);
}
