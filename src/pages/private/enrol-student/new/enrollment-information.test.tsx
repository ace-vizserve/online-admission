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

describe("enrollment-information.tsx (HFSE new)", () => {
  it("does not crash when uploadRequirements is entirely absent (fixed missing optional chain)", () => {
    seedFormState("hfse-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
      // uploadRequirements intentionally absent — the normal wizard order reaches this tab
      // before Upload Requirements is ever visited, so this is the common case, not an edge one.
    });

    expect(() => renderForm(<EnrollmentInformation />, { flow: "hfse-new" })).not.toThrow();
  });

  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One", socialMediaConsent: true },
    });

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    expect(screen.getByRole("checkbox", { name: /social media consent/i })).toBeChecked();
  });

  it("does not auto-select a contract signatory when hasFatherInfo is true — the parent must choose", () => {
    seedFormState("hfse-new", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: {},
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: true } },
    });

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    expect(screen.getByText(/choose a signatory option/i)).toBeInTheDocument();
  });

  it("does not revert an already-chosen Mother signatory back to Father on remount (regression)", () => {
    seedFormState("hfse-new", {
      familyInfo: { motherInfo: { isValid: true } },
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
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
    });
    const setFormStateSpy = vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<EnrollmentInformation />, { flow: "hfse-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
