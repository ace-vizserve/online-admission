/**
 * Phase 11 — VizSchool New Learner, Enrollment Info tab (`vizSchoolEnrollmentInformationSchema`).
 */
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LearnerEnrollmentInformation from "./learner-enrollment-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useVizSchoolEnrolNewStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getNewStudentDiscounts: vi.fn().mockResolvedValue({ discountCodes: [] }),
}));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("learner-enrollment-information.tsx (VizSchool new)", () => {
  it("does not crash when uploadRequirements is entirely absent", () => {
    seedFormState("vizschool-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
      // uploadRequirements intentionally absent
    });

    expect(() => renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" })).not.toThrow();
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
    });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("defaults the contract signatory to Father when hasFatherInfo is true", async () => {
    seedFormState("vizschool-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: {},
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: true } },
    });

    const { container } = renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" });

    await waitFor(() => {
      const selectValues = Array.from(container.querySelectorAll('[data-slot="select-value"]'));
      expect(selectValues.some((el) => el.textContent?.trim() === "Father")).toBe(true);
    });
  });

  it("does not offer Father as a contract signatory option when hasFatherInfo is false", async () => {
    seedFormState("vizschool-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: {},
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: false } },
    });

    renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.getByText(/parent contract signatory/i)).toBeInTheDocument();
    });
    expect(screen.queryByText("Father")).not.toBeInTheDocument();
  });
});
