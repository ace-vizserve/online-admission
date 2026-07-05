/**
 * Phase 13 — VizSchool Current Learner, Learner Info tab (`vizschool/tabs/learner-information/`).
 * Combines Phase 5-8's structural-gate concern with Phase 9-12's schema-identity concern, per
 * the plan — this tree is exposed to both risk classes.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LearnerDetails from "./learner-details";
import LearnerAddressContact from "./learner-address-contact";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useVizSchoolEnrolOldStudentStore } from "@/zustand-store";

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

describe("learner-details.tsx (VizSchool current)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-current", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    renderForm(<LearnerDetails />, { flow: "vizschool-current" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Juan");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolOldStudentStore.getState(), "setFormState");

    renderForm(<LearnerDetails />, { flow: "vizschool-current" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("does not crash when studentDetails is entirely absent (fixed missing optional chain on religionOther)", () => {
    seedFormState("vizschool-current", {
      studentInfo: { addressContact: { isValid: true } },
      // studentDetails intentionally absent
    });

    expect(() => renderForm(<LearnerDetails />, { flow: "vizschool-current" })).not.toThrow();
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

describe("learner-address-contact.tsx (VizSchool current)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-current", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<LearnerAddressContact />, { flow: "vizschool-current" });

    expect(screen.getByLabelText(/home address/i)).toHaveValue("123 Main St");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", {
      studentInfo: { studentDetails: { isValid: true }, addressContact: BASE_ADDRESS_CONTACT },
    });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolOldStudentStore.getState(), "setFormState");

    renderForm(<LearnerAddressContact />, { flow: "vizschool-current" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("does not crash when marital status is unset (fixed: Select used field.value.trim() unguarded)", () => {
    seedFormState("vizschool-current", {
      studentInfo: { studentDetails: { isValid: true } },
      // addressContact intentionally absent — parentMaritalStatus is unset
    });

    expect(() => renderForm(<LearnerAddressContact />, { flow: "vizschool-current" })).not.toThrow();
  });
});
