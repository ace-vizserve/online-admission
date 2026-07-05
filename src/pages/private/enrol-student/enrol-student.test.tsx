/**
 * Behavior tests for EnrolStudent, added alongside the design-system alignment pass (see
 * project design system memory). Real logic worth locking down: `checkEnrollmentAndProceed`'s
 * four branches (already enrolled at HFSE, already enrolled at VizSchool, ineligible/Secondary 4,
 * eligible — with VizSchool vs. regular navigation), and `goBack` clearing the academic-year/
 * school-fee stores.
 *
 * The page always renders `EnrollmentStepper` first (`showEnrollmentProcess` starts `true`), so
 * every test drives through its two real steps (agree-to-terms checkbox → Proceed → agree-to-terms
 * checkbox → 250ms internal `wait()`) before reaching the student-selection card underneath —
 * this exercises the actual flow a parent goes through, not a shortcut around it.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserSessionContext } from "@/context/user-session-context";
import { EnrolledStudent } from "@/types";
import { useSelectAcademicYear, useSelectSchoolFee } from "@/zustand-store";

import EnrolStudent from "./enrol-student";

const {
  navigateMock,
  toastMock,
  getPreviousEnrolledStudentsMock,
  lookupNewEnrolledStudentMock,
  vizSchoolLookupNewEnrolledStudentMock,
  canEnrollStudentMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastMock: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
  getPreviousEnrolledStudentsMock: vi.fn(),
  lookupNewEnrolledStudentMock: vi.fn(),
  vizSchoolLookupNewEnrolledStudentMock: vi.fn(),
  canEnrollStudentMock: vi.fn(),
}));

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("sonner", () => ({ toast: toastMock }));

vi.mock("@/actions/private", () => ({
  getPreviousEnrolledStudents: (...args: unknown[]) => getPreviousEnrolledStudentsMock(...args),
  lookupNewEnrolledStudent: (...args: unknown[]) => lookupNewEnrolledStudentMock(...args),
  vizSchoolLookupNewEnrolledStudent: (...args: unknown[]) => vizSchoolLookupNewEnrolledStudentMock(...args),
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual, canEnrollStudent: (...args: unknown[]) => canEnrollStudentMock(...args) };
});

const STUDENT: EnrolledStudent = {
  enroleeNumber: "E100",
  enroleeFullName: "Juan Dela Cruz",
  levelApplied: "Primary Three",
  studentNumber: "S100",
  enroleePhoto: "",
  nric: "S1234567A",
  birthDay: "2015-01-01",
  pass: "Student Pass",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/enrol-student"]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <UserSessionContext.Provider
          value={{ session: { user: { email: "parent@example.com" } } as never, isLoading: false, passwordResetState: false }}>
          <EnrolStudent />
        </UserSessionContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

/** Drives through both real EnrollmentStepper steps to reach the student-selection card. */
async function completeEnrollmentStepper(user: UserEvent) {
  await user.click(screen.getByRole("checkbox", { name: /agree to the enrolment terms/i }));
  await user.click(screen.getByRole("button", { name: /Proceed to Next Step/i }));
  await user.click(await screen.findByRole("checkbox", { name: /Continue to application/i }));
}

beforeEach(() => {
  navigateMock.mockReset();
  toastMock.warning.mockReset();
  toastMock.info.mockReset();
  getPreviousEnrolledStudentsMock.mockReset().mockResolvedValue({ studentsList: [STUDENT] });
  lookupNewEnrolledStudentMock.mockReset().mockResolvedValue(false);
  vizSchoolLookupNewEnrolledStudentMock.mockReset().mockResolvedValue(false);
  canEnrollStudentMock.mockReset().mockResolvedValue(true);
  useSelectAcademicYear.getState().clearState();
  useSelectSchoolFee.getState().clearState();
});

describe("EnrolStudent", () => {
  it("clears the academic-year and school-fee state on Go back", async () => {
    useSelectAcademicYear.getState().setAcademicYear("ay2026");
    useSelectSchoolFee.getState().setSchoolFee("VizFlex");
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("link", { name: /Go back/i }));

    expect(useSelectAcademicYear.getState().academicYear).toBe("");
    expect(useSelectSchoolFee.getState().schoolFee).toBe("");
  });

  it("warns and does not navigate when the student is already enrolled at HFSE", async () => {
    useSelectAcademicYear.getState().setAcademicYear("ay2026");
    lookupNewEnrolledStudentMock.mockResolvedValue(true);
    const user = userEvent.setup();
    renderPage();

    await completeEnrollmentStepper(user);
    await user.click(await screen.findByRole("radio", { name: /Juan Dela Cruz/ }));
    await user.click(screen.getByRole("button", { name: /Enrol student/i }));

    await waitFor(() => {
      expect(toastMock.warning).toHaveBeenCalledWith(
        "Student already enrolled for HFSE!",
        expect.objectContaining({ description: expect.stringContaining("A.Y.") }),
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("warns and does not navigate when the student is already enrolled at VizSchool", async () => {
    useSelectAcademicYear.getState().setAcademicYear("ay2026");
    vizSchoolLookupNewEnrolledStudentMock.mockResolvedValue(true);
    const user = userEvent.setup();
    renderPage();

    await completeEnrollmentStepper(user);
    await user.click(await screen.findByRole("radio", { name: /Juan Dela Cruz/ }));
    await user.click(screen.getByRole("button", { name: /Enrol student/i }));

    await waitFor(() => {
      expect(toastMock.warning).toHaveBeenCalledWith(
        "Student already enrolled for VizSchool!",
        expect.anything(),
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows an ineligible notice when the student has completed Secondary 4", async () => {
    useSelectAcademicYear.getState().setAcademicYear("ay2026");
    canEnrollStudentMock.mockResolvedValue(false);
    const user = userEvent.setup();
    renderPage();

    await completeEnrollmentStepper(user);
    await user.click(await screen.findByRole("radio", { name: /Juan Dela Cruz/ }));
    await user.click(screen.getByRole("button", { name: /Enrol student/i }));

    await waitFor(() => {
      expect(toastMock.info).toHaveBeenCalledWith(
        "Enrolment not allowed!",
        expect.objectContaining({ description: expect.stringContaining("Secondary 4") }),
      );
    });
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("navigates to residency-status for an eligible regular (non-VizSchool) student", async () => {
    useSelectAcademicYear.getState().setAcademicYear("ay2026");
    const user = userEvent.setup();
    renderPage();

    await completeEnrollmentStepper(user);
    await user.click(await screen.findByRole("radio", { name: /Juan Dela Cruz/ }));
    await user.click(screen.getByRole("button", { name: /Enrol student/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/enrol-student/residency-status", {
        state: { enroleeType: "Current", enroleeNumber: "E100", currentPass: "Student Pass" },
      });
    });
  });

  it("navigates straight to the VizSchool student-info route for an eligible learner", async () => {
    useSelectAcademicYear.getState().setAcademicYear("vizschool-ay2026");
    useSelectSchoolFee.getState().setSchoolFee("VizFlex");
    const user = userEvent.setup();
    renderPage();

    await completeEnrollmentStepper(user);
    await user.click(await screen.findByRole("radio", { name: /Juan Dela Cruz/ }));
    await user.click(screen.getByRole("button", { name: /Continue Enrolment/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/vizschool/enrol-student/E100/student-info?academicYear=ay2026");
    });
  });
});
