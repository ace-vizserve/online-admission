import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import ApplicationSubmitted from "./application-submitted";

// The confirmation page's own logic is the guard; its decorative children pull in canvas and
// animation work that jsdom has no use for, and the survey drags in react-query + supabase.
vi.mock("@/components/ui/confetti", () => ({ Confetti: () => null }));
vi.mock("@/components/page-metadata", () => ({ default: () => null }));
vi.mock("@/components/private/parent-survey-feedback", () => ({
  default: ({ academicYear, enroleeNumber }: { academicYear?: string; enroleeNumber?: string }) => (
    <div data-testid="survey" data-academic-year={academicYear} data-enrolee-number={enroleeNumber} />
  ),
}));

function renderAtState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/application-submitted", state }]}>
      <Routes>
        <Route path="/application-submitted" element={<ApplicationSubmitted />} />
        <Route path="/admission/dashboard" element={<div>dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ApplicationSubmitted", () => {
  it("confirms the application when the submission that produced it is present", () => {
    renderAtState({ academicYear: "ay2026", enroleeNumber: "E260001" });

    expect(screen.getByText(/application received/i)).toBeInTheDocument();
  });

  it("hands the submission down to the feedback survey instead of making it re-read the router", () => {
    renderAtState({ academicYear: "ay2026", enroleeNumber: "E260001" });

    const survey = screen.getByTestId("survey");
    expect(survey).toHaveAttribute("data-academic-year", "ay2026");
    expect(survey).toHaveAttribute("data-enrolee-number", "E260001");
  });

  // The defect this guard exists for: a parent enrolling a second child can navigate back into
  // the first child's confirmation, and a bookmarked URL carries no state at all. Neither has a
  // submission behind it, so neither may be told an application was received.
  it("redirects to the dashboard when reached without a submission", () => {
    renderAtState(null);

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByText(/application received/i)).not.toBeInTheDocument();
  });

  it("redirects when the state is present but carries no enrolee number", () => {
    renderAtState({ academicYear: "ay2026" });

    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.queryByText(/application received/i)).not.toBeInTheDocument();
  });
});
