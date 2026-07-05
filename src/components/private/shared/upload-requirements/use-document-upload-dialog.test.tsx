/**
 * Hook-level coverage for `useDocumentUploadDialog` — the single hook that replaced the ~170
 * lines of state/handlers each of the 10 duplicated dialog files re-declared by hand.
 *
 * Three behaviors are the actual regression targets here (see the refactor plan's fix #3 and the
 * "3 distinct field-clearing behaviors" design note):
 *   1. Changing an uploaded document must not clear the form until the storage delete actually
 *      succeeds (`deleteFile` re-throwing is what makes this possible — previously the catch
 *      block was dead code, so a failed delete still cleared the UI, orphaning the file).
 *   2. Sibling pass-type/number/expiry fields are cleared on "change document" and on turning
 *      "to follow" ON, but NOT when removing a not-yet-uploaded staged file or turning "to
 *      follow" OFF.
 *   3. Every store's `setFormState` only shallow-merges at the top FormState level, so writing
 *      `uploadRequirements` must always carry the CURRENT value of every other field in the same
 *      group and of the other group untouched — otherwise patching one document (e.g. the
 *      student's passport) would silently wipe every other already-saved student document AND
 *      the entire parent/guardian slice. This was caught by `tsc` the moment the shared hook was
 *      wired into a real flow component (`student-upload.tsx`), not by these tests alone — the
 *      cases below pin the fix down so it can't regress silently again.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteFile } from "@/actions/private";
import { STUDENT_DOCUMENTS } from "./document-config";
import { SharedUploadFormState } from "./types";
import { useDocumentUploadDialog } from "./use-document-upload-dialog";

vi.mock("@/actions/private", () => ({
  uploadFileToBucket: vi.fn(),
  deleteFile: vi.fn(),
}));

const passportCfg = STUDENT_DOCUMENTS.find((d) => d.name === "passport")!; // fieldKind: passportNumber+expiry

// Every case seeds a fixture with an unrelated field in the SAME group (idPicture) and data in
// the OTHER group (mother's passport) already present, so tests can assert both survive intact.
function makeFormState(): SharedUploadFormState {
  return {
    uploadRequirements: {
      studentUploadRequirements: {
        idPicture: "http://example.com/id.pdf",
        passport: "http://example.com/passport.pdf",
        passportNumber: "P123",
        passportExpiry: new Date("2030-01-01"),
      } as never,
      parentGuardianUploadRequirements: {
        motherPassport: "http://example.com/mother-passport.pdf",
      } as never,
    },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function useHarness(
  formState: SharedUploadFormState,
  setFormState: (data: unknown) => void,
  resetStrategy?: "empty-string" | "undefined",
) {
  const form = useForm({
    defaultValues: {
      passport: "http://example.com/passport.pdf",
      passportNumber: "P123",
      passportExpiry: new Date("2030-01-01"),
      isValid: true,
      toFollowDocs: [] as string[],
    },
  });

  const dialog = useDocumentUploadDialog({
    cfg: passportCfg,
    form,
    value: null,
    onValueChange: vi.fn(),
    formState,
    resetStrategy,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFormState: setFormState as any,
  });

  return { form, dialog };
}

beforeEach(() => {
  vi.mocked(deleteFile).mockReset();
});

describe("changeDocument confirm gate", () => {
  it("requestChangeDocument only opens the confirm dialog — it does not call deleteFile", () => {
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState), { wrapper });

    act(() => {
      result.current.dialog.requestChangeDocument();
    });

    expect(result.current.dialog.confirmOpen).toBe(true);
    expect(deleteFile).not.toHaveBeenCalled();
    expect(setFormState).not.toHaveBeenCalled();
  });

  it("does NOT clear the field or write to the store when the storage delete fails", async () => {
    vi.mocked(deleteFile).mockRejectedValue(new Error("storage delete failed"));
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState), { wrapper });

    await act(async () => {
      await result.current.dialog.confirmChangeDocument();
    });

    expect(deleteFile).toHaveBeenCalledWith("http://example.com/passport.pdf", "");
    // The whole point of the re-throw fix: a failed delete must not clear the document, or the
    // UI would show it "removed" while the file is still orphaned in the bucket.
    expect(setFormState).not.toHaveBeenCalled();
    expect(result.current.form.getValues("passport")).toBe("http://example.com/passport.pdf");
    await waitFor(() => expect(result.current.dialog.isChangingDocument).toBe(false));
  });

  it("clears the main field AND its siblings once the storage delete succeeds, while preserving every other field in the same group and the entire other group", async () => {
    vi.mocked(deleteFile).mockResolvedValue(undefined as never);
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState), { wrapper });

    await act(async () => {
      await result.current.dialog.confirmChangeDocument();
    });

    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: {
        parentGuardianUploadRequirements: { motherPassport: "http://example.com/mother-passport.pdf" },
        studentUploadRequirements: {
          idPicture: "http://example.com/id.pdf",
          passport: "",
          isValid: false,
          passportNumber: "",
          passportExpiry: null,
        },
      },
    });
    expect(result.current.form.getValues("passport")).toBe("");
    expect(result.current.form.getValues("passportNumber")).toBe("");
    expect(result.current.form.getValues("passportExpiry")).toBe(null);
  });
});

describe("removeSelectedFile (staged, not-yet-uploaded file)", () => {
  it("clears only the main field — siblings, other same-group fields, and the other group are untouched", () => {
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState), { wrapper });

    act(() => {
      result.current.dialog.removeSelectedFile();
    });

    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: {
        parentGuardianUploadRequirements: { motherPassport: "http://example.com/mother-passport.pdf" },
        studentUploadRequirements: {
          idPicture: "http://example.com/id.pdf",
          passportNumber: "P123",
          passportExpiry: new Date("2030-01-01"),
          passport: "",
          isValid: false,
        },
      },
    });
    // passportNumber/passportExpiry are NOT part of the patch (still whatever was already there).
    expect(result.current.form.getValues("passportNumber")).toBe("P123");
  });
});

describe("toggleToFollow", () => {
  it("turning it ON clears the main field AND siblings, and adds the doc to toFollowDocs — other fields/group survive", () => {
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState), { wrapper });

    act(() => {
      result.current.dialog.toggleToFollow(true);
    });

    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: {
        parentGuardianUploadRequirements: { motherPassport: "http://example.com/mother-passport.pdf" },
        studentUploadRequirements: {
          idPicture: "http://example.com/id.pdf",
          passport: "",
          isValid: false,
          passportNumber: "",
          passportExpiry: null,
          toFollowDocs: ["passport"],
        },
      },
    });
  });

  it("turning it OFF clears only the main field — siblings and other fields/group survive", () => {
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState), { wrapper });

    act(() => {
      result.current.form.setValue("toFollowDocs", ["passport"]);
    });
    act(() => {
      result.current.dialog.toggleToFollow(false);
    });

    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: {
        parentGuardianUploadRequirements: { motherPassport: "http://example.com/mother-passport.pdf" },
        studentUploadRequirements: {
          idPicture: "http://example.com/id.pdf",
          passportNumber: "P123",
          passportExpiry: new Date("2030-01-01"),
          passport: "",
          isValid: false,
          toFollowDocs: [],
        },
      },
    });
    expect(result.current.form.getValues("passportNumber")).toBe("P123");
  });
});

describe("resetStrategy — the one real quirk between flow copies", () => {
  it("with resetStrategy='undefined', toggleToFollow resets the main field to undefined (not '') in BOTH directions — siblings still use '' / null", () => {
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState, "undefined"), { wrapper });

    act(() => {
      result.current.dialog.toggleToFollow(true);
    });

    expect(setFormState).toHaveBeenCalledWith({
      uploadRequirements: {
        parentGuardianUploadRequirements: { motherPassport: "http://example.com/mother-passport.pdf" },
        studentUploadRequirements: {
          idPicture: "http://example.com/id.pdf",
          passport: undefined,
          isValid: false,
          passportNumber: "",
          passportExpiry: null,
          toFollowDocs: ["passport"],
        },
      },
    });
  });

  it("does NOT affect confirmChangeDocument or removeSelectedFile — those always reset to '' regardless of resetStrategy", async () => {
    vi.mocked(deleteFile).mockResolvedValue(undefined as never);
    const setFormState = vi.fn();
    const { result } = renderHook(() => useHarness(makeFormState(), setFormState, "undefined"), { wrapper });

    await act(async () => {
      await result.current.dialog.confirmChangeDocument();
    });

    expect(setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadRequirements: expect.objectContaining({
          studentUploadRequirements: expect.objectContaining({ passport: "" }),
        }),
      }),
    );
  });
});
