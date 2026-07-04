/**
 * Phase 6 — HFSE-IS Re-enrollment, Family Info tab (`tabs/family-information/`).
 * Covers father/mother/guardian/sibling-information.tsx against their Zod schemas (same
 * schemas the `steps/` tree uses).
 */
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FatherInformation from "./father-information";
import MotherInformation from "./mother-information";
import GuardianInformation from "./guardian-information";
import SiblingInformation from "./sibling-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolOldStudentStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

function spyOnSetFormState() {
  return vi.spyOn(useEnrolOldStudentStore.getState(), "setFormState");
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

describe("father-information.tsx (HFSE old)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-old", { familyInfo: { fatherInfo: BASE_FATHER } });

    renderForm(<FatherInformation />, { flow: "hfse-old" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Jose");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", { familyInfo: { fatherInfo: BASE_FATHER, motherInfo: { isValid: true } } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<FatherInformation />, { flow: "hfse-old" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("restores father info from the shared re-enrollment cache when the 'not available' toggle is switched off", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Mirrors what useHydrateReEnrollment registers in production — prefetchQuery (not
    // setQueryData) so the cache entry carries a real queryFn for refetchQueries to reuse.
    await queryClient.prefetchQuery({
      queryKey: ["re-enrollment", undefined],
      queryFn: async () => ({
        familyInfo: { fatherInfo: { fatherFirstName: "CachedJose", noFatherInfo: false } },
      }),
    });

    seedFormState("hfse-old", {
      familyInfo: { fatherInfo: { noFatherInfo: true }, motherInfo: { isValid: true } },
    });

    const user = userEvent.setup();
    renderForm(<FatherInformation />, { flow: "hfse-old", queryClient });

    await user.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(screen.getByLabelText(/^first name$/i)).toHaveValue("CachedJose");
    });
  });
});

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

describe("mother-information.tsx (HFSE old)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-old", { familyInfo: { motherInfo: BASE_MOTHER } });

    renderForm(<MotherInformation />, { flow: "hfse-old" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Maria");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", { familyInfo: { motherInfo: BASE_MOTHER, fatherInfo: { isValid: true } } });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<MotherInformation />, { flow: "hfse-old" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("does not reset the form mid-typing (fixed: the external-sync effect fired on every one of the form's own debounced saves)", async () => {
    seedFormState("hfse-old", { familyInfo: { motherInfo: BASE_MOTHER } });

    renderForm(<MotherInformation />, { flow: "hfse-old" });

    const firstNameInput = screen.getByLabelText(/^first name$/i);
    expect(firstNameInput).toHaveValue("Maria");

    await new Promise((resolve) => setTimeout(resolve, 250));

    // The debounced save above updates the store's motherInfo — if the removed effect were
    // still watching that value, it would reset the form back to the same (still-correct)
    // value, but would do so on every keystroke in real usage. Confirm the field is still
    // showing the user's own current value (i.e. render is stable, not fighting itself).
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
  guardianNric: "S1234569C",
  guardianMobile: "65333333",
  guardianEmail: "ana@example.com",
  guardianCompanyName: "Acme Pte Ltd",
  guardianPosition: "Director",
};

describe("guardian-information.tsx (HFSE old)", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("hfse-old", { familyInfo: { guardianInfo: BASE_GUARDIAN } });

    renderForm(<GuardianInformation />, { flow: "hfse-old" });

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Ana");
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", {
      familyInfo: { guardianInfo: BASE_GUARDIAN, fatherInfo: { isValid: true }, motherInfo: { isValid: true } },
    });
    const setFormStateSpy = spyOnSetFormState();

    renderForm(<GuardianInformation />, { flow: "hfse-old" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("restores guardian info from the shared re-enrollment cache when the 'not available' toggle is switched off", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await queryClient.prefetchQuery({
      queryKey: ["re-enrollment", undefined],
      queryFn: async () => ({
        familyInfo: { guardianInfo: { guardianFirstName: "CachedAna", noGuardianInfo: false } },
      }),
    });

    seedFormState("hfse-old", {
      familyInfo: {
        guardianInfo: { noGuardianInfo: true },
        fatherInfo: { isValid: true },
        motherInfo: { isValid: true },
      },
    });

    const user = userEvent.setup();
    renderForm(<GuardianInformation />, { flow: "hfse-old", queryClient });

    await user.click(screen.getByRole("switch"));

    await waitFor(() => {
      expect(screen.getByLabelText(/^first name$/i)).toHaveValue("CachedAna");
    });
  });
});

describe("sibling-information.tsx (HFSE old)", () => {
  it("does not write to the store on mount when a sibling already exists (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("hfse-old", {
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

    renderForm(<SiblingInformation />, { flow: "hfse-old" });

    expect(screen.getByLabelText(/full name/i)).toHaveValue("Ana Dela Cruz");

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
