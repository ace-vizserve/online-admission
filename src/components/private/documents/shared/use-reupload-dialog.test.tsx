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
vi.mock("@/hooks/use-supabase-upload", () => ({
  useSupabaseUpload: () => ({ isSuccess: uploadIsSuccess, successes: uploadSuccesses }),
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
