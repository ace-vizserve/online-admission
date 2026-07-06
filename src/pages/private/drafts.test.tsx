/**
 * Behavior tests for the Saved Drafts page, added alongside the drafts-source-of-truth change
 * (database is now the source of truth for the list — see src/hooks/use-draft-rows.ts). Covers
 * the loading skeleton (isPending), the empty state, rendering rows, "Continue" navigation with
 * the resumeDraftId + academic year wiring for both flow types, and the discard cache update.
 */
import type { DraftRow } from "@/components/private/drafts/draft-ticket";
import { resetEnrolmentStores } from "@/test/render-form";
import { useSelectAcademicYear } from "@/zustand-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/discard-draft", () => ({ discardDraft: vi.fn() }));
vi.mock("@/hooks/use-draft-rows", () => ({ useDraftRows: vi.fn() }));

const navigateMock = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

const { discardDraft } = await import("@/actions/discard-draft");
const { useDraftRows } = await import("@/hooks/use-draft-rows");
const { default: Drafts } = await import("./drafts");

const DRAFT_ROWS_KEY = ["drafts", "remote-rows"];

function draftRow(flowType: "hfse-is" | "viz-school", overrides: Record<string, unknown> = {}): DraftRow {
  return {
    flowType,
    state: {
      draftId: "draft-1",
      academicYear: "ay2025",
      activeTab: "/enrol-student/new/student-info",
      currentTab: "/enrol-student/new/student-info",
      completedTabs: [],
      lastSavedAt: new Date("2024-06-01"),
      expiresAt: new Date("2099-01-01"),
      formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
      ...overrides,
    },
  } as unknown as DraftRow;
}

function renderDrafts(seedRows?: DraftRow[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (seedRows) queryClient.setQueryData(DRAFT_ROWS_KEY, seedRows);

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/admission/drafts"]}>
        <Drafts />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...utils, queryClient };
}

beforeEach(() => {
  resetEnrolmentStores();
  navigateMock.mockReset();
  vi.mocked(discardDraft).mockReset();
  vi.mocked(useDraftRows).mockReset();
});

describe("Drafts page", () => {
  it("shows the loading skeleton (not the empty state) while the query is pending", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: undefined, isPending: true } as never);

    const { container } = renderDrafts();

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText(/No applications in progress/)).not.toBeInTheDocument();
  });

  it("shows the empty state once loaded with zero rows", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: [], isPending: false } as never);

    renderDrafts();

    expect(screen.getByText(/No applications in progress/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start an application/ })).toHaveAttribute("href", "/enrol-student");
  });

  it("renders a row per draft with the applications-waiting count", () => {
    vi.mocked(useDraftRows).mockReturnValue({
      data: [draftRow("hfse-is", { draftId: "draft-1" }), draftRow("hfse-is", { draftId: "draft-2" })],
      isPending: false,
    } as never);

    renderDrafts();

    expect(screen.getByText("2 applications waiting to be completed")).toBeInTheDocument();
  });

  it("continuing an hfse-is draft sets the academic year and navigates with resumeDraftId in state", async () => {
    const user = userEvent.setup();
    vi.mocked(useDraftRows).mockReturnValue({
      data: [draftRow("hfse-is", { draftId: "draft-1", academicYear: "ay2025" })],
      isPending: false,
    } as never);

    renderDrafts();
    await user.click(screen.getAllByRole("button", { name: /Continue/ })[0]);

    expect(useSelectAcademicYear.getState().academicYear).toBe("ay2025");
    expect(navigateMock).toHaveBeenCalledWith(
      "/enrol-student/new/student-info?academicYear=ay2025",
      expect.objectContaining({ state: { resumeDraftId: "draft-1" } }),
    );
  });

  it("continuing a viz-school draft navigates to the vizschool route", async () => {
    const user = userEvent.setup();
    vi.mocked(useDraftRows).mockReturnValue({
      data: [draftRow("viz-school", { draftId: "viz-draft", academicYear: "ay2025" })],
      isPending: false,
    } as never);

    renderDrafts();
    await user.click(screen.getAllByRole("button", { name: /Continue/ })[0]);

    expect(navigateMock).toHaveBeenCalledWith(
      "/vizschool/enrol-student/new/student-info?academicYear=ay2025",
      expect.objectContaining({ state: { resumeDraftId: "viz-draft" } }),
    );
  });

  it("discarding a draft calls discardDraft and removes the row from the drafts query cache", async () => {
    const user = userEvent.setup();
    const rows = [draftRow("hfse-is", { draftId: "draft-1" }), draftRow("hfse-is", { draftId: "draft-2" })];
    vi.mocked(useDraftRows).mockReturnValue({ data: rows, isPending: false } as never);

    const { queryClient } = renderDrafts(rows);

    const discardButtons = screen.getAllByRole("button", { name: /Discard/ });
    await user.click(discardButtons[0]);
    await user.click(screen.getByRole("button", { name: /Yes, discard/ }));

    await waitFor(() => expect(discardDraft).toHaveBeenCalledWith("draft-1", "hfse-is"));

    const cached = queryClient.getQueryData<DraftRow[]>(DRAFT_ROWS_KEY);
    expect(cached?.map((r) => r.state.draftId)).toEqual(["draft-2"]);
  });

  it("discarding without a pre-existing drafts cache entry still resolves cleanly to an empty list", async () => {
    const user = userEvent.setup();
    vi.mocked(useDraftRows).mockReturnValue({
      data: [draftRow("hfse-is", { draftId: "draft-1" })],
      isPending: false,
    } as never);

    // No seedRows: the ["drafts", "remote-rows"] cache entry starts out empty.
    const { queryClient } = renderDrafts();

    await user.click(screen.getAllByRole("button", { name: /Discard/ })[0]);
    await user.click(screen.getByRole("button", { name: /Yes, discard/ }));

    await waitFor(() => expect(discardDraft).toHaveBeenCalledWith("draft-1", "hfse-is"));
    expect(queryClient.getQueryData<DraftRow[]>(DRAFT_ROWS_KEY)).toEqual([]);
  });
});
