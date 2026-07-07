import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/sync-drafts", () => ({ getRemoteDraftRows: vi.fn() }));

let mockSession: { user: { email: string } } | null = { user: { email: "parent@example.com" } };
vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

const { useDraftRows } = await import("./use-draft-rows");
const { getRemoteDraftRows } = await import("@/actions/sync-drafts");

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockSession = { user: { email: "parent@example.com" } };
  vi.clearAllMocks();
});

describe("useDraftRows", () => {
  it("starts in a pending state with no data, since it no longer seeds from localStorage", () => {
    vi.mocked(getRemoteDraftRows).mockReturnValue(new Promise(() => {})); // never resolves in this test

    const { result } = renderHook(() => useDraftRows(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("resolves with the database rows once getRemoteDraftRows settles", async () => {
    const rows = [{ state: { draftId: "remote-draft" }, flowType: "hfse-is" as const }];
    vi.mocked(getRemoteDraftRows).mockResolvedValue(rows as never);

    const { result } = renderHook(() => useDraftRows(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(rows));
  });

  it("does not fetch while there is no session", () => {
    mockSession = null;
    vi.mocked(getRemoteDraftRows).mockResolvedValue([]);

    const { result } = renderHook(() => useDraftRows(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(getRemoteDraftRows).not.toHaveBeenCalled();
  });
});
