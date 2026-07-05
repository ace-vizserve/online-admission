/**
 * Phase 4 — Upload Requirements tab, `steps/upload-requirements/` (HFSE new, VizSchool new,
 * Open House share this directory name/structure). Covers `student-upload.tsx` +
 * `parent-guardian-upload.tsx` against `studentUploadRequirementsSchema` /
 * `parentGuardianUploadRequirementsSchema`.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import StudentUpload from "./student-upload";
import ParentGuardianUpload from "./parent-guardian-upload";
import OpenHouseStudentUpload from "@/components/private/open-house/steps/upload-requirements/student-upload";
import OpenHouseParentGuardianUpload from "@/components/private/open-house/steps/upload-requirements/parent-guardian-upload";
import VizSchoolStudentUpload from "@/components/private/enrol-student/vizschool/steps/upload-requirements/student-upload";
import VizSchoolParentGuardianUpload from "@/components/private/enrol-student/vizschool/steps/upload-requirements/parent-guardian-upload";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useEnrolNewStudentStore, useOpenHouseStore, usePassTypeStore, useVizSchoolEnrolNewStudentStore } from "@/zustand-store";
import { getPreviousParentGuardianDocuments } from "@/actions/private";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/private", () => ({
  getPreviousParentGuardianDocuments: vi.fn().mockResolvedValue({ parentGuardianUploadRequirements: {} }),
}));

const FUTURE_DATE = new Date("2099-01-01");

/** `getPreviousParentGuardianDocuments`'s inferred return type is a union across its many
 * early-return branches (empty object, undefined, or the full shape) — too awkward for a test
 * fixture to satisfy structurally. Matches the `as never` idiom already used for this same
 * situation in use-document-upload-dialog.test.tsx. */
function mockCarriedDocs(parentGuardianUploadRequirements: Record<string, unknown>) {
  vi.mocked(getPreviousParentGuardianDocuments).mockResolvedValueOnce({ parentGuardianUploadRequirements } as never);
}

beforeEach(() => {
  resetEnrolmentStores();
  usePassTypeStore.getState().clearState();
  vi.mocked(getPreviousParentGuardianDocuments).mockReset();
  vi.mocked(getPreviousParentGuardianDocuments).mockResolvedValue({ parentGuardianUploadRequirements: {} } as never);
});

const VALID_STUDENT_DOCS = {
  idPicture: "http://example.com/id.pdf",
  birthCert: "http://example.com/birth.pdf",
  passport: "http://example.com/passport.pdf",
  passportNumber: "P1234567",
  passportExpiry: new Date("2030-01-01"),
  pass: "http://example.com/pass.pdf",
  passType: "Dependent Pass",
  passExpiry: new Date("2030-01-01"),
  toFollowDocs: [],
};

describe("student-upload.tsx (HFSE new)", () => {
  it("does not crash on submit when uploadRequirements.parentGuardianUploadRequirements is entirely absent (fixed missing optional chain)", async () => {
    usePassTypeStore.getState().setPassType("Dependent Pass");
    seedFormState("hfse-new", {
      uploadRequirements: { studentUploadRequirements: VALID_STUDENT_DOCS },
      // parentGuardianUploadRequirements intentionally absent — this is the normal wizard
      // order, since Student Upload is submitted before Parent/Guardian Upload.
    });
    const setFormStateSpy = vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");

    const user = userEvent.setup();
    renderForm(<StudentUpload />, { flow: "hfse-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /save documents/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(setFormStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadRequirements: expect.objectContaining({
            studentUploadRequirements: expect.objectContaining({ isValid: true }),
          }),
        }),
      );
    });
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("hfse-new", { uploadRequirements: { studentUploadRequirements: VALID_STUDENT_DOCS } });
    const setFormStateSpy = vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<StudentUpload />, { flow: "hfse-new" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("toggling 'Document to follow' on one document does not wipe another already-uploaded student document or the parent/guardian slice (shared-upload-architecture merge-preserving fix)", async () => {
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { birthCert: "http://example.com/birth.pdf" },
        parentGuardianUploadRequirements: { motherPassport: "http://example.com/mother-passport.pdf" },
      },
    });
    const setFormStateSpy = vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");

    const user = userEvent.setup();
    renderForm(<StudentUpload />, { flow: "hfse-new" });

    // ID Picture is the first document rendered and is not yet uploaded — its trigger reads
    // "Upload" (Birth Certificate is already uploaded, so its trigger reads "View" instead).
    const [idPictureButton] = screen.getAllByRole("button", { name: /^upload$/i });
    await user.click(idPictureButton);

    const toFollowSwitch = await screen.findByRole("switch");
    await user.click(toFollowSwitch);

    await waitFor(() => {
      expect(setFormStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadRequirements: expect.objectContaining({
            studentUploadRequirements: expect.objectContaining({
              birthCert: "http://example.com/birth.pdf",
              toFollowDocs: ["idPicture"],
            }),
            parentGuardianUploadRequirements: expect.objectContaining({
              motherPassport: "http://example.com/mother-passport.pdf",
            }),
          }),
        }),
      );
    });
  });
});

