import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/sync-drafts", () => ({ getMergedDraftRows: vi.fn() }));

const { useMergedDraftRows } = await import("./use-merged-draft-rows");
const { getMergedDraftRows } = await import("@/actions/sync-drafts");

function seedLocalDraft(draftId: string, type: "hfse-is" | "viz-school") {
  const key = `enrolNewStudent:draft:${draftId}:${type}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      state: {
        draftId,
        type,
        formState: {},
        expiresAt: new Date("2099-01-01").toISOString(),
        lastSavedAt: new Date("2024-01-01").toISOString(),
      },
      version: 0,
    }),
  );
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("useMergedDraftRows", () => {
  it("shows the local snapshot immediately via initialData, with no loading state", () => {
    seedLocalDraft("local-draft", "hfse-is");
    vi.mocked(getMergedDraftRows).mockReturnValue(new Promise(() => {})); // never resolves in this test

    const { result } = renderHook(() => useMergedDraftRows(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].state.draftId).toBe("local-draft");
  });

  it("updates data once the background merge (getMergedDraftRows) resolves", async () => {
    seedLocalDraft("local-draft", "hfse-is");
    const merged = [{ state: { draftId: "remote-draft" }, flowType: "viz-school" as const }];
    vi.mocked(getMergedDraftRows).mockResolvedValue(merged as never);

    const { result } = renderHook(() => useMergedDraftRows(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(merged));
  });
});
