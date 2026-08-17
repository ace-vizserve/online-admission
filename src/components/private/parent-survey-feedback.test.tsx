import { submitParentFeedback } from "@/actions/private";
import { howDidYouKnowAboutUs } from "@/data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ParentFeedbackSurvey from "./parent-survey-feedback";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({ submitParentFeedback: vi.fn().mockResolvedValue(undefined) }));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderSurvey() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[{ pathname: "/application-submitted", state: { academicYear: "2024-2025", enroleeNumber: "E-1" } }]}>
        <Routes>
          <Route path="/application-submitted" element={<ParentFeedbackSurvey />} />
          <Route path="*" element={<div>elsewhere</div>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const openSurvey = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /go to dashboard/i }));
  await waitFor(() => expect(screen.getByText(/quick question first/i)).toBeInTheDocument());
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ParentFeedbackSurvey — the marketing source is not skippable", () => {
  it("offers no way to skip the question on step 1", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    expect(screen.queryByRole("button", { name: /skip for now/i })).not.toBeInTheDocument();
    // No close (X) affordance either.
    expect(screen.queryByRole("button", { name: /^close$/i })).not.toBeInTheDocument();
  });

  it("keeps Next disabled until a source is picked", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Facebook" }));

    await waitFor(() => expect(next).toBeEnabled());
  });

  it("re-disables Next when the parent unpicks their answer", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    await user.click(screen.getByRole("button", { name: "Facebook" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /next/i })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: "Facebook" }));

    await waitFor(() => expect(screen.getByRole("button", { name: /next/i })).toBeDisabled());
  });

  it("does not close on Escape", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    await user.keyboard("{Escape}");

    // Still on step 1 — the dialog did not dismiss.
    expect(screen.getByText(/quick question first/i)).toBeInTheDocument();
  });

  it("requires the referrer name before advancing past 'Referral'", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    await user.click(screen.getByRole("button", { name: "Referral" }));

    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/enter the referrer's name/i), "Jane Tan");

    await waitFor(() => expect(next).toBeEnabled());
  });

  it("requires the free text before advancing past 'Other'", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    await user.click(screen.getByRole("button", { name: /other \(please specify\)/i }));

    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/^please specify$/i), "Church bulletin");

    await waitFor(() => expect(next).toBeEnabled());
  });

  it("renders every source option from the shared list", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    for (const source of howDidYouKnowAboutUs) {
      expect(screen.getByRole("button", { name: source.label })).toBeInTheDocument();
    }
  });
});

describe("ParentFeedbackSurvey — submission", () => {
  async function reachStepTwo(user: ReturnType<typeof userEvent.setup>, option = "Facebook") {
    await openSurvey(user);
    await user.click(screen.getByRole("button", { name: option }));
    await waitFor(() => expect(screen.getByRole("button", { name: /next/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByText(/we'd love your feedback/i)).toBeInTheDocument());
  }

  it("persists the source even when the parent skips the rating", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await reachStepTwo(user);

    // The rating gates the primary button, so "Skip feedback" is the escape — it must still write.
    expect(screen.getByRole("button", { name: /submit & continue/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /skip feedback/i }));

    await waitFor(() => expect(submitParentFeedback).toHaveBeenCalled());
    expect(vi.mocked(submitParentFeedback).mock.calls[0][0]).toMatchObject({
      howDidYouKnowAboutHFSEIS: "Facebook",
      enroleeNumber: "E-1",
      academicYear: "2024-2025",
      feedbackRating: 0,
    });
  });

  it("collapses 'Other' into the free-text answer on submit", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    await user.click(screen.getByRole("button", { name: /other \(please specify\)/i }));
    await user.type(screen.getByPlaceholderText(/^please specify$/i), "  Church bulletin  ");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByText(/we'd love your feedback/i)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /skip feedback/i }));

    await waitFor(() => expect(submitParentFeedback).toHaveBeenCalled());
    expect(vi.mocked(submitParentFeedback).mock.calls[0][0]).toMatchObject({
      howDidYouKnowAboutHFSEIS: "Church bulletin",
    });
  });

  it("sends the referrer name for a 'Referral' source", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await openSurvey(user);

    await user.click(screen.getByRole("button", { name: "Referral" }));
    await user.type(screen.getByPlaceholderText(/enter the referrer's name/i), "Jane Tan");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByText(/we'd love your feedback/i)).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /skip feedback/i }));

    await waitFor(() => expect(submitParentFeedback).toHaveBeenCalled());
    expect(vi.mocked(submitParentFeedback).mock.calls[0][0]).toMatchObject({
      howDidYouKnowAboutHFSEIS: "Referral",
      marketingReferrerName: "Jane Tan",
    });
  });

  it("navigates to the dashboard once the write succeeds", async () => {
    const user = userEvent.setup();
    renderSurvey();
    await reachStepTwo(user);

    await user.click(screen.getByRole("button", { name: /skip feedback/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/admission/dashboard");
    });
  });

  it("stays put when the write fails, so the answer isn't silently lost", async () => {
    vi.mocked(submitParentFeedback).mockRejectedValueOnce(new Error("network blip"));
    const user = userEvent.setup();
    renderSurvey();
    await reachStepTwo(user);

    await user.click(screen.getByRole("button", { name: /skip feedback/i }));

    await waitFor(() => expect(submitParentFeedback).toHaveBeenCalled());
    expect(screen.getByTestId("location").textContent).toBe("/application-submitted");
  });
});