describe("parent-guardian-upload.tsx (HFSE new)", () => {
  it("shows the Father/Guardian sections only when hasFatherInfo/hasGuardianInfo are true", async () => {
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: true, hasGuardianInfo: false },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "hfse-new" });

    await waitFor(() => {
      expect(screen.getByText(/father documents/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/guardian documents/i)).not.toBeInTheDocument();
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });
    const setFormStateSpy = vi.spyOn(useEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<ParentGuardianUpload />, { flow: "hfse-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("carries over a returning parent's prior documents and displays them, without overriding this enrollment's hasFatherInfo/hasGuardianInfo", async () => {
    mockCarriedDocs({
      motherPassport: "http://old.pdf",
      motherPassportExpiry: FUTURE_DATE,
      hasFatherInfo: true,
      hasGuardianInfo: true,
    });
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "hfse-new" });

    await waitFor(() => {
      expect(
        useEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
          ?.motherPassport,
      ).toBe("http://old.pdf");
    });

    expect(screen.getAllByRole("button", { name: /^view$/i }).length).toBeGreaterThan(0);
    // The current enrollment's own family-info choices must win over the fetched ones.
    expect(
      useEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.hasFatherInfo,
    ).toBe(false);
    expect(screen.queryByText(/father documents/i)).not.toBeInTheDocument();
  });

  it("leaves every document row empty when the parent has no prior documents", async () => {
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "hfse-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });

    expect(screen.queryAllByRole("button", { name: /^view$/i })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /^upload$/i }).length).toBeGreaterThan(0);
  });

  it("does not overwrite an already-completed step with the fetched previous-application data", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", isValid: true },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "hfse-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(
      useEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.motherPassport,
    ).toBe("http://local.pdf");
  });

  it("does not overwrite a document the user already uploaded with the fetched previous-application data", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });
    seedFormState("hfse-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", hasFatherInfo: false },
      },
    });

    renderForm(<ParentGuardianUpload />, { flow: "hfse-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(
      useEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.motherPassport,
    ).toBe("http://local.pdf");
  });
});

describe("student-upload.tsx (Open House)", () => {
  it("does not crash on submit when uploadRequirements.parentGuardianUploadRequirements is entirely absent (fixed missing optional chain)", async () => {
    usePassTypeStore.getState().setPassType("Dependent Pass");
    seedFormState("open-house", {
      uploadRequirements: { studentUploadRequirements: { ...VALID_STUDENT_DOCS, isOpenHouseApplication: true } },
    });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    const user = userEvent.setup();
    renderForm(<OpenHouseStudentUpload />, { flow: "open-house" });

    const [submitButton] = screen.getAllByRole("button", { name: /save documents/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(setFormStateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadRequirements: expect.objectContaining({
            studentUploadRequirements: expect.objectContaining({ isValid: true }),
          }),
        }),
      );
    });
  });

  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("open-house", {
      uploadRequirements: { studentUploadRequirements: { ...VALID_STUDENT_DOCS, isOpenHouseApplication: true } },
    });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<OpenHouseStudentUpload />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

describe("parent-guardian-upload.tsx (Open House)", () => {
  it("does not write to the store on mount (wasDirty gate — fixed: was previously unconditional)", async () => {
    seedFormState("open-house", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<OpenHouseParentGuardianUpload />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});

describe("student-upload.tsx (VizSchool new)", () => {
  it("does not crash on submit when uploadRequirements.parentGuardianUploadRequirements is entirely absent (fixed missing optional chain)", async () => {
    seedFormState("vizschool-new", {
      uploadRequirements: { studentUploadRequirements: VALID_STUDENT_DOCS },
    });

    const user = userEvent.setup();
    renderForm(<VizSchoolStudentUpload />, { flow: "vizschool-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /save documents/i });

    await expect(user.click(submitButton)).resolves.not.toThrow();
  });
});

describe("parent-guardian-upload.tsx (VizSchool new)", () => {
  it("carries over a returning parent's prior documents and displays them, without overriding this enrollment's hasFatherInfo/hasGuardianInfo", async () => {
    mockCarriedDocs({
      motherPassport: "http://old.pdf",
      motherPassportExpiry: FUTURE_DATE,
      hasFatherInfo: true,
      hasGuardianInfo: true,
    });
    seedFormState("vizschool-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });

    renderForm(<VizSchoolParentGuardianUpload />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(
        useVizSchoolEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
          ?.motherPassport,
      ).toBe("http://old.pdf");
    });

    expect(screen.getAllByRole("button", { name: /^view$/i }).length).toBeGreaterThan(0);
    expect(
      useVizSchoolEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.hasFatherInfo,
    ).toBe(false);
    expect(screen.queryByText(/father documents/i)).not.toBeInTheDocument();
  });

  it("leaves every document row empty when the parent has no prior documents", async () => {
    seedFormState("vizschool-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });

    renderForm(<VizSchoolParentGuardianUpload />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });

    expect(screen.queryAllByRole("button", { name: /^view$/i })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /^upload$/i }).length).toBeGreaterThan(0);
  });

  it("does not overwrite an already-completed step with the fetched previous-application data", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });
    seedFormState("vizschool-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", isValid: true },
      },
    });

    renderForm(<VizSchoolParentGuardianUpload />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(
      useVizSchoolEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.motherPassport,
    ).toBe("http://local.pdf");
  });

  it("does not overwrite a document the user already uploaded with the fetched previous-application data", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });
    seedFormState("vizschool-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", hasFatherInfo: false },
      },
    });

    renderForm(<VizSchoolParentGuardianUpload />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(
      useVizSchoolEnrolNewStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements
        ?.motherPassport,
    ).toBe("http://local.pdf");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("vizschool-new", {
      uploadRequirements: {
        studentUploadRequirements: { isValid: true },
        parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
      },
    });
    const setFormStateSpy = vi.spyOn(useVizSchoolEnrolNewStudentStore.getState(), "setFormState");

    renderForm(<VizSchoolParentGuardianUpload />, { flow: "vizschool-new" });

    await waitFor(() => {
      expect(screen.getByText(/mother documents/i)).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });
});
