import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import RegistrationSubmitted from "./registration-submitted";

vi.mock("@/components/ui/confetti", () => ({ Confetti: () => null }));
vi.mock("@/components/page-metadata", () => ({ default: () => null }));
vi.mock("@/components/private/parent-survey-feedback", () => ({ default: () => <div data-testid="survey" /> }));

function renderAtState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/open-house-registration-submitted", state }]}>
      <Routes>
        <Route path="/open-house-registration-submitted" element={<RegistrationSubmitted />} />
        <Route path="/login" element={<div>login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RegistrationSubmitted", () => {
  it("confirms the registration when the submission that produced it is present", () => {
    renderAtState({ academicYear: "ay2026", enroleeNumber: "E260001" });

    expect(screen.getByText(/application received/i)).toBeInTheDocument();
  });

  // This page sits behind UnauthenticatedGuard, so an unproven visit belongs at login rather
  // than at the dashboard.
  it("redirects to login when reached without a submission", () => {
    renderAtState(null);

    expect(screen.getByText("login")).toBeInTheDocument();
    expect(screen.queryByText(/application received/i)).not.toBeInTheDocument();
  });
});
