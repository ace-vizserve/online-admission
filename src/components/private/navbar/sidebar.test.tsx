/**
 * Behavior tests for the AppSidebar's "Saved Drafts" badge, added alongside the
 * drafts-source-of-truth change: the badge count is now database-backed (useDraftRows), and
 * must not throw/show a stale count while that query is still loading (`data` is `undefined`).
 */
import { SidebarProvider } from "@/components/ui/sidebar";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-draft-rows", () => ({ useDraftRows: vi.fn() }));

// Mounting AppSidebar pulls in NavUser's dropdown menu and the Logo's framer-motion animation,
// which is measurably slower to first-render under a full parallel suite run than the default
// 5s hook timeout allows — bump it for this file rather than let it flake under load.
vi.setConfig({ testTimeout: 15000 });

const { useDraftRows } = await import("@/hooks/use-draft-rows");
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

beforeEach(() => {
  vi.mocked(useDraftRows).mockReset();
});

describe("AppSidebar — Saved Drafts badge", () => {
  it("shows no badge while the drafts query is still pending (data undefined)", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: undefined, isPending: true } as never);

    renderSidebar();

    const draftsLink = screen.getByRole("link", { name: /Saved Drafts/ });
    expect(draftsLink).toHaveAttribute("href", "/admission/drafts");
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows no badge when there are zero drafts", () => {
    vi.mocked(useDraftRows).mockReturnValue({ data: [], isPending: false } as never);

    renderSidebar();

    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it("shows the database-backed draft count as the badge once loaded", () => {
    vi.mocked(useDraftRows).mockReturnValue({
      data: [{ state: { draftId: "a" } }, { state: { draftId: "b" } }, { state: { draftId: "c" } }],
      isPending: false,
    } as never);

    renderSidebar();

    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
