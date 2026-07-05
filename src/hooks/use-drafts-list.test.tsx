import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/sync-drafts", () => ({ syncDraftsForType: vi.fn() }));

const { useDraftsList } = await import("./use-drafts-list");
const { syncDraftsForType } = await import("@/actions/sync-drafts");

function seedLocalDraft(draftId: string, type: "hfse-is" | "viz-school") {
  const key = `enrolNewStudent:draft:${draftId}:${type}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      state: { draftId, type, formState: { studentInfo: { studentDetails: { firstName: "Local" } } } },
      version: 0,
    }),
  );
}

function remoteEntry(draftId: string, type: "hfse-is" | "viz-school") {
  return {
    state: {
      draftId,
      type,
      academicYear: "2024-2025",
      currentTab: "/enrol-student/new/student-info",
      activeTab: "/enrol-student/new/student-info",
      completedTabs: [],
      formState: { studentInfo: { studentDetails: { firstName: "Remote" } } },
      createdAt: new Date("2024-05-01").toISOString(),
      lastSavedAt: new Date("2024-06-01").toISOString(),
      expiresAt: new Date("2099-01-01").toISOString(),
    },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("useDraftsList", () => {
  it("shows the local snapshot immediately via initialData, with no loading state", () => {
    seedLocalDraft("local-draft", "hfse-is");
    vi.mocked(syncDraftsForType).mockReturnValue(new Promise(() => {})); // never resolves in this test

    const { result } = renderHook(() => useDraftsList("hfse-is"), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].state.draftId).toBe("local-draft");
  });

  it("updates data once the background merge (syncDraftsForType) resolves", async () => {
    seedLocalDraft("local-draft", "hfse-is");
    vi.mocked(syncDraftsForType).mockResolvedValue([remoteEntry("remote-draft", "hfse-is")]);

    const { result } = renderHook(() => useDraftsList("hfse-is"), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([remoteEntry("remote-draft", "hfse-is")]));
  });

  it("does not call syncDraftsForType while disabled", async () => {
    vi.mocked(syncDraftsForType).mockResolvedValue([]);

    renderHook(() => useDraftsList("hfse-is", false), { wrapper });

    await new Promise((r) => setTimeout(r, 10));
    expect(syncDraftsForType).not.toHaveBeenCalled();
  });

  it("refetches each time it transitions from disabled to enabled (e.g. drawer reopened)", async () => {
    vi.mocked(syncDraftsForType).mockResolvedValue([]);

    const { rerender } = renderHook(({ enabled }: { enabled: boolean }) => useDraftsList("hfse-is", enabled), {
      wrapper,
      initialProps: { enabled: true },
    });

    await waitFor(() => expect(syncDraftsForType).toHaveBeenCalledTimes(1));

    rerender({ enabled: false });
    rerender({ enabled: true });

    await waitFor(() => expect(syncDraftsForType).toHaveBeenCalledTimes(2));
  });
});
