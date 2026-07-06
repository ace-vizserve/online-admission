/**
 * Phase 10 — VizSchool New Learner, Family Info tab (`vizschool/steps/family-information/`).
 * Re-verifies father/mother/guardian/sibling-information.tsx fresh against the plan's explicit
 * schema-identity concern for this tree, rather than trusting Phase 0/2's summaries.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FatherInformation from "./father-information";
import MotherInformation from "./mother-information";
import GuardianInformation from "./guardian-information";
import SiblingInformation from "./sibling-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentTabStateStore, useVizSchoolEnrolNewStudentStore } from "@/zustand-store";
import { toast } from "sonner";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

function spyOnSetFormState() {
  return vi.spyOn(useVizSchoolEnrolNewStudentStore.getState(), "setFormState");
}

const BASE_FATHER = {
  fatherFirstName: "Jose",
  fatherLastName: "Dela Cruz",
  fatherPreferredName: "Jose",
  fatherBirthDay: new Date("1983-02-01"),
  fatherNationality: "Singaporean",
  fatherReligion: "Catholic",
  fatherMobile: "65222222",
  fatherEmail: "jose@example.com",
  fatherCompanyName: "Acme Pte Ltd",
  fatherPosition: "Engineer",
  noFatherInfo: false,
};

describe("father-information.tsx (VizSchool new)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-new", { familyInfo: { fatherInfo: BASE_FATHER } });

    renderForm(<FatherInformation />, { flow: "vizschool-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Jose");
  });

  it("submits successfully without an NRIC (VizSchool's father schema makes it optional, unlike HFSE's)", async () => {
    seedFormState("vizschool-new", { familyInfo: { fatherInfo: BASE_FATHER, motherInfo: { isValid: true } } });

    const user = userEvent.setup();
    renderForm(<FatherInformation />, { flow: "vizschool-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /confirm details|confirm & proceed/i });
    await user.click(submitButton);

    expect(useVizSchoolEnrolNewStudentStore.getState().formState.familyInfo?.fatherInfo?.isValid).toBe(true);
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("vizschool-new", { familyInfo: { fatherInfo: BASE_FATHER, motherInfo: { isValid: true } } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<FatherInformation />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

const BASE_MOTHER = {
  motherFirstName: "Maria",
  motherLastName: "Dela Cruz",
  motherPreferredName: "Maria",
  motherBirthDay: new Date("1985-03-01"),
  motherNationality: "Singaporean",
  motherReligion: "Catholic",
  motherMobile: "65111111",
  motherEmail: "maria@example.com",
  motherCompanyName: "Acme Pte Ltd",
  motherPosition: "Manager",
};

describe("mother-information.tsx (VizSchool new)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-new", { familyInfo: { motherInfo: BASE_MOTHER } });

    renderForm(<MotherInformation />, { flow: "vizschool-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Maria");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("vizschool-new", { familyInfo: { motherInfo: BASE_MOTHER, fatherInfo: { isValid: true } } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<MotherInformation />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("advances to the next step when the father is marked not applicable, without needing a separate father confirmation (regression test for optional-tab gating bug)", async () => {
    seedFormState("vizschool-new", {
      familyInfo: { motherInfo: BASE_MOTHER, fatherInfo: { noFatherInfo: true } },
    });
    const user = userEvent.setup();

    renderForm(<MotherInformation />, { flow: "vizschool-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /confirm details|confirm & proceed/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(useEnrolNewStudentTabStateStore.getState().completedTabs).toContain(
        "/vizschool/enrol-student/new/family-info",
      );
    });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("still blocks advancing when the father is neither confirmed nor marked not applicable", async () => {
    seedFormState("vizschool-new", {
      familyInfo: { motherInfo: BASE_MOTHER, fatherInfo: {} },
    });
    const user = userEvent.setup();

    renderForm(<MotherInformation />, { flow: "vizschool-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /confirm details|confirm & proceed/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        "Mother's information confirmed!",
        expect.objectContaining({ description: expect.stringContaining("Father") }),
      );
    });
    expect(useEnrolNewStudentTabStateStore.getState().completedTabs).not.toContain(
      "/vizschool/enrol-student/new/family-info",
    );
  });
});

const BASE_GUARDIAN = {
  guardianFirstName: "Ana",
  guardianLastName: "Santos",
  guardianPreferredName: "Ana",
  guardianBirthDay: new Date("1980-01-01"),
  guardianNationality: "Singaporean",
  guardianReligion: "Catholic",
  guardianMobile: "65333333",
  guardianEmail: "ana@example.com",
  guardianCompanyName: "Acme Pte Ltd",
  guardianPosition: "Director",
};

describe("guardian-information.tsx (VizSchool new)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-new", {
      familyInfo: { guardianInfo: BASE_GUARDIAN, fatherInfo: { isValid: true }, motherInfo: { isValid: true } },
    });

    renderForm(<GuardianInformation />, { flow: "vizschool-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Ana");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("vizschool-new", {
      familyInfo: { guardianInfo: BASE_GUARDIAN, fatherInfo: { isValid: true }, motherInfo: { isValid: true } },
    });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<GuardianInformation />, { flow: "vizschool-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

describe("sibling-information.tsx (VizSchool new)", () => {
  it("does not write to the store on mount when a sibling already exists (wasDirty gate)", async () => {
    seedFormState("vizschool-new", {
      familyInfo: {
        fatherInfo: { isValid: true },
        motherInfo: { isValid: true },
        siblingsInfo: {
          siblings: [
            {
              siblingFullName: "Ana Dela Cruz",
              siblingBirthDay: new Date("2014-01-01"),
              siblingReligion: "Catholic",
              siblingSchoolCompany: "Some School",
              siblingEducationOccupation: "Grade 3",
            },
          ],
        },
      },
    });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<SiblingInformation />, { flow: "vizschool-new" });

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ana Dela Cruz");

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
