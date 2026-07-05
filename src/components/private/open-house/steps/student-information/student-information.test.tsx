/**
 * Phase 18 — Open House, Student Info tab (`steps/student-information/`). Per the plan's
 * explicit concern for this flow, does NOT assume this tree matches HFSE-new's `steps/` tree
 * just because of the shared directory name — re-verified fresh, following the same discipline
 * that already caught real gaps in this flow's Upload Requirements tab (Phase 4).
 */
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDetails from "./student-details";
import StudentAddressContact from "./student-address-contact";
import MedicalInformationSection from "./medical-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useOpenHouseStore, usePassTypeStore } from "@/zustand-store";

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

describe("student-details.tsx (Open House)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("open-house", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "open-house" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Juan");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("open-house", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("requires NRIC when an STP application is in progress (fixed: stpApplicationType never reached the schema for Open House registrants)", async () => {
    usePassTypeStore.setState({ stpApplicationType: "New Student Pass Application" });
    seedFormState("open-house", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    const user = userEvent.setup();
    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "open-house" });

    const [submitButton] = screen.getAllByRole("button", { name: /save details/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/NRIC\/FIN is required for this application type/i)).toBeInTheDocument();
    });
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

describe("student-address-contact.tsx (Open House)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("open-house", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "open-house" });

    expect(screen.getByLabelText(/home address/i)).toHaveValue("123 Main St");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("open-house", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("hides the residence-history section when there is no STP application in progress", () => {
    usePassTypeStore.setState({ stpApplicationType: "" });
    seedFormState("open-house", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "open-house" });

    expect(screen.queryByText(/where has your child/i)).not.toBeInTheDocument();
  });

  it("appends a default residence-history row when the STP answer changes after mount (fixed stale field array)", async () => {
    seedFormState("open-house", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "open-house" });

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

describe("medical-information.tsx (Open House)", () => {
  it("renders the seeded paracetamol consent value on initial mount", () => {
    seedFormState("open-house", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        medicalInformation: {
          paracetamolConsent: true,
          medicalChecklist: { none: true },
        },
      },
    });

    renderForm(<MedicalInformationSection />, { flow: "open-house" });

    expect(screen.getByRole("checkbox", { name: /medication consent/i })).toBeChecked();
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("open-house", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        medicalInformation: { medicalChecklist: { none: true } },
      },
    });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<MedicalInformationSection />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
