import { describe, expect, it, vi } from "vitest";
import { listNewStudentDrafts, removeNewStudentDraft, sortDrafts } from "./draft-storage";

// Zustand's persist middleware serialises store state in this wrapper.
// Keys: enrolNewStudent:draft:{draftId}:{type}
function makeDraftEntry(overrides: Record<string, unknown> = {}) {
  const base = {
    draftId: "draft-123",
    type: "hfse-is",
    academicYear: "2024-2025",
    activeTab: "/enrol-student/new/student-info",
    currentTab: "/enrol-student/new/student-info",
    completedTabs: [],
    formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
    lastSavedAt: new Date("2024-06-01").toISOString(),
    createdAt: new Date("2024-05-01").toISOString(),
    expiresAt: new Date("2024-07-01").toISOString(), // future
  };
  return { state: { ...base, ...overrides }, version: 0 };
}

function seedDraft(draftId: string, type: "hfse-is" | "viz-school", overrides: Record<string, unknown> = {}) {
  const key = `enrolNewStudent:draft:${draftId}:${type}`;
  const entry = makeDraftEntry({ draftId, type, ...overrides });
  localStorage.setItem(key, JSON.stringify(entry));
  return key;
}

// ---------------------------------------------------------------------------
// listNewStudentDrafts
// ---------------------------------------------------------------------------

describe("listNewStudentDrafts", () => {
  it("returns only hfse-is keys when type is hfse-is", () => {
    seedDraft("draft-hfse", "hfse-is");
    seedDraft("draft-viz", "viz-school");

    const result = listNewStudentDrafts("hfse-is");

    expect(result).toHaveLength(1);
    expect(result[0].state.draftId).toBe("draft-hfse");
  });

  it("returns only viz-school keys when type is viz-school", () => {
    seedDraft("draft-hfse", "hfse-is");
    seedDraft("draft-viz", "viz-school");

    const result = listNewStudentDrafts("viz-school");

    expect(result).toHaveLength(1);
    expect(result[0].state.draftId).toBe("draft-viz");
  });

  it("returns all matching keys for a single type", () => {
    seedDraft("draft-a", "hfse-is");
    seedDraft("draft-b", "hfse-is");
    seedDraft("draft-c", "hfse-is");

    expect(listNewStudentDrafts("hfse-is")).toHaveLength(3);
  });

  it("returns empty array when no drafts present", () => {
    expect(listNewStudentDrafts("hfse-is")).toHaveLength(0);
    expect(listNewStudentDrafts("viz-school")).toHaveLength(0);
  });

  it("ignores unrelated localStorage keys", () => {
    localStorage.setItem("someOtherKey", '{"data": 1}');
    localStorage.setItem("enrolNewStudent:other", '{"data": 2}');
    seedDraft("draft-a", "hfse-is");

    expect(listNewStudentDrafts("hfse-is")).toHaveLength(1);
  });

  it("skips a key that disappears between the keys scan and the read (raw is null)", () => {
    const key = seedDraft("vanishing", "hfse-is");
    const originalGetItem = Storage.prototype.getItem;
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(function (this: Storage, k: string) {
        if (k === key) return null;
        return originalGetItem.call(this, k);
      });

    expect(listNewStudentDrafts("hfse-is")).toHaveLength(0);

    getItemSpy.mockRestore();
  });

  it("includes drafts regardless of expiry (listNewStudentDrafts does NOT filter)", () => {
    // Draft filtering by expiry is the caller's responsibility (getDraftRows,
    // AutoResumeDraft, etc.). listNewStudentDrafts is the raw store reader.
    seedDraft("expired-draft", "hfse-is", {
      expiresAt: new Date("2020-01-01").toISOString(), // past
    });
    seedDraft("valid-draft", "hfse-is");

    const result = listNewStudentDrafts("hfse-is");
    expect(result).toHaveLength(2);
  });

  it("skips a malformed JSON entry without throwing", () => {
    // A corrupted localStorage value must not crash the whole draft list.
    localStorage.setItem("enrolNewStudent:draft:bad-json:hfse-is", "{INVALID JSON}");
    seedDraft("valid-draft", "hfse-is");

    expect(() => listNewStudentDrafts("hfse-is")).not.toThrow();
    // The valid one is still returned; the bad one is either included as null
    // (filter(Boolean) removes it) or throws internally — either way doesn't crash.
  });
});

