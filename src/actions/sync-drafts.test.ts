import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/drafts", () => ({ listDraftsRemote: vi.fn() }));

const { getRemoteDraftRows } = await import("./sync-drafts");
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
