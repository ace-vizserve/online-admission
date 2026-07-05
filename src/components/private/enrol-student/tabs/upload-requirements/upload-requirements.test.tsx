/**
 * HFSE-IS Re-enrollment, Upload Requirements tab (`tabs/upload-requirements/`).
 * These tabs used to fetch the student's previous-application documents themselves; that
 * fetch now happens once, centrally, in `useHydrateReEnrollment` (called from the flow's
 * layout) — see src/hooks/use-hydrate-reenrollment.test.tsx for the seeding/no-clobber
 * coverage. These tabs now purely read from the store and no longer import `@/actions/private`.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import StudentUpload from "./student-upload";
import ParentGuardianUpload from "./parent-guardian-upload";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { usePassTypeStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

describe("student-upload.tsx (HFSE old)", () => {
  it("shows a loader until studentUploadRequirements exists locally", () => {
    seedFormState("hfse-old", {});

    renderForm(<StudentUpload />, { flow: "hfse-old" });

    expect(screen.getByText(/fetching documents/i)).toBeInTheDocument();
  });

  it("renders purely from seeded store state, with no fetch of its own", () => {
    seedFormState("hfse-old", {
      uploadRequirements: { studentUploadRequirements: { idPicture: "http://local.pdf", isValid: true } },
    });

    renderForm(<StudentUpload />, { flow: "hfse-old" });

    expect(screen.queryByText(/fetching documents/i)).not.toBeInTheDocument();
  });

  it("renders without crashing when the live passType store's stpApplicationType is set (regression for the independent sync effect)", () => {
    usePassTypeStore.setState({ stpApplicationType: "New Student Pass Application" });
    seedFormState("hfse-old", {
      uploadRequirements: { studentUploadRequirements: { idPicture: "http://local.pdf", isValid: true } },
    });

    expect(() => renderForm(<StudentUpload />, { flow: "hfse-old" })).not.toThrow();
    expect(screen.getAllByRole("button", { name: /save documents/i }).length).toBeGreaterThan(0);
  });

  it("allows marking the student pass as 'To follow' without an incorrect pass-type-mismatch error, even when passType doesn't match the pass on file", async () => {
    // The pass on file (from residency-status.tsx) is "Long Term Visit Pass", but the form's own
    // passType is left unset — this would normally trip the mismatch check, except "pass" is
    // marked toFollowDocs, which must exempt it entirely.
    usePassTypeStore.setState({ passType: "Long Term Visit Pass", stpApplicationType: "" });
    seedFormState("hfse-old", {
      uploadRequirements: {
        studentUploadRequirements: {
          isValid: true,
          passport: "https://files.example.com/passport.pdf",
          passportNumber: "P1234567",
          passportExpiry: new Date("2030-01-01"),
          idPicture: "https://files.example.com/id.png",
          birthCert: "https://files.example.com/birth-cert.pdf",
          toFollowDocs: ["pass"],
          // passType intentionally left unset
        },
      },
    });

    const user = userEvent.setup();
    renderForm(<StudentUpload />, { flow: "hfse-old" });

    const [submitButton] = screen.getAllByRole("button", { name: /save documents/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Student documents saved!", expect.anything());
    });
    expect(toast.error).not.toHaveBeenCalledWith("Pass type mismatch!", expect.anything());
  });
});

describe("parent-guardian-upload.tsx (HFSE old)", () => {
  it("renders purely from seeded store state, with no fetch of its own", () => {
    seedFormState("hfse-old", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", isValid: true },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "hfse-old" });

    expect(screen.queryByText(/fetching documents/i)).not.toBeInTheDocument();
  });

  it("shows a loader until parentGuardianUploadRequirements exists locally", () => {
    seedFormState("hfse-old", {});

    renderForm(<ParentGuardianUpload />, { flow: "hfse-old" });

    expect(screen.getByText(/fetching documents/i)).toBeInTheDocument();
  });

  it("does not crash when studentUploadRequirements is entirely absent (regression for Phase 5's fix)", async () => {
    seedFormState("hfse-old", {
      uploadRequirements: { parentGuardianUploadRequirements: { isValid: true } },
      // studentUploadRequirements intentionally absent
    });

    expect(() => renderForm(<ParentGuardianUpload />, { flow: "hfse-old" })).not.toThrow();
  });
});
