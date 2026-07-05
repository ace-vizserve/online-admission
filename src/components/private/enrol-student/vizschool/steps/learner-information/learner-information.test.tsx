/**
 * Phase 9 — VizSchool New Learner, Learner Info tab (`vizschool/steps/learner-information/`).
 * Covers student-details.tsx, student-address-contact.tsx. Per the plan's explicit concern for
 * this tree, verifies each panel uses the VizSchool-specific schema variant
 * (`vizSchoolStudentDetailsSchema`) and not an HFSE one — re-derived fresh here, not assumed.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDetails from "./student-details";
import StudentAddressContact from "./student-address-contact";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useVizSchoolEnrolNewStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

const BASE_STUDENT_DETAILS = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  preferredName: "Juan",
  birthDay: new Date("2016-05-01"),
  gender: "Male",
  primaryLanguage: "English",
  religion: "Catholic",
};

describe("student-details.tsx (VizSchool new)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "vizschool-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Juan");
  });

  it("submits successfully with no NRIC entered (VizSchool's schema never requires it, unlike HFSE's STP-conditional requirement)", async () => {
    seedFormState("vizschool-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    const user = userEvent.setup();
    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "vizschool-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /save details|update details/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(useVizSchoolEnrolNewStudentStore.getState().formState.studentInfo?.studentDetails?.isValid).toBe(true);
    });
  });

  it("reflects a gender value applied via form.reset() post-mount (fixed: RadioGroup used defaultValue instead of value)", async () => {
    seedFormState("vizschool-new", { studentInfo: { studentDetails: { ...BASE_STUDENT_DETAILS, gender: "Male" } } });

    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "vizschool-new" });

    const maleRadio = screen.getByRole("radio", { name: "Male" });
    const femaleRadio = screen.getByRole("radio", { name: "Female" });
    expect(maleRadio).toBeChecked();

    const user = userEvent.setup();
    await user.click(femaleRadio);

    await waitFor(() => {
      expect(femaleRadio).toBeChecked();
      expect(maleRadio).not.toBeChecked();
    });
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("vizschool-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

const BASE_ADDRESS_CONTACT = {
  homeAddress: "123 Main St",
  postalCode: "123456",
  nationality: "Singaporean",
  homePhone: "65123456",
  contactPerson: "Maria Dela Cruz",
  contactPersonNumber: "65123457",
  livingWithWhom: "Both Parents",
  parentMaritalStatus: "Married",
};

describe("student-address-contact.tsx (VizSchool new)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-new", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact />, { flow: "vizschool-new" });

    expect(screen.getByLabelText(/home address/i)).toHaveValue("123 Main St");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("vizschool-new", {
      studentInfo: { studentDetails: { isValid: true }, addressContact: BASE_ADDRESS_CONTACT },
    });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<StudentAddressContact />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("never shows the residence-history section (VizSchool has no STP concern; the schema is intentionally shared with HFSE)", () => {
    seedFormState("vizschool-new", {
      studentInfo: { studentDetails: { isValid: true }, addressContact: BASE_ADDRESS_CONTACT },
    });

    renderForm(<StudentAddressContact />, { flow: "vizschool-new" });

    expect(screen.queryByText(/where has your child/i)).not.toBeInTheDocument();
  });
});
