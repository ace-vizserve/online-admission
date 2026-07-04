import { EnrolNewStudentDraftStore } from "@/zustand-store";

const NEW_STUDENT_DRAFT_PREFIX = "enrolNewStudent:draft:";

export const DRAFT_EXPIRY_DAYS = 30;

type DraftMeta = {
  createdAt: string;
  lastSavedAt: string;
  expiresAt: string;
};

// Zustand's persist middleware wraps state as { state: {...}, version }.
type PersistedDraftEntry = {
  state?: DraftMeta;
};

export function isExpired(expiresAt?: string | Date) {
  // Missing or corrupt expiry → treat as expired (fail-safe: don't allow
  // resuming a draft whose lifetime cannot be determined).
  if (!expiresAt) return true;

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (Number.isNaN(expiry.getTime())) return true;

  return expiry < new Date();
}

export function isExpiringSoon(expiresAt?: string | Date, days = 5) {
  if (!expiresAt) return false;

  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  if (Number.isNaN(expiry.getTime())) return false;

  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + days);

  return expiry > now && expiry <= soon;
}

export function createNewStudentDraft() {
  const draftKeys = Object.keys(localStorage).filter((k) => k.startsWith(NEW_STUDENT_DRAFT_PREFIX));

  for (const key of draftKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    let entry: PersistedDraftEntry;
    try {
      entry = JSON.parse(raw);
    } catch {
      // Corrupted localStorage entry — leave it for listNewStudentDrafts to skip
      // rather than deleting data we can't parse.
      continue;
    }

    if (isExpired(entry.state?.expiresAt)) {
      localStorage.removeItem(key);
    }
  }

  const draftId = crypto.randomUUID();

  return draftId;
}

export function listNewStudentDrafts(type: "viz-school" | "hfse-is") {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(`enrolNewStudent:draft:`) && k.endsWith(`:${type}`))
    .map((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        // Corrupted localStorage entry — skip rather than crashing the whole list.
        return null;
      }
    })
    .filter(Boolean);
}

export function removeNewStudentDraft(draftId: string | undefined, type: "viz-school" | "hfse-is") {
  if (!draftId) return;
  localStorage.removeItem(`${NEW_STUDENT_DRAFT_PREFIX}${draftId}:${type}`);
  window.dispatchEvent(new Event("draft-list-changed"));
}

export type DraftSort = "lastUpdated" | "expiringSoon" | "expired" | "oldest";

export function sortDrafts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drafts: any[],
  sortBy: DraftSort,
) {
  const now = new Date();

  const draftsWithState = drafts as { state: EnrolNewStudentDraftStore }[];

  switch (sortBy) {
    case "lastUpdated":
      return [...draftsWithState].sort(
        (a, b) => new Date(b.state.lastSavedAt).getTime() - new Date(a.state.lastSavedAt).getTime(),
      );

    case "oldest":
      return [...draftsWithState].sort(
        (a, b) => new Date(a.state.createdAt).getTime() - new Date(b.state.createdAt).getTime(),
      );

    case "expiringSoon":
      return [...draftsWithState].sort(
        (a, b) => new Date(a.state.expiresAt ?? 0).getTime() - new Date(b.state.expiresAt ?? 0).getTime(),
      );

    case "expired":
      return draftsWithState.filter((draft) => draft.state.expiresAt && new Date(draft.state.expiresAt) < now);

    default:
      return draftsWithState;
  }
}
