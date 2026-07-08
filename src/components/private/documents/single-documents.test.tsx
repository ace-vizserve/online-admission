/**
 * Regression coverage for the birth-date picker in the post-submission "update application"
 * student-information editor. The picker previously stored react-day-picker's local-midnight
 * Date, which postgrest serializes via toISOString() — in UTC+ timezones (Singapore) that rolls
 * the saved `birthDay` back one day. The saved payload must carry UTC midnight of the clicked
 * calendar day.
 */
import { UserSessionContext } from "@/context/user-session-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Student } from "@/types";
import SingleDocuments from "./single-documents";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/send-email-notification", () => ({ sendEmailNotification: vi.fn() }));

const updateEnrollmentApplicationDetails = vi.fn();
vi.mock("@/actions/private", () => ({
  updateEnrollmentApplicationDetails: (...args: unknown[]) => updateEnrollmentApplicationDetails(...args),
}));

const ENROLEE_NUMBER = "E260050";

const STUDENT_FIXTURE = {
  id: 1,
  created_at: "2026-01-01",
  enroleeNumber: ENROLEE_NUMBER,
  studentNumber: "H260050",
  nationality: "Singaporean",
  firstName: "Jane",
  lastName: "Doe",
  birthDay: new Date("2015-01-01"),
  contactPerson: "John Doe",
  contactPersonNumber: "91234567",
  gender: "Female",
  homeAddress: "1 Example Street",
  homePhone: "61234567",
  livingWithWhom: "Parents",
  nric: "S1234567A",
  parentMaritalStatus: "Married",
  postalCode: "123456",
  preferredName: "Jane",
  primaryLanguage: "English",
  religion: "None",
  enroleePhoto: "",
} as unknown as Student;

function renderPage(studentOverrides: Partial<Student> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  return render(
    <MemoryRouter initialEntries={[`/admission/enrolments/application/${ENROLEE_NUMBER}?academicYear=ay2026`]}>
      <QueryClientProvider client={queryClient}>
        <UserSessionContext.Provider
          value={{
            session: {
              user: { email: "mother@example.com", user_metadata: { relationship: "Mother" } },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            isLoading: false,
            passwordResetState: false,
          }}>
          <Routes>
            <Route
              path="/admission/enrolments/application/:id"
              element={
                <SingleDocuments
                  label="Student Information"
                  studentInformation={{ ...STUDENT_FIXTURE, ...studentOverrides }}
                />
              }
            />
          </Routes>
        </UserSessionContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  updateEnrollmentApplicationDetails.mockReset();
  updateEnrollmentApplicationDetails.mockResolvedValue(undefined);
});

describe("SingleDocuments student information editing", () => {
  // Non-STP applications store `stpApplicationType: null` in the database. The edit form spreads
  // the raw record into defaultValues, so the schema must accept null — otherwise handleSubmit
  // silently blocks the save with "Expected string, received null" on a field the form never renders.
  it("saves when stpApplicationType is null (regular non-STP application)", { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    renderPage({ stpApplicationType: null } as unknown as Partial<Student>);

    await user.click(screen.getByRole("switch")); // enable edit mode
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateEnrollmentApplicationDetails).toHaveBeenCalled());
  });
});

describe("SingleDocuments birth date picker", () => {
  // The full edit form is heavy to render and the test drives several popover/dropdown
  // interactions — under coverage instrumentation it exceeds the default 5s.
  it("saves the picked birth date as UTC midnight of the clicked calendar day", { timeout: 15000 }, async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("switch")); // enable edit mode

    // Open the Date of Birth popover. The trigger sits inside a FormItem, so its accessible
    // name is the field label, not the displayed "01/01/2015" value.
    await user.click(screen.getByRole("button", { name: /date of birth/i }));

    // Navigate to January 2015 via the caption dropdowns (react-day-picker native selects).
    const yearSelect = await screen.findByRole("combobox", { name: /year/i });
    await user.selectOptions(yearSelect, screen.getByRole("option", { name: "2015" }));
    const monthSelect = screen.getByRole("combobox", { name: /month/i });
    await user.selectOptions(monthSelect, screen.getByRole("option", { name: "Jan" }));

    // Day buttons carry `data-day={date.toLocaleDateString()}` (see calendar.tsx).
    const target = new Date(2015, 0, 15);
    const dayButton = document.querySelector(`[data-day="${target.toLocaleDateString()}"]`);
    expect(dayButton).not.toBeNull();
    await user.click(dayButton as HTMLElement);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateEnrollmentApplicationDetails).toHaveBeenCalled());
    const { enrollmentDetails } = updateEnrollmentApplicationDetails.mock.calls[0][0];
    // postgrest serializes Dates via toISOString — it must yield the clicked day, not the previous one.
    expect(enrollmentDetails.birthDay.toISOString()).toBe("2015-01-15T00:00:00.000Z");
  });
});
