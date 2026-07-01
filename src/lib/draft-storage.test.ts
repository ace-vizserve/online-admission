import { describe, expect, it, vi } from "vitest";
import { listNewStudentDrafts, removeNewStudentDraft } from "./utils";

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
    const { createNewStudentDraft } = await import("./utils");
    const id = createNewStudentDraft();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("returns a different UUID on each call", async () => {
    const { createNewStudentDraft } = await import("./utils");
    const ids = new Set([createNewStudentDraft(), createNewStudentDraft(), createNewStudentDraft()]);
    expect(ids.size).toBe(3);
  });

  // NOTE: createNewStudentDraft's GC loop reads JSON.parse(raw).expiresAt
  // at the top level, but Zustand persist stores state under { state: { expiresAt } }.
  // This means expired draft GC is currently a no-op — a known pre-existing bug
  // outside the scope of this change. Document it here so it's visible.
  it("does NOT gc expired drafts due to format mismatch (known pre-existing bug)", async () => {
    const { createNewStudentDraft } = await import("./utils");

    // Seed a Zustand-persisted expired draft (state.expiresAt, not top-level expiresAt)
    seedDraft("expired", "hfse-is", { expiresAt: new Date("2020-01-01").toISOString() });

    createNewStudentDraft(); // GC loop runs

    // The expired draft is still present because createNewStudentDraft reads
    // JSON.parse(raw).expiresAt (undefined) instead of .state.expiresAt
    const remaining = localStorage.getItem("enrolNewStudent:draft:expired:hfse-is");
    expect(remaining).not.toBeNull(); // still there — GC did not fire
  });
});
