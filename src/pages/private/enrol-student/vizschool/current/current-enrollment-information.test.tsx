/**
 * Phase 15 — VizSchool Current Learner, Enrollment Info tab (`vizSchoolEnrollmentInformationSchema`).
 */
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CurrentEnrollmentInformation from "./current-enrollment-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useVizSchoolEnrolOldStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getStudentEnrollmentInformation: vi.fn().mockResolvedValue({
    levelApplied: "Primary One",
    fatherEmail: "father@example.com",
  }),
  getCurrentStudentDiscounts: vi.fn().mockResolvedValue({ discountCodes: [] }),
}));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("current-enrollment-information.tsx", () => {
  it("renders seeded values once the fetch resolves", async () => {
    seedFormState("vizschool-current", { enrollmentInfo: { levelApplied: "Primary One" } });

    renderForm(<CurrentEnrollmentInformation />, { flow: "vizschool-current" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching enrolment details/i)).not.toBeInTheDocument();
    });
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", { enrollmentInfo: { levelApplied: "Primary One" } });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolOldStudentStore.getState(), "setFormState");

    renderForm(<CurrentEnrollmentInformation />, { flow: "vizschool-current" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching enrolment details/i)).not.toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("hides Father as a contract signatory option when the family is marked no-father-info", async () => {
    seedFormState("vizschool-current", {
      familyInfo: { fatherInfo: { noFatherInfo: true } },
      enrollmentInfo: {},
    });

    const user = (await import("@testing-library/user-event")).default.setup();
    renderForm(<CurrentEnrollmentInformation />, { flow: "vizschool-current" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching enrolment details/i)).not.toBeInTheDocument();
    });

    const signatoryLabel = screen.getByText(/parent contract signatory/i);
    const trigger = signatoryLabel.parentElement!.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Mother" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("option", { name: "Father" })).not.toBeInTheDocument();
  });
});
