/**
 * The declaration queries must not fire while nobody is signed in — sisFetch would reject for
 * a missing token and the page would show an auth error to someone who is simply signed out.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const { useSession, listDeclarations, listEnrolledStudents } = vi.hoisted(() => ({
  useSession: vi.fn(),
  listDeclarations: vi.fn(),
  listEnrolledStudents: vi.fn(),
}));

vi.mock("@/hooks/use-session", () => ({ default: useSession }));
vi.mock("@/actions/declarations", () => ({ listDeclarations, listEnrolledStudents }));

const { useDeclarations } = await import("./use-declarations");
const { useEnrolledStudents } = await import("./use-enrolled-students");

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const signedIn = { session: { user: { email: "parent@example.com" } } };

beforeEach(() => {
  useSession.mockReset().mockReturnValue(signedIn);
  listDeclarations.mockReset().mockResolvedValue([]);
  listEnrolledStudents.mockReset().mockResolvedValue([]);
});

describe("useDeclarations", () => {
  it("fetches the filed declarations for a signed-in parent", async () => {
    const rows = [{ id: "3a1f", statusLabel: "With the school" }];
    listDeclarations.mockResolvedValue(rows);

    const { result } = renderHook(() => useDeclarations(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(rows));
  });

  it("does not call the SIS while nobody is signed in", async () => {
    useSession.mockReturnValue({ session: null });

    renderHook(() => useDeclarations(), { wrapper });

    await waitFor(() => expect(listDeclarations).not.toHaveBeenCalled());
  });
});

describe("useEnrolledStudents", () => {
  it("fetches the children the parent may file for", async () => {
    const students = [{ studentNumber: "H250123", name: "Ana Reyes", className: "P4 Diligence" }];
    listEnrolledStudents.mockResolvedValue(students);

    const { result } = renderHook(() => useEnrolledStudents(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(students));
  });

  it("does not call the SIS while nobody is signed in", async () => {
    useSession.mockReturnValue({ session: null });

    renderHook(() => useEnrolledStudents(), { wrapper });

    await waitFor(() => expect(listEnrolledStudents).not.toHaveBeenCalled());
  });
});
