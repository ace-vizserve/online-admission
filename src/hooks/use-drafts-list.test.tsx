import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/drafts", () => ({ listDraftsRemote: vi.fn() }));

let mockSession: { user: { email: string } } | null = { user: { email: "parent@example.com" } };
vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

const { useDraftsList } = await import("./use-drafts-list");
const { listDraftsRemote } = await import("@/actions/drafts");

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
  mockSession = { user: { email: "parent@example.com" } };
  vi.clearAllMocks();
});

describe("useDraftsList", () => {
  it("starts in a pending state with no data, since it does not seed from localStorage", () => {
    vi.mocked(listDraftsRemote).mockReturnValue(new Promise(() => {})); // never resolves in this test

    const { result } = renderHook(() => useDraftsList("hfse-is"), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("resolves with the database rows once listDraftsRemote settles", async () => {
    vi.mocked(listDraftsRemote).mockResolvedValue([remoteEntry("remote-draft", "hfse-is")]);

    const { result } = renderHook(() => useDraftsList("hfse-is"), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([remoteEntry("remote-draft", "hfse-is")]));
  });

  it("does not fetch while there is no session", () => {
    mockSession = null;
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const { result } = renderHook(() => useDraftsList("hfse-is"), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(listDraftsRemote).not.toHaveBeenCalled();
  });

  it("does not call listDraftsRemote while disabled", async () => {
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    renderHook(() => useDraftsList("hfse-is", false), { wrapper });

    await new Promise((r) => setTimeout(r, 10));
    expect(listDraftsRemote).not.toHaveBeenCalled();
  });

  it("refetches each time it transitions from disabled to enabled (e.g. drawer reopened)", async () => {
    vi.mocked(listDraftsRemote).mockResolvedValue([]);

    const { rerender } = renderHook(({ enabled }: { enabled: boolean }) => useDraftsList("hfse-is", enabled), {
      wrapper,
      initialProps: { enabled: true },
    });

    await waitFor(() => expect(listDraftsRemote).toHaveBeenCalledTimes(1));

    rerender({ enabled: false });
    rerender({ enabled: true });

    await waitFor(() => expect(listDraftsRemote).toHaveBeenCalledTimes(2));
  });
});
