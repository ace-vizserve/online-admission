import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { useSubmissionState } from "./use-submission-state";

/**
 * Renders the hook at a route carrying `state`, mimicking how the submit flows navigate to a
 * confirmation page (and how the History API replays that state on back/forward).
 */
function renderAtState(state: unknown) {
  return renderHook(() => useSubmissionState(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[{ pathname: "/application-submitted", state }]}>{children}</MemoryRouter>
    ),
  });
}

describe("useSubmissionState", () => {
  it("returns the submission when the router state carries a full one", () => {
    const { result } = renderAtState({ academicYear: "ay2026", enroleeNumber: "E260001" });

    expect(result.current).toEqual({ academicYear: "ay2026", enroleeNumber: "E260001" });
  });

  // A bookmark, a hand-typed URL, or any navigation that didn't come from a resolved submit.
  it("returns null when there is no router state at all", () => {
    const { result } = renderAtState(undefined);

    expect(result.current).toBeNull();
  });

  // The old code destructured this directly and threw, which the route's error boundary turned
  // into a full-page error instead of a redirect.
  it("returns null for an explicitly null state without throwing", () => {
    const { result } = renderAtState(null);

    expect(result.current).toBeNull();
  });

  it("returns null when the enrolee number is missing", () => {
    const { result } = renderAtState({ academicYear: "ay2026" });

    expect(result.current).toBeNull();
  });

  it("returns null when the academic year is missing", () => {
    const { result } = renderAtState({ enroleeNumber: "E260001" });

    expect(result.current).toBeNull();
  });

  it("treats empty strings as absent rather than as proof of a submission", () => {
    const { result } = renderAtState({ academicYear: "", enroleeNumber: "" });

    expect(result.current).toBeNull();
  });
});
