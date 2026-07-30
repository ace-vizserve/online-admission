/**
 * Coverage for usePendingTasks, the shared source behind the sidebar "Document Requirements"
 * badge, the dashboard stat card, and the Document Requirements page. Mirrors
 * use-draft-rows.test.tsx.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/private", () => ({ getSectionCardsDetails: vi.fn() }));

let mockSession: { user: { email: string } } | null = { user: { email: "parent@example.com" } };
vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

const { usePendingTasks } = await import("./use-pending-tasks");
const { getSectionCardsDetails } = await import("@/actions/private");

const DETAILS = {
  totalEnrollments: 2,
  pendingTasks: {
    totalPendingTasks: 1,
    pendingTasks: [{ enroleeNumber: "E270001", studentDocs: [{ birthCert: "To follow" }] }],
  },
  currentEnrolledStudents: [],
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockSession = { user: { email: "parent@example.com" } };
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.clearAllMocks();
});

describe("usePendingTasks", () => {
  it("starts pending with no data while the details request is in flight", () => {
    vi.mocked(getSectionCardsDetails).mockReturnValue(new Promise(() => {})); // never resolves in this test

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("resolves with the section-card details once the request settles", async () => {
    vi.mocked(getSectionCardsDetails).mockResolvedValue(DETAILS as never);

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(DETAILS));
  });

  it("does not fetch while there is no session", () => {
    mockSession = null;
    vi.mocked(getSectionCardsDetails).mockResolvedValue(DETAILS as never);

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(getSectionCardsDetails).not.toHaveBeenCalled();
  });

  it("leaves data undefined when the action swallows its own error", async () => {
    // getSectionCardsDetails toasts and returns undefined on failure rather than rejecting
    // (src/actions/private.ts). React Query rejects an undefined success value outright ("Query
    // data cannot be undefined"), so this path settles as an error with no data — which is why
    // every consumer reads it through `data?.` and never assumes a payload.
    vi.mocked(getSectionCardsDetails).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(true);
  });

  it("scopes the cache by email so a re-login cannot read the previous parent's data", async () => {
    vi.mocked(getSectionCardsDetails).mockResolvedValue(DETAILS as never);

    const { result } = renderHook(() => usePendingTasks(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(DETAILS));

    expect(queryClient.getQueryData(["pending-tasks", "parent@example.com"])).toEqual(DETAILS);
    expect(queryClient.getQueryData(["pending-tasks", "other@example.com"])).toBeUndefined();
  });
});
