/**
 * Phase 3 — HFSE-IS New Student, Enrollment Info tab (page-level, `enrollmentInformationSchema`).
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EnrollmentInformation from "./enrollment-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

/**
 * What a parent must actually have satisfied to be standing on this step. The page guard is
 * validity-based now, so seeding only `motherInfo` — which was enough to clear the old
 * presence check — redirects the page away and would leave every assertion below running
 * against an empty render.
 */
const REACHED_ENROLLMENT_STEP = {
  studentInfo: {
    studentDetails: { isValid: true },
    addressContact: { isValid: true },
    medicalInformation: { isValid: true },
  },
  familyInfo: { motherInfo: { isValid: true }, fatherInfo: { isValid: true } },
};

describe("enrollment-information.tsx (HFSE new)", () => {
  it("does not crash when uploadRequirements is entirely absent (fixed missing optional chain)", () => {
    seedFormState("hfse-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { levelApplied: "Primary One" },
      // uploadRequirements intentionally absent — the normal wizard order reaches this tab
      // before Upload Requirements is ever visited, so this is the common case, not an edge one.
    });

    expect(() => renderForm(<EnrollmentInformation />, { flow: "hfse-new" })).not.toThrow();
  });

  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { levelApplied: "Primary One", socialMediaConsent: true },
    });

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    expect(screen.getByRole("checkbox", { name: /social media consent/i })).toBeChecked();
  });

  it("does not auto-select a contract signatory when hasFatherInfo is true — the parent must choose", () => {
    seedFormState("hfse-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: {},
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: true } },
    });

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    expect(screen.getByText(/choose a signatory option/i)).toBeInTheDocument();
  });

  it("does not revert an already-chosen Mother signatory back to Father on remount (regression)", () => {
    seedFormState("hfse-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { contractSignatory: "Mother" },
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: true } },
    });

    const { container } = renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    const selectValues = Array.from(container.querySelectorAll('[data-slot="select-value"]'));
    expect(selectValues.some((el) => el.textContent?.trim() === "Mother")).toBe(true);
    expect(selectValues.some((el) => el.textContent?.trim() === "Father")).toBe(false);
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { levelApplied: "Primary One" },
    });
    const setFormStateSpy = vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

/**
 * The step guard is what stops a parent standing on Enrolment Information with an unfinished
 * step behind it — the shape that left Student Information stranded and unreachable.
 */
describe("step guard", () => {
  it("refuses to render when an earlier step is incomplete", () => {
    seedFormState("hfse-new", { enrollmentInfo: { levelApplied: "Primary One", socialMediaConsent: true } });

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    expect(screen.queryByRole("checkbox", { name: /social media consent/i })).not.toBeInTheDocument();
  });

  it("renders once those prerequisites are satisfied", () => {
    seedFormState("hfse-new", {
      ...REACHED_ENROLLMENT_STEP,
      enrollmentInfo: { levelApplied: "Primary One", socialMediaConsent: true },
    });

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    expect(screen.getByRole("checkbox", { name: /social media consent/i })).toBeInTheDocument();
  });
});
