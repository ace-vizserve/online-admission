/**
 * Behavior tests for STPGuidelines, added alongside the design-system alignment pass (see
 * project design system memory). Unlike the presentational admission-guidelines page, this one
 * has real logic worth locking down: the `canContinue` gate, the `redirect()` branch on
 * `enroleeType`/`isOpenHouseRegistration`, and the open-house auto-acknowledgement effect.
 *
 * `useNavigate` is mocked (partial mock — everything else from `react-router-dom` is real) so
 * navigation targets can be asserted without a full route tree. `useLocation().state` is set via
 * `MemoryRouter`'s object-form `initialEntries`.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnrolmentStores } from "@/test/render-form";
import {
  useEnrolNewStudentStore,
  useEnrolOldStudentStore,
  usePreCourseAcknowledgementStore,
  useSelectAcademicYear,
} from "@/zustand-store";

import STPGuidelines from "./stp-guidelines";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage(state: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/enrol-student/stp-guidelines", state }]}>
      <STPGuidelines />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetEnrolmentStores();
  navigateMock.mockReset();
});

describe("STPGuidelines", () => {
  it("gates Proceed on both STP checkboxes plus a pre-course answer, then redirects the New flow", async () => {
    useSelectAcademicYear.getState().setAcademicYear("2026-2027");
    const user = userEvent.setup();
    renderPage({ enroleeType: "New", isOpenHouseRegistration: false, isSTP: true });

    const proceed = screen.getByRole("button", { name: /Proceed to Application/ });
    expect(proceed).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /ICA alone decides/ }));
    await user.click(screen.getByRole("checkbox", { name: /fees are non-refundable/ }));
    expect(proceed).toBeDisabled(); // still missing a pre-course answer

    await user.click(screen.getByRole("radio", { name: /have not completed Pre-Course Counselling/ }));
    expect(proceed).toBeEnabled();

    await user.click(proceed);

    expect(navigateMock).toHaveBeenCalledWith("/enrol-student/new/student-info?academicYear=2026-2027");
    expect(useEnrolNewStudentStore.getState().formState).toMatchObject({ preCourseAnswer: "No" });
  });

  it("redirects the Old (re-enrolment) flow to its enrolee-number path", async () => {
    useSelectAcademicYear.getState().setAcademicYear("2026-2027");
    const user = userEvent.setup();
    renderPage({ enroleeType: "Old", isOpenHouseRegistration: false, isSTP: false, enroleeNumber: "ENR-123" });

    await user.click(screen.getByRole("radio", { name: /have not completed Pre-Course Counselling/ }));
    await user.click(screen.getByRole("button", { name: /Proceed to Application/ }));

    expect(navigateMock).toHaveBeenCalledWith("/enrol-student/ENR-123/student-info?academicYear=2026-2027");
    expect(useEnrolOldStudentStore.getState().formState).toMatchObject({ preCourseAnswer: "No" });
  });

  it("shows the date picker for Yes and the important notice for No", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "New", isOpenHouseRegistration: false, isSTP: false });

    await user.click(screen.getByRole("radio", { name: /have completed Pre-Course Counselling/ }));
    expect(screen.getByRole("button", { name: /Pick a date/ })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /have not completed Pre-Course Counselling/ }));
    expect(screen.getByText("Important Notice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pick a date/ })).not.toBeInTheDocument();
  });

  it("auto-acknowledges pre-course counselling for open house registrants and redirects there", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "New", isOpenHouseRegistration: true, isSTP: false });

    // useEffect fires on mount — no user interaction needed to satisfy canContinue.
    const proceed = await screen.findByRole("button", { name: /Proceed to Application/ });
    expect(proceed).toBeEnabled();
    expect(usePreCourseAcknowledgementStore.getState().preCourseAnswer).toBe("Yes");
    expect(usePreCourseAcknowledgementStore.getState().preCourseDate).toBeInstanceOf(Date);

    await user.click(proceed);
    expect(navigateMock).toHaveBeenCalledWith("/open-house/account-info");
  });
});
