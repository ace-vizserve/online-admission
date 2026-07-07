import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/drafts", () => ({ loadDraftRemote: vi.fn() }));

const { resolveResumeDraft } = await import("./resolve-draft");
const { loadDraftRemote } = await import("@/actions/drafts");

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
      formState: { studentInfo: { studentDetails: { firstName: "Stale-Local" } } },
      lastSavedAt: new Date("2024-01-01").toISOString(),
      createdAt: new Date("2024-01-01").toISOString(),
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
      completedTabs: ["/enrol-student/new/student-info"],
      formState: { studentInfo: { studentDetails: { firstName: "Fresh-Remote" } } },
      createdAt: new Date("2024-05-01").toISOString(),
      lastSavedAt: new Date("2024-07-01").toISOString(),
      expiresAt: new Date("2099-01-01").toISOString(),
      ...overrides,
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("resolveResumeDraft", () => {
  it("prefers the database over a stale local copy of the same draft", async () => {
    seedLocalDraft("shared-draft", "hfse-is");
    vi.mocked(loadDraftRemote).mockResolvedValue(remoteEntry("shared-draft", "hfse-is"));

    const result = await resolveResumeDraft("shared-draft", "hfse-is");

    expect(result?.state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Fresh-Remote" } } });
  });

  it("writes the database hit into the local cache so a later offline resume still works", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValue(remoteEntry("shared-draft", "hfse-is"));

    await resolveResumeDraft("shared-draft", "hfse-is");

    const cached = JSON.parse(localStorage.getItem("enrolNewStudent:draft:shared-draft:hfse-is")!);
    expect(cached.state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Fresh-Remote" } } });
  });

  it("overwrites a stale local cache entry with the fresher database copy", async () => {
    seedLocalDraft("shared-draft", "hfse-is");
    vi.mocked(loadDraftRemote).mockResolvedValue(remoteEntry("shared-draft", "hfse-is"));

    await resolveResumeDraft("shared-draft", "hfse-is");

    const cached = JSON.parse(localStorage.getItem("enrolNewStudent:draft:shared-draft:hfse-is")!);
    expect(cached.state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Fresh-Remote" } } });
  });

  it("returns null on a clean remote miss, without resurrecting a stale local copy", async () => {
    seedLocalDraft("deleted-draft", "hfse-is");
    vi.mocked(loadDraftRemote).mockResolvedValue(null);

    const result = await resolveResumeDraft("deleted-draft", "hfse-is");

    expect(result).toBeNull();
  });

  it("falls back to the matching local entry when the remote lookup fails", async () => {
    seedLocalDraft("offline-draft", "hfse-is");
    vi.mocked(loadDraftRemote).mockRejectedValue(new Error("network down"));

    const result = await resolveResumeDraft("offline-draft", "hfse-is");

    expect(result?.state.formState).toEqual({ studentInfo: { studentDetails: { firstName: "Stale-Local" } } });
  });

  it("returns null when the remote lookup fails and there is no local entry either", async () => {
    vi.mocked(loadDraftRemote).mockRejectedValue(new Error("network down"));

    const result = await resolveResumeDraft("nowhere-draft", "hfse-is");

    expect(result).toBeNull();
  });

  it("keeps hfse-is and viz-school local fallback entries separate", async () => {
    seedLocalDraft("draft-1", "viz-school");
    vi.mocked(loadDraftRemote).mockRejectedValue(new Error("network down"));

    const result = await resolveResumeDraft("draft-1", "hfse-is");

    expect(result).toBeNull();
  });
});
