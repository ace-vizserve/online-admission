/**
 * Behavior tests for the AppSidebar's count badges.
 *
 * "Saved Drafts" was added alongside the drafts-source-of-truth change: the badge count is
 * database-backed (useDraftRows) and must not throw/show a stale count while that query is
 * still loading (`data` is `undefined`).
 *
 * "Document Requirements" follows the same contract via usePendingTasks. Because two numeric
 * badges can now be on screen at once, each assertion is scoped to its own nav link rather than
 * matching a bare digit anywhere in the sidebar.
 */
import { SidebarProvider } from "@/components/ui/sidebar";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-draft-rows", () => ({ useDraftRows: vi.fn() }));
vi.mock("@/hooks/use-pending-tasks", () => ({ usePendingTasks: vi.fn() }));

// Mounting AppSidebar pulls in NavUser's dropdown menu and the Logo's framer-motion animation,
// which is measurably slower to first-render under a full parallel suite run than the default
// 5s hook timeout allows — bump it for this file rather than let it flake under load.
vi.setConfig({ testTimeout: 15000 });

const { useDraftRows } = await import("@/hooks/use-draft-rows");
const { usePendingTasks } = await import("@/hooks/use-pending-tasks");
const { AppSidebar } = await import("./sidebar");

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/admission/dashboard"]}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

/** Builds the usePendingTasks payload for N children with an outstanding document. */
function pendingTasksData(count: number) {
  const pendingTasks = Array.from({ length: count }, (_, i) => ({
    enroleeNumber: `E27000${i}`,
    studentDocs: [{ birthCert: "To follow" }],
  }));

  return {
    totalEnrollments: count,
    pendingTasks: { totalPendingTasks: count, pendingTasks },
    currentEnrolledStudents: [],
  };
}

/** The badge text inside a single nav item, or null when that item has no badge. */
function badgeOf(name: RegExp) {
  const link = screen.getByRole("link", { name });
  return within(link).queryByText(/^\d+$/);
}

beforeEach(() => {
  vi.mocked(useDraftRows).mockReset().mockReturnValue({ data: [], isPending: false } as never);
  vi.mocked(usePendingTasks).mockReset().mockReturnValue({ data: undefined, isPending: true } as never);
});

describe("AppSidebar — Saved Drafts badge", () => {
  it("shows no badge while the drafts query is still pending (data undefined)", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: undefined, isPending: true } as never);

    renderSidebar();

    const draftsLink = screen.getByRole("link", { name: /Saved Drafts/ });
    expect(draftsLink).toHaveAttribute("href", "/admission/drafts");
    expect(badgeOf(/Saved Drafts/)).not.toBeInTheDocument();
  });

  it("shows no badge when there are zero drafts", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: [], isPending: false } as never);

    renderSidebar();

    expect(badgeOf(/Saved Drafts/)).not.toBeInTheDocument();
  });

  it("shows the database-backed draft count as the badge once loaded", () => {
    vi.mocked(useDraftRows).mockReturnValue({
      data: [{ state: { draftId: "a" } }, { state: { draftId: "b" } }, { state: { draftId: "c" } }],
      isPending: false,
    } as never);

    renderSidebar();

    expect(badgeOf(/Saved Drafts/)).toHaveTextContent("3");
  });
});

describe("AppSidebar — Document Requirements badge", () => {
  it("links to the Document Requirements page", () => {
    renderSidebar();

    expect(screen.getByRole("link", { name: /Document Requirements/ })).toHaveAttribute(
      "href",
      "/admission/pending-tasks",
    );
  });

  it("shows no badge while the pending-tasks query is still loading", () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: undefined, isPending: true } as never);

    renderSidebar();

    expect(badgeOf(/Document Requirements/)).not.toBeInTheDocument();
  });

  it("shows no badge when every child is caught up", () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: pendingTasksData(0), isPending: false } as never);

    renderSidebar();

    expect(badgeOf(/Document Requirements/)).not.toBeInTheDocument();
  });

  it("shows the count of children with outstanding documents once loaded", () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: pendingTasksData(2), isPending: false } as never);

    renderSidebar();

    expect(badgeOf(/Document Requirements/)).toHaveTextContent("2");
  });

  it("shows no badge when the details action swallowed its error and resolved undefined", () => {
    vi.mocked(usePendingTasks).mockReturnValue({ data: undefined, isPending: false } as never);

    renderSidebar();

    expect(badgeOf(/Document Requirements/)).not.toBeInTheDocument();
  });

  it("keeps the two badges independent", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: [{ state: { draftId: "a" } }], isPending: false } as never);
    vi.mocked(usePendingTasks).mockReturnValue({ data: pendingTasksData(4), isPending: false } as never);

    renderSidebar();

    expect(badgeOf(/Saved Drafts/)).toHaveTextContent("1");
    expect(badgeOf(/Document Requirements/)).toHaveTextContent("4");
  });
});
