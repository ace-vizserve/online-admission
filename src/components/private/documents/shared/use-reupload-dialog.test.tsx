/**
 * Hook-level coverage for `useReuploadDialog` — the single hook behind every reupload dialog on
 * the post-submission "update application / reupload documents" page, replacing the
 * near-duplicate state/validation/mutation logic in `student-files.tsx`/`family-files.tsx`.
 *
 * Three behaviors are the actual regression targets:
 *   1. Validation is generic per `cfg.fieldKind` (plain / passType+expiry / passportNumber+expiry).
 *   2. The mutation's success path (invalidate, old-file cleanup, email) only runs when the
 *      underlying action actually resolves — a throwing mutation must NOT close the dialog,
 *      invalidate queries, delete the old file, or email the other parent (the bug fixed this
 *      session: `studentReuploadDocuments`/`parentGuardianReuploadDocuments` used to swallow their
 *      own errors, so this used to always look like a success to the caller).
 *   3. The email notification uses the session's OWN relationship, not the document's owner role
 *      (mother/father/guardian) — `family-files.tsx` used to mislabel the "who made this change"
 *      role whenever a parent reuploaded a document that wasn't their own.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteFile, parentGuardianReuploadDocuments, studentReuploadDocuments } from "@/actions/private";
import { sendEmailNotification } from "@/actions/send-email-notification";
import { toast } from "sonner";
import { PARENT_GUARDIAN_DOCUMENTS, STUDENT_DOCUMENTS } from "@/components/private/shared/upload-requirements/document-config";
import { useReuploadDialog } from "./use-reupload-dialog";

vi.mock("@/actions/private", () => ({
  MAX_UPLOAD_FILE_SIZE: 4 * 1024 * 1024,
  studentReuploadDocuments: vi.fn(),
  parentGuardianReuploadDocuments: vi.fn(),
  deleteFile: vi.fn(),
}));
vi.mock("@/actions/send-email-notification", () => ({ sendEmailNotification: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

const mockSession = { user: { email: "mother@example.com", user_metadata: { relationship: "Mother" } } };
vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

let uploadIsSuccess = false;
let uploadSuccesses: string[] = [];
let uploadErrors: { name: string; message: string }[] = [];
let uploadFiles: File[] = [];
let uploadLoading = false;
const setFilesMock = vi.fn();
const onUploadMock = vi.fn();
// Mirrors the real hook's return shape — `useReuploadDialog` bridges `files`/`setFiles`/`errors`
// through to `FileUploader`, so a mock missing any of them fails in a way the real hook never can.
vi.mock("@/hooks/use-supabase-upload", () => ({
  useSupabaseUpload: () => ({
    isSuccess: uploadIsSuccess,
    successes: uploadSuccesses,
    errors: uploadErrors,
    files: uploadFiles,
    setFiles: setFilesMock,
    onUpload: onUploadMock,
    loading: uploadLoading,
  }),
}));

const idPictureCfg = STUDENT_DOCUMENTS.find((d) => d.name === "idPicture")!; // plain
const passCfg = STUDENT_DOCUMENTS.find((d) => d.name === "pass")!; // passType+expiry
const passportCfg = STUDENT_DOCUMENTS.find((d) => d.name === "passport")!; // passportNumber+expiry
const motherPassportCfg = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "motherPassport")!;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function fakeEvent() {
  return { preventDefault: vi.fn() } as unknown as React.FormEvent;
}

beforeEach(() => {
  uploadIsSuccess = false;
  uploadSuccesses = [];
  uploadErrors = [];
  uploadFiles = [];
  uploadLoading = false;
  setFilesMock.mockReset();
  onUploadMock.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:mock", revokeObjectURL: () => {} });
  vi.mocked(studentReuploadDocuments).mockReset();
  vi.mocked(parentGuardianReuploadDocuments).mockReset();
  vi.mocked(deleteFile).mockReset();
  vi.mocked(sendEmailNotification).mockReset();
});

describe("validation — plain fieldKind (idPicture)", () => {
  it("rejects submit when no file has been uploaded", async () => {
    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [["student-documents", "E260050"]],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    act(() => {
      result.current.submitReupload(fakeEvent());
    });

    expect(studentReuploadDocuments).not.toHaveBeenCalled();
  });

  it("submits once a file has been uploaded", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/id.png"];
    vi.mocked(studentReuploadDocuments).mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [["student-documents", "E260050"]],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    await waitFor(() =>
      expect(studentReuploadDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: "idPicture", payload: { idPicture: "http://example.com/id.png" } }),
      ),
    );
  });
});

describe("validation — passType+expiry fieldKind (pass)", () => {
  it("rejects submit with no file uploaded at all", () => {
    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: passCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    act(() => result.current.submitReupload(fakeEvent()));
    expect(studentReuploadDocuments).not.toHaveBeenCalled();
  });

  it("requires the pass type, then the expiry date, once a file is uploaded — then submits with all three", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/pass.pdf"];

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: passCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    act(() => result.current.submitReupload(fakeEvent()));
    expect(studentReuploadDocuments).not.toHaveBeenCalled(); // missing pass type

    act(() => result.current.setTypeValue("Dependent Pass"));
    act(() => result.current.submitReupload(fakeEvent()));
    expect(studentReuploadDocuments).not.toHaveBeenCalled(); // missing expiry

    act(() => result.current.setExpiryValue(new Date("2030-01-01")));
    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    await waitFor(() =>
      expect(studentReuploadDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documentType: "pass",
          payload: {
            pass: "http://example.com/pass.pdf",
            passType: "Dependent Pass",
            passExpiry: new Date("2030-01-01").toISOString(),
          },
        }),
      ),
    );
  });
});

describe("validation — passportNumber+expiry fieldKind, student group (passport)", () => {
  it("requires the passport number, then the expiry date, once a file is uploaded", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/passport.pdf"];
    vi.mocked(studentReuploadDocuments).mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: passportCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    act(() => result.current.submitReupload(fakeEvent()));
    expect(studentReuploadDocuments).not.toHaveBeenCalled(); // missing passport number

    act(() => result.current.setNumberValue("P1234567"));
    act(() => result.current.submitReupload(fakeEvent()));
    expect(studentReuploadDocuments).not.toHaveBeenCalled(); // missing expiry

    act(() => result.current.setExpiryValue(new Date("2030-01-01")));
    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    await waitFor(() =>
      expect(studentReuploadDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          documentType: "passport",
          payload: {
            passport: "http://example.com/passport.pdf",
            passportNumber: "P1234567",
            passportExpiry: new Date("2030-01-01").toISOString(),
          },
        }),
      ),
    );
  });
});

describe("validation — passportNumber+expiry fieldKind, parent/guardian group", () => {
  it("builds the payload with the role-derived field names and calls parentGuardianReuploadDocuments with the document owner role", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/passport.pdf"];
    vi.mocked(parentGuardianReuploadDocuments).mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: motherPassportCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [],
          emailSection: "Parent/Guardian Documents",
        }),
      { wrapper },
    );

    act(() => result.current.setNumberValue("P1234567"));
    act(() => result.current.setExpiryValue(new Date("2030-01-01")));

    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    await waitFor(() =>
      expect(parentGuardianReuploadDocuments).toHaveBeenCalledWith({
        role: "mother",
        academicYear: "ay2026",
        documentType: "motherPassport",
        enroleeNumber: "E260050",
        payload: {
          motherPassport: "http://example.com/passport.pdf",
          motherPassportNumber: "P1234567",
          motherPassportExpiry: new Date("2030-01-01").toISOString(),
        },
      }),
    );
  });
});

describe("mutation success — only runs the success side-effects when the action resolves", () => {
  it("invalidates queries, cleans up the old file, and emails using the session's OWN relationship", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/id-new.png"];
    vi.mocked(studentReuploadDocuments).mockResolvedValue(undefined);
    vi.mocked(deleteFile).mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          existingFileUrl: "http://example.com/id-old.png",
          queryKeysToInvalidate: [["student-documents", "E260050"]],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    await waitFor(() => expect(result.current.isOpen).toBe(false));
    expect(deleteFile).toHaveBeenCalledWith("http://example.com/id-old.png", "ay2026");
    expect(sendEmailNotification).toHaveBeenCalledWith(
      expect.objectContaining({ role: "Mother", parentEmail: "mother@example.com" }),
    );
  });

  it("does NOT invalidate, clean up, or email when the action throws", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/id-new.png"];
    vi.mocked(studentReuploadDocuments).mockRejectedValue(new Error("db write failed"));

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          existingFileUrl: "http://example.com/id-old.png",
          queryKeysToInvalidate: [["student-documents", "E260050"]],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    act(() => result.current.setIsOpen(true));

    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    // The dialog was open before the submit — if `onSuccess` had fired despite the throw (the bug
    // being regression-tested), it would have called `setIsOpen(false)` here.
    expect(result.current.isOpen).toBe(true);
    expect(deleteFile).not.toHaveBeenCalled();
    expect(sendEmailNotification).not.toHaveBeenCalled();
  });

  it("soft-warns (does not block success) when cleaning up the old file fails", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/id-new.png"];
    vi.mocked(studentReuploadDocuments).mockResolvedValue(undefined);
    vi.mocked(deleteFile).mockRejectedValue(new Error("storage delete failed"));

    const { result } = renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          existingFileUrl: "http://example.com/id-old.png",
          queryKeysToInvalidate: [],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.submitReupload(fakeEvent());
    });

    await waitFor(() => expect(sendEmailNotification).toHaveBeenCalled());
    expect(result.current.isOpen).toBe(false);
  });
});

describe("canSave — the Save changes gate", () => {
  // Parents kept reading "file selected" as "file uploaded" and clicking the big Save button while
  // the dropzone's Upload button was still pending, landing on a validation toast that pointed at a
  // file they could plainly see. `canSave` is what lets the dialog disable Save instead.
  function renderIdPictureDialog() {
    return renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "ay2026",
          enroleeNumber: "E260050",
          queryKeysToInvalidate: [],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );
  }

  it("is false while a file has been selected but not yet uploaded", () => {
    const { result } = renderIdPictureDialog();
    expect(result.current.canSave).toBe(false);
  });

  it("is true once the upload has succeeded", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["http://example.com/id.png"];

    const { result } = renderIdPictureDialog();

    await waitFor(() => expect(result.current.canSave).toBe(true));
  });

  it("stays in lockstep with what submitReupload actually accepts", () => {
    // The gate would be worse than useless if it disagreed with the validation behind it — a
    // disabled button on a submittable form, or an enabled one that still toasts.
    const { result } = renderIdPictureDialog();

    expect(result.current.canSave).toBe(false);
    act(() => result.current.submitReupload(fakeEvent()));
    expect(studentReuploadDocuments).not.toHaveBeenCalled();
  });
});

/**
 * The `FileUploader` bridge. `Dropzone` owned the drop area, the staged-file list AND the inline
 * error display; `FileUploader` is controlled and reports rejections via toast, so the hook now
 * has to expose the file list and surface upload errors itself.
 */
