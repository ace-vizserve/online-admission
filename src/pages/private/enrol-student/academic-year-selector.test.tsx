import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchParentAcademicYears, SisError } from "@/lib/sis";

import AcademicYearSelector from "./academic-year-selector";

vi.mock("@/lib/sis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sis")>()),
  fetchParentAcademicYears: vi.fn(),
}));

function renderSelector() {
  const setSelectedAy = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <AcademicYearSelector setSelectedAy={setSelectedAy} />
    </QueryClientProvider>,
  );
  return { ...view, setSelectedAy };
}

/** The card headings, in DOM order. */
function cardTitles() {
  return screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
}

/** The grid holding the cards (the headings' common ancestor). */
function cardGrid() {
  return screen.getAllByRole("heading", { level: 3 })[0].closest("div.grid") as HTMLElement;
}

const TODAYS_TITLES = ["Academic Year 2026", "Vizschool AY2026", "Academic Year 2027"];

beforeEach(() => {
  vi.mocked(fetchParentAcademicYears).mockReset();
});

describe("AcademicYearSelector", () => {
  it("renders today's three cards while the SIS has not answered — no empty flash", () => {
    vi.mocked(fetchParentAcademicYears).mockReturnValue(new Promise(() => {}));

    renderSelector();

    expect(cardTitles()).toEqual(TODAYS_TITLES);
    expect(screen.getByText("Early registration for AY 2027 starts July 2026.")).toBeInTheDocument();
    expect(cardGrid()).toHaveClass("lg:grid-cols-3");
  });

  it("keeps today's three cards when the SIS fails", async () => {
    vi.mocked(fetchParentAcademicYears).mockRejectedValue(new SisError("unreachable", 0));

    renderSelector();

    await waitFor(() => expect(fetchParentAcademicYears).toHaveBeenCalled());
    expect(cardTitles()).toEqual(TODAYS_TITLES);
  });

  it("builds the cards from the SIS's open years and stores the chosen card's portal key", async () => {
    vi.mocked(fetchParentAcademicYears).mockResolvedValue({
      years: [
        { ayCode: "AY2027", isCurrent: true, hfseOpen: true, vizschoolOpen: true },
        { ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: true },
      ],
    });

    const { setSelectedAy } = renderSelector();

    await waitFor(() => expect(screen.getByText("Academic Year 2028")).toBeInTheDocument());
    expect(cardTitles()).toEqual(["Academic Year 2027", "Vizschool AY2027", "Academic Year 2028", "Vizschool AY2028"]);
    expect(cardGrid()).toHaveClass("lg:grid-cols-2", "xl:grid-cols-4");

    const ay2028Card = screen.getByText("Academic Year 2028").closest("div.relative") as HTMLElement;
    fireEvent.click(within(ay2028Card).getByRole("button", { name: /Enrol for AY 2028/i }));
    expect(setSelectedAy).toHaveBeenCalledWith("ay2028");

    fireEvent.click(screen.getByRole("button", { name: /Enrol in Vizschool AY 2028/i }));
    expect(setSelectedAy).toHaveBeenLastCalledWith("vizschool-ay2028");
  });

  it("narrows the grid for a single open card", async () => {
    vi.mocked(fetchParentAcademicYears).mockResolvedValue({
      years: [{ ayCode: "AY2027", isCurrent: false, hfseOpen: true, vizschoolOpen: false }],
    });

    renderSelector();

    await waitFor(() => expect(cardTitles()).toEqual(["Academic Year 2027"]));
    expect(cardGrid()).toHaveClass("lg:grid-cols-1", "max-w-md");
  });
});
