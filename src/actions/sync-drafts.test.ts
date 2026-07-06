import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/drafts", () => ({ listDraftsRemote: vi.fn() }));

const { syncDraftsForType, getRemoteDraftRows } = await import("./sync-drafts");
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
// getRemoteDraftRows
// ---------------------------------------------------------------------------

describe("getRemoteDraftRows", () => {
  it("merges both flow types from the server, tags each row with its flowType, and sorts by lastUpdated desc", async () => {
    vi.mocked(listDraftsRemote).mockImplementation(async (type) => [
      remoteEntry(
        type === "hfse-is" ? "hfse-draft" : "viz-draft",
        type,
        { lastSavedAt: type === "hfse-is" ? new Date("2024-01-01").toISOString() : new Date("2024-06-01").toISOString() },
      ),
    ]);

    const rows = await getRemoteDraftRows();

    expect(rows).toEqual([
      expect.objectContaining({ flowType: "viz-school", state: expect.objectContaining({ draftId: "viz-draft" }) }),
      expect.objectContaining({ flowType: "hfse-is", state: expect.objectContaining({ draftId: "hfse-draft" }) }),
    ]);
  });

  it("filters out expired drafts", async () => {
    vi.mocked(listDraftsRemote).mockImplementation(async (type) =>
      type === "hfse-is"
        ? [
            remoteEntry("expired", "hfse-is", { expiresAt: new Date("2020-01-01").toISOString() }),
            remoteEntry("valid", "hfse-is", { expiresAt: new Date("2099-01-01").toISOString() }),
          ]
        : [],
    );

    const rows = await getRemoteDraftRows();

    expect(rows).toHaveLength(1);
    expect(rows[0].state.draftId).toBe("valid");
  });

  it("does not read from or fall back to localStorage — a local-only draft is not included", async () => {
    seedLocalDraft("local-only", "hfse-is");
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const rows = await getRemoteDraftRows();

    expect(rows).toEqual([]);
  });

  it("does not hydrate the local cache as a side effect", async () => {
    vi.mocked(listDraftsRemote).mockResolvedValue([remoteEntry("remote-only", "hfse-is")]);

    await getRemoteDraftRows();

    expect(localStorage.getItem("enrolNewStudent:draft:remote-only:hfse-is")).toBeNull();
  });

  it("propagates a remote fetch failure instead of falling back to local data", async () => {
    vi.mocked(listDraftsRemote).mockRejectedValue(new Error("network down"));

    await expect(getRemoteDraftRows()).rejects.toThrow("network down");
  });
});