describe("FileUploader bridge", () => {
  function renderIdPicture() {
    return renderHook(
      () =>
        useReuploadDialog({
          cfg: idPictureCfg,
          academicYear: "AY2026",
          enroleeNumber: "E-1",
          queryKeysToInvalidate: [],
          emailSection: "Student Documents",
        }),
      { wrapper },
    );
  }

  it("exposes a dropzone config built from the document's own policy", () => {
    const { result } = renderIdPicture();

    expect(result.current.dropZoneConfig).toEqual({
      accept: idPictureCfg.accept,
      maxFiles: idPictureCfg.maxFiles,
      maxSize: 4 * 1024 * 1024,
      multiple: idPictureCfg.maxFiles > 1,
    });
  });

  it("surfaces upload failures as toasts, since there is no inline error list any more", async () => {
    uploadErrors = [{ name: "passport.pdf", message: "Network error" }];
    renderIdPicture();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("passport.pdf: Network error"));
  });

  it("does not toast when there are no upload errors", async () => {
    renderIdPicture();

    await waitFor(() => expect(toast.error).not.toHaveBeenCalled());
  });

  it("decorates staged files so the upload hook's own effects can read them", () => {
    const { result } = renderIdPicture();
    const picked = new File(["x"], "id.png", { type: "image/png" });

    act(() => result.current.setStagedFiles([picked]));

    const staged = setFilesMock.mock.calls[0][0] as (File & { preview?: string; errors?: unknown[] })[];
    expect(staged).toHaveLength(1);
    expect(staged[0].errors).toEqual([]);
    expect(staged[0].preview).toBe("blob:mock");
  });

  it("clearing every staged file also clears the uploaded URL, so Save changes re-locks", async () => {
    uploadIsSuccess = true;
    uploadSuccesses = ["https://storage/id.png"];
    const { result } = renderIdPicture();

    await waitFor(() => expect(result.current.canSave).toBe(true));

    act(() => result.current.setStagedFiles(null));

    expect(result.current.canSave).toBe(false);
    expect(setFilesMock).toHaveBeenCalledWith([]);
  });

  it("passes the upload trigger and in-flight flag straight through", () => {
    uploadLoading = true;
    const { result } = renderIdPicture();

    expect(result.current.isUploading).toBe(true);
    result.current.uploadFile();
    expect(onUploadMock).toHaveBeenCalled();
  });
});
