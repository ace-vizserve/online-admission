/**
 * Phase 1 — HFSE-IS New Student, Student Info tab (`steps/student-information/`).
 * Covers student-details.tsx, student-address-contact.tsx, medical-information.tsx against
 * their Zod schemas, using the shared render harness (src/test/render-form.tsx).
 */
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentDetails from "./student-details";
import StudentAddressContact from "./student-address-contact";
import MedicalInformationSection from "./medical-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { usePassTypeStore } from "@/zustand-store";

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

describe("student-details.tsx", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "hfse-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Juan");
    expect(screen.getByLabelText(/^last name$/i)).toHaveValue("Dela Cruz");
    expect(screen.getByLabelText(/primary language/i)).toHaveValue("English");
  });

  it("requires NRIC when an STP application is in progress (schema now actually receives stpApplicationType)", async () => {
    usePassTypeStore.setState({ stpApplicationType: "New Student Pass Application" });
    seedFormState("hfse-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    const user = userEvent.setup();
    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "hfse-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /save details|update details/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/NRIC\/FIN is required for this application type/i)).toBeInTheDocument();
    });
  });

  it("does not require NRIC when there is no STP application in progress", async () => {
    usePassTypeStore.setState({ stpApplicationType: "" });
    seedFormState("hfse-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    const user = userEvent.setup();
    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "hfse-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /save details|update details/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/NRIC\/FIN is required/i)).not.toBeInTheDocument();
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

describe("student-address-contact.tsx", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "hfse-new" });

    expect(screen.getByLabelText(/home address/i)).toHaveValue("123 Main St");
    expect(screen.getByLabelText(/postal code/i)).toHaveValue("123456");
  });

  it("hides the residence-history section when there is no STP application in progress", () => {
    usePassTypeStore.setState({ stpApplicationType: "" });
    seedFormState("hfse-new", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "hfse-new" });

    expect(screen.queryByText(/where has your child/i)).not.toBeInTheDocument();
  });

  it("appends a default residence-history row when the STP answer changes after mount", async () => {
    seedFormState("hfse-new", { studentInfo: { addressContact: BASE_ADDRESS_CONTACT } });

    renderForm(<StudentAddressContact setTabOpened={vi.fn()} />, { flow: "hfse-new" });

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

describe("medical-information.tsx", () => {
  it("renders the seeded paracetamol consent value on initial mount", () => {
    seedFormState("hfse-new", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
        medicalInformation: {
          paracetamolConsent: true,
          medicalChecklist: { none: true },
        },
      },
    });

    renderForm(<MedicalInformationSection />, { flow: "hfse-new" });

    expect(screen.getByRole("checkbox", { name: /medication consent/i })).toBeChecked();
  });

  it("requires at least one condition (or 'None of the above') to be selected", async () => {
    seedFormState("hfse-new", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
      },
    });

    const user = userEvent.setup();
    renderForm(<MedicalInformationSection />, { flow: "hfse-new" });

    await user.click(screen.getAllByRole("button", { name: /save & proceed to next step/i })[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Invalid Conditions Checklist!",
        expect.objectContaining({
          description: expect.stringContaining("select at least one health condition"),
        }),
      );
    });
  });

  it("requires detail text when 'Other Medical Condition' is checked", async () => {
    seedFormState("hfse-new", {
      studentInfo: {
        studentDetails: { isValid: true },
        addressContact: { isValid: true },
      },
    });

    const user = userEvent.setup();
    renderForm(<MedicalInformationSection />, { flow: "hfse-new" });

    await user.click(screen.getByRole("checkbox", { name: /other medical condition/i }));
    await user.click(screen.getAllByRole("button", { name: /save & proceed to next step/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/please describe the medical condition/i)).toBeInTheDocument();
    });
  });
});
