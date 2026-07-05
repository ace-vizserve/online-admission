/**
 * Phase 16 — VizSchool Current Learner, Upload Requirements tab (`vizschool/tabs/upload-requirements/`).
 * The component-level "missing `?.`" bugs in these two files were already found and fixed in
 * Phase 5 (as part of the cross-tree grep for the same pattern), and Phase 8 already verified
 * the identical fetch-guard pattern for the HFSE-old counterpart. This phase verifies the same
 * guard holds here.
 */
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentUpload from "./student-upload";
import ParentGuardianUpload from "./parent-guardian-upload";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getPreviousStudentDocuments: vi.fn().mockResolvedValue({ studentUploadRequirements: { idPicture: "http://old.pdf" } }),
  getPreviousParentGuardianDocuments: vi
    .fn()
    .mockResolvedValue({ parentGuardianUploadRequirements: { motherPassport: "http://old.pdf" } }),
}));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("student-upload.tsx (VizSchool current)", () => {
  it("does not overwrite locally-saved documents with the fetched previous-application data", async () => {
    seedFormState("vizschool-current", {
      uploadRequirements: { studentUploadRequirements: { idPicture: "http://local.pdf", isValid: true } },
    });

    renderForm(<StudentUpload />, { flow: "vizschool-current" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching documents/i)).not.toBeInTheDocument();
    });

    const { useVizSchoolEnrolOldStudentStore } = await import("@/zustand-store");
    expect(
      useVizSchoolEnrolOldStudentStore.getState().formState.uploadRequirements?.studentUploadRequirements?.idPicture,
    ).toBe("http://local.pdf");
  });

  it("shows a loader until studentUploadRequirements exists locally", () => {
    seedFormState("vizschool-current", {});

    renderForm(<StudentUpload />, { flow: "vizschool-current" });

    expect(screen.getByText(/fetching documents/i)).toBeInTheDocument();
  });
});

describe("parent-guardian-upload.tsx (VizSchool current)", () => {
  it("does not overwrite locally-saved documents with the fetched previous-application data", async () => {
    seedFormState("vizschool-current", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", isValid: true },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "vizschool-current" });

    await waitFor(() => {
      expect(screen.queryByText(/fetching documents/i)).not.toBeInTheDocument();
    });

    const { useVizSchoolEnrolOldStudentStore } = await import("@/zustand-store");
    expect(
      useVizSchoolEnrolOldStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.motherPassport,
    ).toBe("http://local.pdf");
  });
});
