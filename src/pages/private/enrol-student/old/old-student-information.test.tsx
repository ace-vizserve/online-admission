/**
 * HFSE-IS Re-enrollment, Student Info tab.
 * `old-student-information.tsx` used to fetch the student's existing application itself; that
 * fetch now happens once, centrally, in `useHydrateReEnrollment` (called from the flow's
 * layout) — see src/hooks/use-hydrate-reenrollment.test.tsx for the race-condition/no-clobber
 * coverage. This page now purely reads `formState.studentInfo` from the store.
 */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OldStudentInformation from "./old-student-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("old-student-information.tsx", () => {
  it("shows a loader until studentInfo has been seeded into the store", () => {
    seedFormState("hfse-old", {});

    renderForm(<OldStudentInformation />, { flow: "hfse-old" });

    expect(screen.getByText(/fetching family details/i)).toBeInTheDocument();
  });

  it("renders purely from seeded store state, with no fetch of its own", () => {
    seedFormState("hfse-old", {
      studentInfo: {
        studentDetails: { firstName: "Juan", isValid: true },
        addressContact: { isValid: true },
      },
    });

    renderForm(<OldStudentInformation />, { flow: "hfse-old" });

    expect(screen.queryByText(/fetching family details/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Juan");
  });

  it("does not crash when studentInfo exists but addressContact is entirely absent (fixed missing optional chain)", () => {
    seedFormState("hfse-old", {
      studentInfo: { studentDetails: { isValid: true } },
      // addressContact intentionally absent
    });

    expect(() => renderForm(<OldStudentInformation />, { flow: "hfse-old" })).not.toThrow();
  });
});
