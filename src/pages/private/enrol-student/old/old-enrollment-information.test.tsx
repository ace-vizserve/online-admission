/**
 * Phase 7 — HFSE-IS Re-enrollment, Enrollment Info tab (`enrollmentInformationSchema`).
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OldEnrollmentInformation from "./old-enrollment-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolOldStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getCurrentStudentDiscounts: vi.fn().mockResolvedValue({ discountCodes: [] }),
}));
vi.mock("@/actions/get-reenrollment-data", () => ({
  getReEnrollmentData: vi.fn().mockResolvedValue({
    levelApplied: "Primary One",
    fatherEmail: "father@example.com",
  }),
}));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("old-enrollment-information.tsx", () => {
  it("renders seeded values once the fetch resolves", async () => {
    seedFormState("hfse-old", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { socialMediaConsent: true },
    });

    renderForm(<OldEnrollmentInformation />, { flow: "hfse-old" });

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /social media consent/i })).toBeChecked();
    });
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", {
      familyInfo: { motherInfo: { isValid: true } },
      enrollmentInfo: { levelApplied: "Primary One" },
    });
    const setFormStateSpy = vi.spyOn(useEnrolOldStudentStore.getState(), "setFormState");

    renderForm(<OldEnrollmentInformation />, { flow: "hfse-old" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching enrolment details/i)).not.toBeInTheDocument();
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("offers Father as a contract signatory option when the fetched application has a father email and the family isn't marked no-father-info", async () => {
    seedFormState("hfse-old", {
      familyInfo: { motherInfo: { isValid: true }, fatherInfo: { noFatherInfo: false } },
      enrollmentInfo: {},
    });

    const user = userEvent.setup();
    renderForm(<OldEnrollmentInformation />, { flow: "hfse-old" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching enrolment details/i)).not.toBeInTheDocument();
    });

    const signatoryLabel = screen.getByText(/parent contract signatory/i);
    const trigger = signatoryLabel.parentElement!.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(trigger);

    expect(await screen.findByRole("option", { name: "Father" })).toBeInTheDocument();
  });

  it("hides Father as a contract signatory option when the family is marked no-father-info", async () => {
    seedFormState("hfse-old", {
      familyInfo: { motherInfo: { isValid: true }, fatherInfo: { noFatherInfo: true } },
      enrollmentInfo: {},
    });

    const user = userEvent.setup();
    renderForm(<OldEnrollmentInformation />, { flow: "hfse-old" });

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
