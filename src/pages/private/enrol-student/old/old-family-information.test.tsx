/**
 * HFSE-IS Re-enrollment, Family Info tab.
 * `old-family-information.tsx` used to fetch the student's existing family info itself; that
 * fetch now happens once, centrally, in `useHydrateReEnrollment` (called from the flow's
 * layout) — see src/hooks/use-hydrate-reenrollment.test.tsx for the seeding/no-clobber
 * coverage. This page now purely reads `formState.familyInfo` from the store.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OldFamilyInformation from "./old-family-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("old-family-information.tsx", () => {
  it("shows a loader until familyInfo has been seeded into the store", () => {
    seedFormState("hfse-old", {});

    renderForm(<OldFamilyInformation />, { flow: "hfse-old" });

    expect(screen.getByText(/fetching family details/i)).toBeInTheDocument();
  });

  it("renders purely from seeded store state, with no fetch of its own", () => {
    seedFormState("hfse-old", {
      familyInfo: {
        motherInfo: { motherFirstName: "Maria", isValid: true },
        fatherInfo: { fatherFirstName: "Jose", noFatherInfo: false, isValid: true },
        siblingsInfo: { siblings: [] },
      },
    });

    renderForm(<OldFamilyInformation />, { flow: "hfse-old" });

    expect(screen.queryByText(/fetching family details/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Maria");
  });
});
