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

/**
 * VizSchool prerequisites for this step — no medical requirement in this flow. See the HFSE-IS
 * page test for why a bare `motherInfo` seed is no longer enough.
 */
const REACHED_ENROLLMENT_STEP = {
  studentInfo: { studentDetails: { isValid: true }, addressContact: { isValid: true } },
  familyInfo: { motherInfo: { isValid: true }, fatherInfo: { isValid: true } },
};

describe("learner-enrollment-information.tsx (VizSchool new)", () => {
  it("does not crash when uploadRequirements is entirely absent", () => {
    seedFormState("vizschool-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { levelApplied: "Primary One" },
      // uploadRequirements intentionally absent
    });

    expect(() => renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" })).not.toThrow();
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { levelApplied: "Primary One" },
    });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("defaults the contract signatory to Father when hasFatherInfo is true", async () => {
    seedFormState("vizschool-new", {
      ...REACHED_ENROLLMENT_STEP,
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
      ...REACHED_ENROLLMENT_STEP,
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

/**
 * The step guard is what stops a parent standing on Enrolment Information with an unfinished
 * step behind it — the shape that left Student Information stranded and unreachable.
 */
describe("step guard", () => {
  const SEED = {
    enrollmentInfo: {},
    uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: false } },
  };

  it("refuses to render when an earlier step is incomplete", async () => {
    seedFormState("vizschool-new", SEED);

    renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.queryByText(/parent contract signatory/i)).not.toBeInTheDocument();
    });
  });

  it("renders once those prerequisites are satisfied", async () => {
    seedFormState("vizschool-new", { ...REACHED_ENROLLMENT_STEP, ...SEED });

    renderForm(<LearnerEnrollmentInformation />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.getByText(/parent contract signatory/i)).toBeInTheDocument();
    });
  });
});
