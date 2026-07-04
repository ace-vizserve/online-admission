/**
 * Phase 2 — HFSE-IS New Student, Family Info tab (`steps/family-information/`).
 * Covers father/mother/guardian/sibling-information.tsx against their Zod schemas.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FatherInformation from "./father-information";
import MotherInformation from "./mother-information";
import GuardianInformation from "./guardian-information";
import SiblingInformation from "./sibling-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

/**
 * Spies on the real store action a component calls to persist form state. Used to directly
 * prove the "wasDirty gate" — the store must not be written to on mount, only after a real
 * user edit. Reusable pattern for later phases.
 */
function spyOnSetFormState() {
  return vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");
}

const BASE_FATHER = {
  fatherFirstName: "Jose",
  fatherLastName: "Dela Cruz",
  fatherPreferredName: "Jose",
  fatherBirthDay: new Date("1983-02-01"),
  fatherNationality: "Singaporean",
  fatherReligion: "Catholic",
  fatherNric: "S1234568B",
  fatherMobile: "65222222",
  fatherEmail: "jose@example.com",
  fatherCompanyName: "Acme Pte Ltd",
  fatherPosition: "Engineer",
  noFatherInfo: false,
};

const BASE_MOTHER = {
  motherFirstName: "Maria",
  motherLastName: "Dela Cruz",
  motherPreferredName: "Maria",
  motherBirthDay: new Date("1985-03-01"),
  motherNationality: "Singaporean",
  motherReligion: "Catholic",
  motherNric: "S1234567A",
  motherMobile: "65111111",
  motherEmail: "maria@example.com",
  motherCompanyName: "Acme Pte Ltd",
  motherPosition: "Manager",
};

describe("father-information.tsx", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", { familyInfo: { fatherInfo: BASE_FATHER } });

    renderForm(<FatherInformation />, { flow: "hfse-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Jose");
    expect(screen.getByLabelText(/nric\/fin/i)).toHaveValue("S1234568B");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("hfse-new", { familyInfo: { fatherInfo: BASE_FATHER, motherInfo: { isValid: true } } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<FatherInformation />, { flow: "hfse-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

describe("mother-information.tsx", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", { familyInfo: { motherInfo: BASE_MOTHER } });

    renderForm(<MotherInformation />, { flow: "hfse-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Maria");
    expect(screen.getByLabelText(/nric\/fin/i)).toHaveValue("S1234567A");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("hfse-new", { familyInfo: { motherInfo: BASE_MOTHER, fatherInfo: { isValid: true } } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<MotherInformation />, { flow: "hfse-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

const BASE_GUARDIAN = {
  guardianFirstName: "Ana",
  guardianLastName: "Santos",
  guardianPreferredName: "Ana",
  guardianBirthDay: new Date("1980-01-01"),
  guardianNationality: "Singaporean",
  guardianReligion: "Catholic",
  guardianNric: "S1234569C",
  guardianMobile: "65333333",
  guardianEmail: "ana@example.com",
  guardianCompanyName: "Acme Pte Ltd",
  guardianPosition: "Director",
};

describe("guardian-information.tsx", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-new", { familyInfo: { guardianInfo: BASE_GUARDIAN } });

    renderForm(<GuardianInformation />, { flow: "hfse-new" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Ana");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-new", {
      familyInfo: { guardianInfo: BASE_GUARDIAN, fatherInfo: { isValid: true }, motherInfo: { isValid: true } },
    });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<GuardianInformation />, { flow: "hfse-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("repopulates from data cached under the refetch key when re-enabling guardian info (fixed cache-key mismatch)", async () => {
    const { QueryClient } = await import("@tanstack/react-query");
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const email = "parent@example.com";
    queryClient.setQueryData(["new-family-information", email], {
      guardianInfo: { guardianFirstName: "Seeded", noGuardianInfo: false },
    });

    seedFormState("hfse-new", {
      familyInfo: {
        fatherInfo: { isValid: true },
        motherInfo: { isValid: true },
        guardianInfo: { noGuardianInfo: true },
      },
    });

    const user = userEvent.setup();
    const session = { user: { email, user_metadata: { relationship: "mother" } } } as never;
    renderForm(<GuardianInformation />, { flow: "hfse-new", session, queryClient });

    const toggle = screen.getByRole("switch", { name: /guardian's information not available/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Seeded");
    });
  });

  it("does not crash when familyInfo.fatherInfo is entirely absent (fixed missing optional chain)", async () => {
    seedFormState("hfse-new", {
      familyInfo: { guardianInfo: BASE_GUARDIAN, motherInfo: { isValid: true } },
      // fatherInfo intentionally absent
    });

    const user = userEvent.setup();
    renderForm(<GuardianInformation />, { flow: "hfse-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /confirm & proceed/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Ana");
    });
  });
});

describe("sibling-information.tsx", () => {
  it("does not write to the store on mount when a sibling already exists (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-new", {
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

    renderForm(<SiblingInformation />, { flow: "hfse-new" });

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ana Dela Cruz");

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
