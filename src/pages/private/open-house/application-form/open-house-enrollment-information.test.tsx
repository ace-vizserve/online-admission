/**
 * Phase 20 — Open House, Enrollment Info tab (`enrollmentInformationSchema`).
 */
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OpenHouseEnrollmentInformation from "./open-house-enrollment-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useOpenHouseStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getNewStudentDiscounts: vi.fn().mockResolvedValue({ discountCodes: [] }),
}));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("open-house-enrollment-information.tsx", () => {
  it("does not crash when uploadRequirements is entirely absent", () => {
    seedFormState("open-house", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
      // uploadRequirements intentionally absent
    });

    expect(() => renderForm(<OpenHouseEnrollmentInformation />, { flow: "open-house" })).not.toThrow();
  });

  it("renders seeded values on initial mount", () => {
    seedFormState("open-house", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One", socialMediaConsent: true },
    });

    renderForm(<OpenHouseEnrollmentInformation />, { flow: "open-house" });

    expect(screen.getByRole("checkbox", { name: /social media consent/i })).toBeChecked();
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional, confirming Phase 11's predicted gap)", async () => {
    seedFormState("open-house", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
    });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<OpenHouseEnrollmentInformation />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("does not auto-select a contract signatory when hasFatherInfo is true — the parent must choose", () => {
    seedFormState("open-house", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: {},
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: true } },
    });

    renderForm(<OpenHouseEnrollmentInformation />, { flow: "open-house" });

    expect(screen.getByText(/choose a signatory option/i)).toBeInTheDocument();
  });

  it("does not revert an already-chosen Mother signatory back to Father on remount (regression)", async () => {
    seedFormState("open-house", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { contractSignatory: "Mother" },
      uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: true } },
    });

    const { container } = renderForm(<OpenHouseEnrollmentInformation />, { flow: "open-house" });

    await waitFor(() => {
      const selectValues = Array.from(container.querySelectorAll('[data-slot="select-value"]'));
      expect(selectValues.some((el) => el.textContent?.trim() === "Mother")).toBe(true);
      expect(selectValues.some((el) => el.textContent?.trim() === "Father")).toBe(false);
    });
  });
});
