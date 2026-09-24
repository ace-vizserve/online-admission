import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchParentAcademicYears, SisError } from "@/lib/sis";
import { useSelectAcademicYear } from "@/zustand-store";

import OpenHouseLanding from "./open-house-landing";

vi.mock("@/lib/sis", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sis")>()),
  fetchParentAcademicYears: vi.fn(),
}));
// SEO writes <head> tags through react-helmet; not what this test is about.
vi.mock("@/pages/seo", () => ({ default: () => null, BASE_URL: "https://example.test" }));

function renderLanding() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OpenHouseLanding />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The AY buttons' text, e.g. "Current YearAY 2026". */
function yearButtons() {
  return screen.getAllByRole("button").filter((button) => /AY \d{4}/.test(button.textContent ?? ""));
}

beforeEach(() => {
  vi.mocked(fetchParentAcademicYears).mockReset();
  useSelectAcademicYear.setState({ academicYear: "" });
});

describe("OpenHouseLanding — academic year buttons", () => {
  it("shows PARENT_FACING_ACADEMIC_YEARS while the SIS has not answered", () => {
    vi.mocked(fetchParentAcademicYears).mockReturnValue(new Promise(() => {}));

    renderLanding();

    expect(yearButtons().map((button) => button.textContent)).toEqual(["Current YearAY 2026", "Upcoming YearAY 2027"]);
  });

  it("keeps PARENT_FACING_ACADEMIC_YEARS when the SIS fails", async () => {
    vi.mocked(fetchParentAcademicYears).mockRejectedValue(new SisError("unreachable", 0));

    renderLanding();

    await waitFor(() => expect(fetchParentAcademicYears).toHaveBeenCalled());
    expect(yearButtons().map((button) => button.textContent)).toEqual(["Current YearAY 2026", "Upcoming YearAY 2027"]);
  });

  it("lists the SIS's HFSE-open years only, and stores the chosen one", async () => {
    vi.mocked(fetchParentAcademicYears).mockResolvedValue({
      years: [
        { ayCode: "AY2026", isCurrent: true, hfseOpen: false, vizschoolOpen: true },
        { ayCode: "AY2027", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
        { ayCode: "AY2028", isCurrent: false, hfseOpen: true, vizschoolOpen: false },
      ],
    });

    renderLanding();

    await waitFor(() =>
      expect(yearButtons().map((button) => button.textContent)).toEqual([
        "Upcoming YearAY 2027",
        "Upcoming YearAY 2028",
      ]),
    );

    fireEvent.click(screen.getByRole("button", { name: /AY 2028/ }));
    expect(useSelectAcademicYear.getState().academicYear).toBe("ay2028");
  });
});
