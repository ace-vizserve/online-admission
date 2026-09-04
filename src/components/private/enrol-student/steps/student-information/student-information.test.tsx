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
import { useEnrolNewStudentTabStateStore, usePassTypeStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const navigateSpy = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => navigateSpy };
});

beforeEach(() => {
  resetEnrolmentStores();
  navigateSpy.mockClear();
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

  it("leaves NRIC optional even when an STP application is in progress", async () => {
    usePassTypeStore.setState({ stpApplicationType: "New Student Pass Application" });
    seedFormState("hfse-new", { studentInfo: { studentDetails: BASE_STUDENT_DETAILS } });

    const user = userEvent.setup();
    renderForm(<StudentDetails setTabOpened={vi.fn()} />, { flow: "hfse-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /save details|update details/i });
    await user.click(submitButton);

    // A new Student Pass applicant usually has no FIN yet, so this must not block the save.
    await waitFor(() => {
      expect(screen.queryByText(/NRIC\/FIN is required/i)).not.toBeInTheDocument();
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

const STUDENT_INFO_URL = "/enrol-student/new/student-info";
const FAMILY_INFO_URL = "/enrol-student/new/family-info";

/**
 * The wizard advances off RHF's `isSubmitSuccessful`, which stays true when a guard returns
 * without leaving an error. That let a blocked submit warn the parent and navigate anyway,
 * stranding Student Information as never-completed and — before the reachability fix — locking
 * the step permanently once a later step moved `currentTab` past it.
 */
describe("medical-information.tsx advance guards", () => {
  async function submitMedicalForm() {
    const user = userEvent.setup();
    renderForm(<MedicalInformationSection />, { flow: "hfse-new" });
    await user.click(screen.getByRole("checkbox", { name: /none of the above/i }));
    await user.click(screen.getAllByRole("button", { name: /save & proceed to next step/i })[0]);
  }

  it("does not advance when Student Details was never confirmed", async () => {
    seedFormState("hfse-new", { studentInfo: { addressContact: { isValid: true } } });

    await submitMedicalForm();

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith("Student Details is missing!", expect.anything());
    });
    expect(navigateSpy).not.toHaveBeenCalledWith(FAMILY_INFO_URL);
    expect(useEnrolNewStudentTabStateStore.getState().completedTabs).not.toContain(STUDENT_INFO_URL);
  });

  it("does not advance when Address & Contact was never confirmed", async () => {
    seedFormState("hfse-new", { studentInfo: { studentDetails: { isValid: true } } });

    await submitMedicalForm();

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith("Student Address & Contact is missing!", expect.anything());
    });
    expect(navigateSpy).not.toHaveBeenCalledWith(FAMILY_INFO_URL);
    expect(useEnrolNewStudentTabStateStore.getState().completedTabs).not.toContain(STUDENT_INFO_URL);
  });

  it("advances and marks the step complete once both earlier sub-tabs are confirmed", async () => {
    seedFormState("hfse-new", {
      studentInfo: { studentDetails: { isValid: true }, addressContact: { isValid: true } },
    });

    await submitMedicalForm();

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith(FAMILY_INFO_URL));
    expect(useEnrolNewStudentTabStateStore.getState().completedTabs).toContain(STUDENT_INFO_URL);
  });
});
