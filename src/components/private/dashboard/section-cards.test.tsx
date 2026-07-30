/**
 * Targeted tests for the drafts-source-of-truth change in SectionCards/DashboardCards: the
 * "Saved Drafts" count widget now derives its count from useDraftRows (database-backed)
 * instead of the old localStorage-only getDraftRows().length. This intentionally does not aim
 * for 100% coverage of the whole file — most of it (pending-tasks rendering, StatCard variants)
 * is pre-existing legacy UI unrelated to this change; see feedback-100-coverage-phased-changes
 * memory ("gate coverage on the files each phase changes — not retroactively on untouched
 * legacy files").
 */
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-draft-rows", () => ({ useDraftRows: vi.fn() }));
vi.mock("@/actions/private", () => ({ getSectionCardsDetails: vi.fn() }));

const mockSession = {
  user: {
    email: "parent@example.com",
    user_metadata: { fullName: "Doe, John", relationship: "father" },
  },
} as unknown as Session;

vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

const { useDraftRows } = await import("@/hooks/use-draft-rows");
const { getSectionCardsDetails } = await import("@/actions/private");
const { SectionCards } = await import("./section-cards");

function renderSectionCards() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SectionCards />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useDraftRows).mockReset();
  vi.mocked(getSectionCardsDetails).mockReset().mockResolvedValue({
    totalEnrollments: 5,
    pendingTasks: { pendingTasks: [] },
    currentEnrolledStudents: [{ id: 1 }],
  } as never);
});

describe("SectionCards — Saved Drafts count widget", () => {
  it("does not render the Saved Drafts widget when the database has zero drafts", async () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: [], isPending: false } as never);

    renderSectionCards();

    expect(await screen.findByText("Enrolled Students")).toBeInTheDocument();
    expect(screen.queryByText("Saved Drafts")).not.toBeInTheDocument();
  });

  it("renders the widget with the database-backed count, not a localStorage-derived one", async () => {
    vi.mocked(useDraftRows).mockReturnValue({
      data: [{ state: { draftId: "a" } }, { state: { draftId: "b" } }],
      isPending: false,
    } as never);

    renderSectionCards();

    expect(await screen.findByText("Saved Drafts")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Applications")).toBeInTheDocument();
  });

  it("treats a still-pending drafts query as zero drafts rather than crashing", async () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: undefined, isPending: true } as never);

    renderSectionCards();

    expect(await screen.findByText("Enrolled Students")).toBeInTheDocument();
    expect(screen.queryByText("Saved Drafts")).not.toBeInTheDocument();
  });
});

describe("SectionCards — Document Requirements student identity", () => {
  const PENDING_TASK = {
    enroleeNumber: "E270001",
    studentName: "Dela Cruz, Juan",
    levelApplied: "Primary Two",
    studentDocs: [{ birthCert: "To follow" }],
  };

  function mockPendingTasks(pendingTasks: Record<string, unknown>[]) {
    vi.mocked(getSectionCardsDetails).mockReset().mockResolvedValue({
      totalEnrollments: 5,
      pendingTasks: { pendingTasks },
      currentEnrolledStudents: [{ id: 1 }],
    } as never);
  }

  beforeEach(() => {
    vi.mocked(useDraftRows).mockReturnValue({ data: [], isPending: false } as never);
  });

  it("leads each requirement with the student's name and level, keeping the enrolee number as a reference", async () => {
    mockPendingTasks([PENDING_TASK]);

    renderSectionCards();

    expect(await screen.findByText("Dela Cruz, Juan")).toBeInTheDocument();
    expect(screen.getByText(/Primary Two/)).toBeInTheDocument();
    expect(screen.getByText("Enrollee #E270001")).toHaveAttribute(
      "href",
      "/admission/enrolments/application/E270001?academicYear=ay2027",
    );
  });

  it("falls back to the enrolee number as the heading when the student name is missing", async () => {
    mockPendingTasks([{ ...PENDING_TASK, studentName: "", levelApplied: "" }]);

    renderSectionCards();

    expect(await screen.findByText("Enrollee #E270001", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText(/Primary Two/)).not.toBeInTheDocument();
  });
});
