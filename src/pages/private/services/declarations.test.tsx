/**
 * Behaviour tests for the declaration status list.
 *
 * This half of the feature is not optional: a parent who files something must be able to see
 * what happened to it, and until outcome notifications exist this page is the only way they
 * find out.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Declaration } from "@/types/declarations";

const { useDeclarations } = vi.hoisted(() => ({ useDeclarations: vi.fn() }));
vi.mock("@/hooks/use-declarations", () => ({ useDeclarations }));

const { SisError } = await import("@/lib/sis");
const { default: Declarations } = await import("./declarations");

function declaration(overrides: Partial<Declaration> = {}): Declaration {
  return {
    id: "3a1f",
    filingGroupId: "9e7c",
    declarationType: "absence",
    studentNumber: "H250123",
    studentName: "Ana Reyes",
    startDate: "2026-09-16",
    endDate: "2026-09-18",
    withMedical: true,
    evidenceUrl: null,
    hasUpload: true,
    destinationCountry: null,
    destinationCity: null,
    parentNote: "Fever since Monday.",
    status: "pending",
    statusLabel: "With the school",
    filedAt: "2026-08-27T02:14:09.221Z",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admission/services/declarations"]}>
      <Routes>
        <Route path="/admission/services/declarations" element={<Declarations />} />
        <Route path="/login" element={<p>Sign in</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useDeclarations.mockReset().mockReturnValue({ data: [], isPending: false, error: null });
});

describe("Declarations — states", () => {
  it("shows placeholders while loading, so the page does not read as empty", () => {
    useDeclarations.mockReturnValue({ data: undefined, isPending: true, error: null });

    const { container } = renderPage();

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.queryByText(/no declarations/i)).not.toBeInTheDocument();
  });

  it("says nothing has been filed yet rather than showing a blank page", () => {
    renderPage();

    expect(screen.getByText(/no declarations/i)).toBeInTheDocument();
  });

  it("shows the SIS's own error sentence, which is written for a parent", () => {
    useDeclarations.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new SisError("One of the children selected is not on your account.", 403),
    });

    renderPage();

    expect(screen.getByText("One of the children selected is not on your account.")).toBeInTheDocument();
  });

  it("sends an expired session to sign in instead of printing the raw token error", () => {
    useDeclarations.mockReturnValue({
      data: undefined,
      isPending: false,
      error: new SisError("invalid or expired token", 401),
    });

    renderPage();

    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(screen.queryByText("invalid or expired token")).not.toBeInTheDocument();
  });
});

describe("Declarations — rows", () => {
  it("shows the child, the dates and the status of a filing", () => {
    useDeclarations.mockReturnValue({ data: [declaration()], isPending: false, error: null });

    renderPage();

    expect(screen.getByText("Ana Reyes")).toBeInTheDocument();
    expect(screen.getByText("16 – 18 Sep 2026")).toBeInTheDocument();
    expect(screen.getByText("With the school")).toBeInTheDocument();
  });

  it("uses the SIS's parent-facing label, never the raw status", () => {
    useDeclarations.mockReturnValue({
      data: [declaration({ status: "pending", statusLabel: "With the school" })],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.queryByText("pending")).not.toBeInTheDocument();
  });

  it("names the destination on a travel declaration", () => {
    useDeclarations.mockReturnValue({
      data: [
        declaration({
          declarationType: "travel",
          withMedical: false,
          hasUpload: false,
          destinationCountry: "Malaysia",
          destinationCity: "Penang",
        }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText(/Penang, Malaysia/)).toBeInTheDocument();
  });

  it("shows filings made by the other parent too, since the list is scoped by child", () => {
    useDeclarations.mockReturnValue({
      data: [
        declaration({ id: "a", studentName: "Ana Reyes" }),
        declaration({ id: "b", studentNumber: "H250124", studentName: "Leo Reyes" }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText("Ana Reyes")).toBeInTheDocument();
    expect(screen.getByText("Leo Reyes")).toBeInTheDocument();
  });
});

/**
 * Until the SIS notifies parents of an outcome, this page is where they come back to. It is also
 * the only way into the form, so the way in must be present whether or not anything is filed yet.
 */
describe("Declarations — filing a new one", () => {
  it("offers a way to file when the list is empty", () => {
    useDeclarations.mockReturnValue({ data: [], isPending: false, error: null });

    renderPage();

    // Two on purpose when empty: the header action, and the call to action in the empty state.
    const links = screen.getAllByRole("link", { name: /file a declaration/i });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/admission/services/declarations/new"));
  });

  it("still offers it when there are already filings", () => {
    useDeclarations.mockReturnValue({ data: [declaration()], isPending: false, error: null });

    renderPage();

    expect(screen.getByRole("link", { name: /file a declaration/i })).toBeInTheDocument();
  });
});
