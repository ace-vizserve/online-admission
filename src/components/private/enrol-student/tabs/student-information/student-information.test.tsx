/**
 * Phase 5 — HFSE-IS Re-enrollment, Student Info tab (`tabs/student-information/`).
 * Covers student-details.tsx, student-address-contact.tsx, medical-information.tsx against
 * their Zod schemas (same schemas the `steps/` tree uses).
 */
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDetails from "./student-details";
import StudentAddressContact from "./student-address-contact";
import MedicalInformationSection from "./medical-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolOldStudentStore, usePassTypeStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

function spyOnSetFormState() {
  return vi.spyOn(useEnrolOldStudentStore.getState(), "setFormState");
}

const BASE_STUDENT_DETAILS = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  preferredName: "Juan",
  birthDay: new Date("2016-05-01"),
  gender: "Male",
  primaryLanguage: "English",
  religion: "Catholic",
};

describe("student-details.tsx (HFSE old)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-old", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    renderForm(<StudentDetails />, { flow: "hfse-old" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Juan");
    expect(screen.getByLabelText(/^last name$/i)).toHaveValue("Dela Cruz");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<StudentDetails />, { flow: "hfse-old" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("requires NRIC when an STP application is in progress (fixed: stpApplicationType now reaches the schema)", async () => {
    usePassTypeStore.setState({ stpApplicationType: "New Student Pass Application" });
    seedFormState("hfse-old", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    const user = userEvent.setup();
    renderForm(<StudentDetails />, { flow: "hfse-old" });

    const [submitButton] = screen.getAllByRole("button", { name: /save details/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/NRIC\/FIN is required for this application type/i)).toBeInTheDocument();
    });
  });

  it("does not crash when studentDetails is entirely absent (fixed missing optional chain on religionOther)", () => {
    seedFormState("hfse-old", {
      studentInfo: { addressContact: { isValid: true } },
      // studentDetails intentionally absent
    });

    expect(() => renderForm(<StudentDetails />, { flow: "hfse-old" })).not.toThrow();
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

describe("student-address-contact.tsx (HFSE old)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-old", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact />, { flow: "hfse-old" });

    expect(screen.getByLabelText(/home address/i)).toHaveValue("123 Main St");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<StudentAddressContact />, { flow: "hfse-old" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("does not crash when studentInfo.addressContact is entirely absent (fixed missing optional chain)", () => {
    seedFormState("hfse-old", {
      studentInfo: { studentDetails: { isValid: true } },
      // addressContact intentionally absent
    });

    expect(() => renderForm(<StudentAddressContact />, { flow: "hfse-old" })).not.toThrow();
  });

  it("appends a default residence-history row when the STP answer changes after mount (fixed stale field array)", async () => {
    seedFormState("hfse-old", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact />, { flow: "hfse-old" });

    expect(screen.queryByText(/where has your child/i)).not.toBeInTheDocument();

    act(() => {
      usePassTypeStore.setState({ stpApplicationType: "New Student Pass Application" });
    });

    await waitFor(() => {
      expect(screen.getByText(/where has your child/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. philippines/i)).toBeInTheDocument();
    });
  });
});

describe("medical-information.tsx (HFSE old)", () => {
  it("renders the seeded paracetamol consent value on initial mount", () => {
    seedFormState("hfse-old", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        medicalInformation: {
          paracetamolConsent: true,
          medicalChecklist: { none: true },
        },
      },
    });

    renderForm(<MedicalInformationSection />, { flow: "hfse-old" });

    expect(screen.getByRole("checkbox", { name: /medication consent/i })).toBeChecked();
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        medicalInformation: { medicalChecklist: { none: true } },
      },
    });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<MedicalInformationSection />, { flow: "hfse-old" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