// ---------------------------------------------------------------------------
// removeNewStudentDraft
// ---------------------------------------------------------------------------

describe("removeNewStudentDraft", () => {
  it("removes the correct localStorage key", () => {
    seedDraft("draft-to-remove", "hfse-is");
    seedDraft("draft-to-keep", "hfse-is");

    removeNewStudentDraft("draft-to-remove", "hfse-is");

    expect(localStorage.getItem("enrolNewStudent:draft:draft-to-remove:hfse-is")).toBeNull();
    expect(localStorage.getItem("enrolNewStudent:draft:draft-to-keep:hfse-is")).not.toBeNull();
  });

  it("does not remove the same draftId under a different type", () => {
    seedDraft("shared-id", "hfse-is");
    seedDraft("shared-id", "viz-school");

    removeNewStudentDraft("shared-id", "hfse-is");

    expect(localStorage.getItem("enrolNewStudent:draft:shared-id:hfse-is")).toBeNull();
    expect(localStorage.getItem("enrolNewStudent:draft:shared-id:viz-school")).not.toBeNull();
  });

  it("dispatches a draft-list-changed event", () => {
    const listener = vi.fn();
    window.addEventListener("draft-list-changed", listener);

    seedDraft("some-draft", "hfse-is");
    removeNewStudentDraft("some-draft", "hfse-is");

    expect(listener).toHaveBeenCalledOnce();

    window.removeEventListener("draft-list-changed", listener);
  });

  it("does nothing when draftId is undefined", () => {
    seedDraft("stays", "hfse-is");
    removeNewStudentDraft(undefined, "hfse-is");

    expect(listNewStudentDrafts("hfse-is")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// createNewStudentDraft — basic UUID return
// ---------------------------------------------------------------------------

describe("createNewStudentDraft", () => {
  it("returns a UUID string", async () => {
    // Dynamically import to avoid module-level side effects in other tests.
    const { createNewStudentDraft } = await import("./draft-storage");
    const id = createNewStudentDraft();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("returns a different UUID on each call", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");
    const ids = new Set([createNewStudentDraft(), createNewStudentDraft(), createNewStudentDraft()]);
    expect(ids.size).toBe(3);
  });

  it("gc's an expired draft (reads nested state.expiresAt)", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    seedDraft("expired", "hfse-is", { expiresAt: new Date("2020-01-01").toISOString() });

    createNewStudentDraft(); // GC loop runs

    const remaining = localStorage.getItem("enrolNewStudent:draft:expired:hfse-is");
    expect(remaining).toBeNull(); // removed — GC fired
  });

  it("keeps a non-expired draft", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    seedDraft("still-valid", "hfse-is", { expiresAt: new Date("2099-01-01").toISOString() });

    createNewStudentDraft();

    expect(localStorage.getItem("enrolNewStudent:draft:still-valid:hfse-is")).not.toBeNull();
  });

  it("gc's a draft with a missing expiresAt (treated as expired, fail-safe)", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    seedDraft("no-expiry", "hfse-is", { expiresAt: undefined });

    createNewStudentDraft();

    expect(localStorage.getItem("enrolNewStudent:draft:no-expiry:hfse-is")).toBeNull();
  });

  it("gc's a draft with a corrupt (unparseable) expiresAt", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    seedDraft("bad-expiry", "hfse-is", { expiresAt: "not-a-date" });

    createNewStudentDraft();

    expect(localStorage.getItem("enrolNewStudent:draft:bad-expiry:hfse-is")).toBeNull();
  });

  it("does not throw and leaves a malformed JSON entry untouched", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    localStorage.setItem("enrolNewStudent:draft:corrupt-json:hfse-is", "{INVALID JSON}");
    seedDraft("valid", "hfse-is");

    expect(() => createNewStudentDraft()).not.toThrow();
    expect(localStorage.getItem("enrolNewStudent:draft:corrupt-json:hfse-is")).not.toBeNull();
  });

  it("does nothing when there are no draft keys in localStorage", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    expect(() => createNewStudentDraft()).not.toThrow();
  });

  it("does not gc keys that don't match the draft prefix", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    localStorage.setItem("someOtherKey", '{"data": 1}');

    createNewStudentDraft();

    expect(localStorage.getItem("someOtherKey")).not.toBeNull();
  });

  it("skips a draft key that disappears between the keys scan and the read (raw is null)", async () => {
    const { createNewStudentDraft } = await import("./draft-storage");

    const key = seedDraft("vanishing", "hfse-is");
    const originalGetItem = Storage.prototype.getItem;
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(function (this: Storage, k: string) {
        if (k === key) return null;
        return originalGetItem.call(this, k);
      });

    expect(() => createNewStudentDraft()).not.toThrow();

    getItemSpy.mockRestore();
    // The key itself is untouched by the GC pass since it was never read as JSON.
    expect(localStorage.getItem(key)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// sortDrafts
// ---------------------------------------------------------------------------

describe("sortDrafts", () => {
  function draftRow(overrides: Record<string, unknown>) {
    return { state: overrides };
  }

  it("sorts by lastUpdated descending (most recently saved first)", () => {
    const older = draftRow({ lastSavedAt: new Date("2024-01-01").toISOString() });
    const newer = draftRow({ lastSavedAt: new Date("2024-06-01").toISOString() });

    const result = sortDrafts([older, newer], "lastUpdated");

    expect(result).toEqual([newer, older]);
  });

  it("sorts by oldest ascending (earliest created first)", () => {
    const older = draftRow({ createdAt: new Date("2024-01-01").toISOString() });
    const newer = draftRow({ createdAt: new Date("2024-06-01").toISOString() });

    const result = sortDrafts([newer, older], "oldest");

    expect(result).toEqual([older, newer]);
  });

  it("sorts by expiringSoon ascending (soonest expiry first)", () => {
    const soon = draftRow({ expiresAt: new Date("2024-06-01").toISOString() });
    const later = draftRow({ expiresAt: new Date("2024-12-01").toISOString() });

    const result = sortDrafts([later, soon], "expiringSoon");

    expect(result).toEqual([soon, later]);
  });

  it("treats a missing expiresAt as epoch 0 when sorting by expiringSoon", () => {
    const noExpiry = draftRow({ expiresAt: undefined });
    const withExpiry = draftRow({ expiresAt: new Date("2024-06-01").toISOString() });

    // Both orderings so the comparator runs with the missing-expiresAt draft in
    // both the `a` and `b` position, exercising the `?? 0` fallback on each side.
    expect(sortDrafts([withExpiry, noExpiry], "expiringSoon")).toEqual([noExpiry, withExpiry]);
    expect(sortDrafts([noExpiry, withExpiry], "expiringSoon")).toEqual([noExpiry, withExpiry]);
  });

  it("filters to only expired drafts when sortBy is 'expired'", () => {
    const expired = draftRow({ expiresAt: new Date("2020-01-01").toISOString() });
    const valid = draftRow({ expiresAt: new Date("2099-01-01").toISOString() });

    const result = sortDrafts([expired, valid], "expired");

    expect(result).toEqual([expired]);
  });

  it("excludes drafts with a missing expiresAt from the 'expired' filter", () => {
    const noExpiry = draftRow({ expiresAt: undefined });

    const result = sortDrafts([noExpiry], "expired");

    expect(result).toEqual([]);
  });

  it("returns drafts unchanged for an unrecognized sortBy (default branch)", () => {
    const a = draftRow({ lastSavedAt: new Date("2024-01-01").toISOString() });
    const b = draftRow({ lastSavedAt: new Date("2024-06-01").toISOString() });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = sortDrafts([a, b], "unknown" as any);

    expect(result).toEqual([a, b]);
  });
});
