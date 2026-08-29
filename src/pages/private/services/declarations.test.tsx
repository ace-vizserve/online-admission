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
    decisionReason: null,
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

/**
 * Declarations are records, not a feed: a parent scans them looking up whether a particular
 * child's days were already told to the school. That is a table's job — one row each, aligned
 * columns, sortable — rather than a stack of cards.
 */
describe("Declarations — the table", () => {
  it("lays the filings out as rows under column headers", () => {
    useDeclarations.mockReturnValue({ data: [declaration()], isPending: false, error: null });

    renderPage();

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /child/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /when/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /status/i })).toBeInTheDocument();
    // One header row plus one filing.
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("gives each filing its own row", () => {
    useDeclarations.mockReturnValue({
      data: [declaration({ id: "a" }), declaration({ id: "b", studentName: "Leo Reyes" })],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("narrows to one status, so a parent can see just what is still with the school", async () => {
    const user = (await import("@testing-library/user-event")).default;
    useDeclarations.mockReturnValue({
      data: [
        declaration({ id: "a", studentName: "Ana Reyes", status: "pending", statusLabel: "With the school" }),
        declaration({ id: "b", studentName: "Leo Reyes", status: "approved", statusLabel: "Approved" }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();
    await user.click(screen.getByRole("combobox", { name: /status/i }));
    await user.click(await screen.findByRole("option", { name: /^Approved$/ }));

    expect(screen.getByText("Leo Reyes")).toBeInTheDocument();
    expect(screen.queryByText("Ana Reyes")).not.toBeInTheDocument();
  });

  it("says so when a filter hides everything, rather than showing a bare table", async () => {
    const user = (await import("@testing-library/user-event")).default;
    useDeclarations.mockReturnValue({
      data: [declaration({ status: "approved", statusLabel: "Approved" })],
      isPending: false,
      error: null,
    });

    renderPage();
    await user.click(screen.getByRole("combobox", { name: /status/i }));
    await user.click(await screen.findByRole("option", { name: /not approved/i }));

    expect(await screen.findByText(/no declarations match/i)).toBeInTheDocument();
  });
});

/**
 * `decisionReason` is the only staff-written text a parent ever sees, and the thing that makes
 * "Not approved" mean anything. The commonest real reason is a request to attach the medical
 * certificate and file again — before this field existed there was nowhere for that to go.
 */
describe("Declarations — the school's reason", () => {
  const REASON = "Please attach the medical certificate and file again.";

  it("shows the school's reason on a filing that was turned down", () => {
    useDeclarations.mockReturnValue({
      data: [declaration({ status: "rejected", statusLabel: "Not approved", decisionReason: REASON })],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText(REASON)).toBeInTheDocument();
  });

  it("attributes it to the school, so it cannot be read as the parent's own note", () => {
    useDeclarations.mockReturnValue({
      data: [
        declaration({
          status: "rejected",
          statusLabel: "Not approved",
          decisionReason: REASON,
          parentNote: "Fever since Monday.",
        }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText(/from the school/i)).toBeInTheDocument();
  });

  it("renders nothing at all when there is no reason", () => {
    useDeclarations.mockReturnValue({
      data: [declaration({ status: "approved", statusLabel: "Approved", decisionReason: null })],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.queryByText(/from the school/i)).not.toBeInTheDocument();
  });
});

describe("Declarations — travel and the certificate question", () => {
  it("says nothing about certificates on a travel filing, where the question was never asked", () => {
    // withMedical is null on travel. A bare falsy check would read that as "no certificate"
    // and print it on every trip.
    useDeclarations.mockReturnValue({
      data: [
        declaration({
          declarationType: "travel",
          withMedical: null,
          hasUpload: false,
          evidenceUrl: null,
          destinationCountry: "Malaysia",
          destinationCity: "Penang",
        }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText(/Penang, Malaysia/)).toBeInTheDocument();
    expect(screen.queryByText(/certificate/i)).not.toBeInTheDocument();
  });
});

/**
 * A family accumulates filings over years, so the table has to stay usable when the list is
 * long: narrow by child, reorder, and page through.
 */
describe("Declarations — finding one filing among many", () => {
  const user = () => import("@testing-library/user-event").then((m) => m.default);

  /** The child name in each body row, in the order the table renders them. */
  function renderedChildren() {
    return screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent ?? "");
  }

  it("narrows to one child as the parent types their name", async () => {
    useDeclarations.mockReturnValue({
      data: [
        declaration({ id: "a", studentName: "Ana Reyes" }),
        declaration({ id: "b", studentName: "Leo Reyes", studentNumber: "H250124" }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();
    await (await user()).type(screen.getByPlaceholderText(/filter by child/i), "Leo", { delay: null });

    expect(screen.getByText("Leo Reyes")).toBeInTheDocument();
    expect(screen.queryByText("Ana Reyes")).not.toBeInTheDocument();
  });

  it("reorders by child when that column is sorted", async () => {
    useDeclarations.mockReturnValue({
      data: [
        declaration({ id: "a", studentName: "Zara Tan" }),
        declaration({ id: "b", studentName: "Ana Reyes", studentNumber: "H250124" }),
      ],
      isPending: false,
      error: null,
    });

    renderPage();
    expect(renderedChildren()[0]).toContain("Zara Tan");

    await (await user()).click(screen.getByRole("button", { name: /child/i }));

    expect(renderedChildren()[0]).toContain("Ana Reyes");
  });

  it("pages through a long history rather than rendering all of it at once", async () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      declaration({ id: `d${i}`, studentName: `Child ${String(i).padStart(2, "0")}`, studentNumber: `H2600${i}` }),
    );
    useDeclarations.mockReturnValue({ data: many, isPending: false, error: null });

    renderPage();
    expect(renderedChildren()).toHaveLength(10);
    expect(screen.getByText(/showing 10 of 12/i)).toBeInTheDocument();

    await (await user()).click(screen.getByRole("button", { name: /next/i }));

    expect(renderedChildren()).toHaveLength(2);

    await (await user()).click(screen.getByRole("button", { name: /previous/i }));

    expect(renderedChildren()).toHaveLength(10);
  });
});

describe("Declarations — every column sorts", () => {
  /** Two filings where the second is earlier, settled, and filed sooner than the first. */
  const LATER = declaration({
    id: "later",
    studentName: "Ana Reyes",
    startDate: "2026-09-20",
    endDate: "2026-09-20",
    status: "pending",
    statusLabel: "With the school",
    filedAt: "2026-09-19T09:00:00.000Z",
  });
  const EARLIER = declaration({
    id: "earlier",
    studentName: "Zara Tan",
    studentNumber: "H250124",
    startDate: "2026-09-01",
    endDate: "2026-09-01",
    status: "approved",
    statusLabel: "Approved",
    filedAt: "2026-08-30T09:00:00.000Z",
  });

  function firstChild() {
    return screen.getAllByRole("row")[1].querySelector("td")?.textContent ?? "";
  }

  it.each([["when"], ["status"], ["filed"]])("sorts by %s", async (column) => {
    const user = (await import("@testing-library/user-event")).default;
    useDeclarations.mockReturnValue({ data: [LATER, EARLIER], isPending: false, error: null });

    renderPage();
    expect(firstChild()).toContain("Ana Reyes");

    await user.click(screen.getByRole("button", { name: new RegExp(column, "i") }));

    // Ascending on any of the three puts the earlier / already-settled filing on top.
    expect(firstChild()).toContain("Zara Tan");
  });
});

describe("Declarations — how a certificate is shown", () => {
  it("marks a pasted digital MC link as attached, with no file uploaded", () => {
    useDeclarations.mockReturnValue({
      data: [declaration({ withMedical: true, hasUpload: false, evidenceUrl: "https://mc.gov.sg/xxxx" })],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText(/medical certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/attached/i)).toBeInTheDocument();
  });

  it("says nothing about certificates on an absence declared without one", () => {
    useDeclarations.mockReturnValue({
      data: [declaration({ withMedical: false, hasUpload: false, evidenceUrl: null })],
      isPending: false,
      error: null,
    });

    renderPage();

    expect(screen.queryByText(/certificate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/attached/i)).not.toBeInTheDocument();
  });
});
