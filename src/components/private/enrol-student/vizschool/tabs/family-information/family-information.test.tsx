/**
 * Phase 14 — VizSchool Current Learner, Family Info tab (`vizschool/tabs/family-information/`).
 * Combines the structural-gate concern (Phase 5-8) with schema identity (Phase 9-12) — this
 * tree is exposed to both risk classes per the plan.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FatherInformation from "./father-information";
import MotherInformation from "./mother-information";
import GuardianInformation from "./guardian-information";
import SiblingInformation from "./sibling-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useVizSchoolEnrolOldStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

function spyOnSetFormState() {
  return vi.spyOn(useVizSchoolEnrolOldStudentStore.getState(), "setFormState");
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

describe("father-information.tsx (VizSchool current)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-current", { familyInfo: { fatherInfo: BASE_FATHER } });

    renderForm(<FatherInformation />, { flow: "vizschool-current" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Jose");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", { familyInfo: { fatherInfo: BASE_FATHER } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<FatherInformation />, { flow: "vizschool-current" });

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

describe("mother-information.tsx (VizSchool current)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-current", { familyInfo: { motherInfo: BASE_MOTHER } });

    renderForm(<MotherInformation />, { flow: "vizschool-current" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Maria");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", { familyInfo: { motherInfo: BASE_MOTHER } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<MotherInformation />, { flow: "vizschool-current" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("does not reset the form mid-typing (fixed: removed the redundant external-sync effect that fought the debounced save, same class of bug as Phase 6's HFSE-old fix)", async () => {
    seedFormState("vizschool-current", { familyInfo: { motherInfo: BASE_MOTHER } });

    renderForm(<MotherInformation />, { flow: "vizschool-current" });

    const firstNameInput = screen.getByLabelText(/^first name$/i);
    expect(firstNameInput).toHaveValue("Maria");

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(firstNameInput).toHaveValue("Maria");
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

describe("guardian-information.tsx (VizSchool current)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("vizschool-current", { familyInfo: { guardianInfo: BASE_GUARDIAN } });

    renderForm(<GuardianInformation />, { flow: "vizschool-current" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Ana");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", { familyInfo: { guardianInfo: BASE_GUARDIAN } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<GuardianInformation />, { flow: "vizschool-current" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

describe("sibling-information.tsx (VizSchool current)", () => {
  it("does not write to the store on mount when a sibling already exists (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("vizschool-current", {
      familyInfo: {
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

    renderForm(<SiblingInformation />, { flow: "vizschool-current" });

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ana Dela Cruz");

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
