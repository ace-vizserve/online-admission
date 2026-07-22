/**
 * Coverage for OldStudentLayout's ExitApplicationDialog — specifically the Phase 2 addition:
 * canceling a re-enrollment must also delete the DB-backed draft (application_drafts, type
 * "hfse-is-reenrol"), not just the local store, so a leftover remote row can't resurrect
 * discarded edits if this enrolee's link is opened again. Hydration/sync are mocked out (each
 * has its own dedicated unit coverage in use-hydrate-reenrollment.test.tsx /
 * use-sync-reenrol-draft.test.tsx) so this file can focus on the exit flow itself.
 */
import EnrolOldStudentContextProvider from "@/context/enrol-old-student-context";
import { resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolOldStudentStore, useSelectAcademicYear } from "@/zustand-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-hydrate-reenrollment", () => ({
  useHydrateReEnrollment: vi.fn(() => ({ isPending: false, isNotFound: false })),
}));
vi.mock("@/hooks/use-sync-reenrol-draft", () => ({ useSyncReenrolDraft: vi.fn() }));
// Real drafts.ts would reach the real Supabase client the moment Exit is clicked — mocked here
// purely to keep this test from making a real network call (same reasoning as
// submit-application-dialog.test.tsx's identical mock).
vi.mock("@/actions/drafts", () => ({ deleteReenrolDraftRemote: vi.fn() }));
// react-responsive's useMediaQuery reads window.matchMedia, which src/test/setup.ts stubs to
// always report "not matching" — that would route ExitApplicationDialog into its Drawer (vaul)
// branch. Forcing the desktop/AlertDialog branch instead keeps this test aligned with how
// submit-application-dialog.test.tsx already exercises the equivalent dialog.
vi.mock("react-responsive", () => ({ useMediaQuery: () => true }));

const OldStudentLayout = (await import("./old-student-layout")).default;
const { deleteReenrolDraftRemote } = await import("@/actions/drafts");

function renderLayout() {
  seedFormState("hfse-old", { studentInfo: { studentDetails: { firstName: "Juan" } } });
  useSelectAcademicYear.setState({ academicYear: "ay2027" });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/enrol-student/enrolee-1/student-info?academicYear=ay2027"]}>
        <EnrolOldStudentContextProvider>
          <Routes>
            <Route path="/enrol-student/:id/*" element={<OldStudentLayout />}>
              <Route path="student-info" element={<div>student info page</div>} />
            </Route>
          </Routes>
        </EnrolOldStudentContextProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  resetEnrolmentStores();
  vi.mocked(deleteReenrolDraftRemote).mockResolvedValue(undefined);
});

describe("OldStudentLayout — ExitApplicationDialog", () => {
  it("deletes the remote re-enrollment draft (scoped to this enrolee) and clears the local store on Exit", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    await user.click(await screen.findByRole("button", { name: "Exit Anyway" }));

    await waitFor(() => expect(deleteReenrolDraftRemote).toHaveBeenCalledWith("enrolee-1"));
    expect(useEnrolOldStudentStore.getState().formState).toEqual({});
  });

  it("still clears the local store even when deleting the remote draft fails (best-effort cleanup)", async () => {
    vi.mocked(deleteReenrolDraftRemote).mockRejectedValueOnce(new Error("network down"));
    const user = userEvent.setup();
    renderLayout();

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    await user.click(await screen.findByRole("button", { name: "Exit Anyway" }));

    await waitFor(() => expect(deleteReenrolDraftRemote).toHaveBeenCalledWith("enrolee-1"));
    expect(useEnrolOldStudentStore.getState().formState).toEqual({});
  });
});
