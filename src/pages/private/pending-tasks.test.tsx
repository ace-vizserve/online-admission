/**
 * Coverage for the Pending Tasks academic-year filter: a parent with pending document
 * requirements spanning more than one academic year can narrow the list down to just the
 * enrolment they're working on. See
 * docs/superpowers/specs/2026-07-22-pending-tasks-academic-year-filter-design.md.
 */
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/private", () => ({ getSectionCardsDetails: vi.fn() }));

const mockSession = { user: { email: "parent@example.com" } } as unknown as Session;

vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

const { getSectionCardsDetails } = await import("@/actions/private");
const { default: PendingTasks } = await import("./pending-tasks");

// "E27####" / "E26####" — the "E" + 2-digit-year-suffix format tryAcademicYearFromEnroleeNumber
// parses (src/config/academic-years.ts), matching BACKEND_ACADEMIC_YEARS's "ay2027"/"ay2026".
const TASK_AY2027 = { enroleeNumber: "E270001", studentDocs: [{ birthCert: "To follow" }] };
const TASK_AY2026 = { enroleeNumber: "E260002", parentGuardianDocs: [{ motherPassport: "Expired" }] };

function mockPendingTasks(pendingTasks: Record<string, unknown>[]) {
  vi.mocked(getSectionCardsDetails).mockResolvedValue({
    totalEnrollments: pendingTasks.length,
    pendingTasks: { totalPendingTasks: pendingTasks.length, pendingTasks },
    currentEnrolledStudents: [],
  } as never);
}

function renderPendingTasks() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PendingTasks />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(getSectionCardsDetails).mockReset();
});

describe("PendingTasks — academic year filter", () => {
  it("does not render the filter when there are zero pending tasks", async () => {
    mockPendingTasks([]);

    renderPendingTasks();

    expect(await screen.findByText("All caught up!")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("does not render the filter when tasks span a single academic year", async () => {
    mockPendingTasks([TASK_AY2027, { ...TASK_AY2027, enroleeNumber: "E270099" }]);

    renderPendingTasks();

    expect(await screen.findByText("#E270001")).toBeInTheDocument();
    expect(screen.getByText("#E270099")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders the filter, defaulting to All Years, when tasks span 2+ academic years", async () => {
    mockPendingTasks([TASK_AY2027, TASK_AY2026]);

    renderPendingTasks();

    expect(await screen.findByText("#E270001")).toBeInTheDocument();
    expect(screen.getByText("#E260002")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("All Years");
  });

  it("narrows the list to the selected academic year", async () => {
    mockPendingTasks([TASK_AY2027, TASK_AY2026]);
    const user = userEvent.setup();

    renderPendingTasks();
    await screen.findByText("#E270001");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "AY 2027" }));

    expect(screen.getByText("#E270001")).toBeInTheDocument();
    expect(screen.queryByText("#E260002")).not.toBeInTheDocument();
  });

  it("restores the full list when All Years is selected again", async () => {
    mockPendingTasks([TASK_AY2027, TASK_AY2026]);
    const user = userEvent.setup();

    renderPendingTasks();
    await screen.findByText("#E270001");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "AY 2027" }));
    expect(screen.queryByText("#E260002")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "All Years" }));

    expect(screen.getByText("#E270001")).toBeInTheDocument();
    expect(screen.getByText("#E260002")).toBeInTheDocument();
  });

  it("lists filter options newest-year-first", async () => {
    // AY2026 pushed first, AY2027 second — the rendered option order must still be AY2027 then
    // AY2026 (BACKEND_ACADEMIC_YEARS order), not insertion order.
    mockPendingTasks([TASK_AY2026, TASK_AY2027]);
    const user = userEvent.setup();

    renderPendingTasks();
    await screen.findByText("#E270001");

    await user.click(screen.getByRole("combobox"));
    const options = await screen.findAllByRole("option");

    expect(options.map((o) => o.textContent?.trim())).toEqual(["All Years", "AY 2027", "AY 2026"]);
  });
});
