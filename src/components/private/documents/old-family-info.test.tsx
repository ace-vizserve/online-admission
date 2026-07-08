/**
 * Regression coverage for the parent birthday pickers in the post-submission "update
 * application" family-information editor. All four pickers (father/mother/guardian/sibling)
 * share one pattern; the mother's is exercised as the representative. The picker previously
 * stored react-day-picker's local-midnight Date, which postgrest serializes via toISOString()
 * — in UTC+ timezones (Singapore) that saves the previous day.
 */
import { UserSessionContext } from "@/context/user-session-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FamilyInfo } from "@/types";
import OldFamilyInfo from "./old-family-info";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/send-email-notification", () => ({ sendEmailNotification: vi.fn() }));

const updateEnrollmentApplicationDetails = vi.fn();
vi.mock("@/actions/private", () => ({
  updateEnrollmentApplicationDetails: (...args: unknown[]) => updateEnrollmentApplicationDetails(...args),
}));

const ENROLEE_NUMBER = "E260050";

// Mother-only household: father/guardian sections don't render (no emails), and their
// schema requirements are waived via noFatherInfo/noGuardianInfo defaults. Mother fields are
// partial in the schema, so this minimal shape validates.
const FAMILY_FIXTURE = {
  motherEmail: "mother@example.com",
  motherFirstName: "Mary",
  motherLastName: "Doe",
  fatherEmail: null,
  guardianEmail: null,
} as unknown as FamilyInfo;

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  return render(
    <MemoryRouter initialEntries={[`/admission/enrolments/application/${ENROLEE_NUMBER}?academicYear=ay2026`]}>
      <QueryClientProvider client={queryClient}>
        <UserSessionContext.Provider
          value={{
            session: {
              user: { email: "mother@example.com", user_metadata: { relationship: "mother" } },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            isLoading: false,
            passwordResetState: false,
          }}>
          <Routes>
            <Route
              path="/admission/enrolments/application/:id"
              element={<OldFamilyInfo label="Family Information" familyInformation={FAMILY_FIXTURE} />}
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

describe("OldFamilyInfo birthday pickers", () => {
  it("saves the picked mother's birthday as UTC midnight of the clicked calendar day", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("switch")); // enable edit mode

    // Only the mother section renders, so this is her (empty) Birthday trigger. The popover
    // trigger sits inside a FormItem, so its accessible name is the field label, not "Pick a date".
    await user.click(screen.getByRole("button", { name: /birthday/i }));

    // The plain calendar opens on the current month; day 1 is always present.
    // Day buttons carry `data-day={date.toLocaleDateString()}` (see calendar.tsx).
    const today = new Date();
    const target = new Date(today.getFullYear(), today.getMonth(), 1);
    const dayButton = document.querySelector(`[data-day="${target.toLocaleDateString()}"]`);
    expect(dayButton).not.toBeNull();
    await user.click(dayButton as HTMLElement);

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateEnrollmentApplicationDetails).toHaveBeenCalled());
    const { enrollmentDetails } = updateEnrollmentApplicationDetails.mock.calls[0][0];
    const expectedDay = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-01`;
    // postgrest serializes Dates via toISOString — it must yield the clicked day, not the previous one.
    expect(enrollmentDetails.motherBirthDay.toISOString()).toBe(`${expectedDay}T00:00:00.000Z`);
  });
});
