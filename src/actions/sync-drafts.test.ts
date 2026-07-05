import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/drafts", () => ({ listDraftsRemote: vi.fn() }));

const { syncDraftsForType, getMergedDraftRows } = await import("./sync-drafts");
const { listDraftsRemote } = await import("@/actions/drafts");

function seedLocalDraft(draftId: string, type: "hfse-is" | "viz-school", overrides: Record<string, unknown> = {}) {
  const key = `enrolNewStudent:draft:${draftId}:${type}`;
  const entry = {
    state: {
      draftId,
      type,
      academicYear: "2024-2025",
      activeTab: "/enrol-student/new/student-info",
      currentTab: "/enrol-student/new/student-info",
      completedTabs: [],
      formState: { studentInfo: { studentDetails: { firstName: "Local" } } },
      lastSavedAt: new Date("2024-06-01").toISOString(),
      createdAt: new Date("2024-05-01").toISOString(),
      expiresAt: new Date("2099-01-01").toISOString(),
      ...overrides,
    },
    version: 0,
  };
  localStorage.setItem(key, JSON.stringify(entry));
}

function remoteEntry(draftId: string, type: "hfse-is" | "viz-school", overrides: Record<string, unknown> = {}) {
  return {
    state: {
      draftId,
      type,
      academicYear: "2024-2025",
      activeTab: "/enrol-student/new/family-info",
      currentTab: "/enrol-student/new/family-info",
      completedTabs: [],
      formState: { studentInfo: { studentDetails: { firstName: "Remote" } } },
      lastSavedAt: new Date("2024-07-01").toISOString(),
      createdAt: new Date("2024-05-01").toISOString(),
      expiresAt: new Date("2099-01-01").toISOString(),
      ...overrides,
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("syncDraftsForType", () => {
  it("returns an empty array when there is nothing local or remote", async () => {
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    expect(await syncDraftsForType("hfse-is")).toEqual([]);
  });

  it("includes a local-only draft untouched (no remote counterpart)", async () => {
    seedLocalDraft("local-only", "hfse-is");
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const result = await syncDraftsForType("hfse-is");

    expect(result).toHaveLength(1);
    expect(result[0].state.draftId).toBe("local-only");
    expect(result[0].state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Local" } } });
  });

  it("hydrates a remote-only draft into the local cache and includes it in the result", async () => {
    vi.mocked(listDraftsRemote).mockResolvedValue([remoteEntry("remote-only", "hfse-is")]);

    const result = await syncDraftsForType("hfse-is");

    expect(result).toHaveLength(1);
    expect(result[0].state.draftId).toBe("remote-only");

    const cached = localStorage.getItem("enrolNewStudent:draft:remote-only:hfse-is");
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached!).state.formState).toEqual({
      studentInfo: { studentDetails: { firstName: "Remote" } },
    });
  });

  it("prefers the remote copy when it has a newer lastSavedAt, and re-hydrates the cache", async () => {
    seedLocalDraft("shared-draft", "hfse-is", { lastSavedAt: new Date("2024-01-01").toISOString() });
    vi.mocked(listDraftsRemote).mockResolvedValue([
      remoteEntry("shared-draft", "hfse-is", { lastSavedAt: new Date("2024-12-01").toISOString() }),
    ]);

    const result = await syncDraftsForType("hfse-is");

    expect(result).toHaveLength(1);
    expect(result[0].state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Remote" } } });

    const cached = JSON.parse(localStorage.getItem("enrolNewStudent:draft:shared-draft:hfse-is")!);
    expect(cached.state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Remote" } } });
  });

  it("keeps the local copy when it has a newer lastSavedAt than the remote, without re-hydrating", async () => {
    seedLocalDraft("shared-draft", "hfse-is", { lastSavedAt: new Date("2024-12-01").toISOString() });
    vi.mocked(listDraftsRemote).mockResolvedValue([
      remoteEntry("shared-draft", "hfse-is", { lastSavedAt: new Date("2024-01-01").toISOString() }),
    ]);

    const result = await syncDraftsForType("hfse-is");

    expect(result).toHaveLength(1);
    expect(result[0].state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Local" } } });

    // The local cache must be untouched — still the local copy, not overwritten with the older remote one.
    const cached = JSON.parse(localStorage.getItem("enrolNewStudent:draft:shared-draft:hfse-is")!);
    expect(cached.state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Local" } } });
  });

  it("falls back to local-only data when the remote fetch fails", async () => {
    seedLocalDraft("local-only", "hfse-is");
    vi.mocked(listDraftsRemote).mockRejectedValue(new Error("network down"));

    const result = await syncDraftsForType("hfse-is");

    expect(result).toHaveLength(1);
    expect(result[0].state.draftId).toBe("local-only");
  });

  it("keeps hfse-is and viz-school entries separate", async () => {
    seedLocalDraft("draft-1", "viz-school");
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const result = await syncDraftsForType("hfse-is");

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getMergedDraftRows
// ---------------------------------------------------------------------------

describe("getMergedDraftRows", () => {
  it("merges both flow types, tags each row with its flowType, and sorts by lastUpdated desc", async () => {
    seedLocalDraft("hfse-draft", "hfse-is", { lastSavedAt: new Date("2024-01-01").toISOString() });
    seedLocalDraft("viz-draft", "viz-school", { lastSavedAt: new Date("2024-06-01").toISOString() });
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const rows = await getMergedDraftRows();

    expect(rows).toEqual([
      expect.objectContaining({ flowType: "viz-school", state: expect.objectContaining({ draftId: "viz-draft" }) }),
      expect.objectContaining({ flowType: "hfse-is", state: expect.objectContaining({ draftId: "hfse-draft" }) }),
    ]);
  });

  it("filters out expired drafts", async () => {
    seedLocalDraft("expired", "hfse-is", { expiresAt: new Date("2020-01-01").toISOString() });
    seedLocalDraft("valid", "hfse-is", { expiresAt: new Date("2099-01-01").toISOString() });
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const rows = await getMergedDraftRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].state.draftId).toBe("valid");
  });

  it("includes remote-only drafts from either flow", async () => {
    vi.mocked(listDraftsRemote).mockImplementation(async (type) => [
      remoteEntry(type === "hfse-is" ? "remote-hfse" : "remote-viz", type),
    ]);

    const rows = await getMergedDraftRows();

    expect(rows.map((r) => r.state.draftId).sort()).toEqual(["remote-hfse", "remote-viz"]);
  });
});
