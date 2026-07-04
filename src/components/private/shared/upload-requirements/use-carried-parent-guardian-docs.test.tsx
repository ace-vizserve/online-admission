/**
 * Hook-level coverage for `useCarriedParentGuardianDocuments` — carries a returning parent's
 * latest passport/pass documents into a brand-new enrollment's parent/guardian upload step,
 * the same behavior re-enrollment flows already have.
 *
 * The parent-guardian store slice is pre-seeded by the family-information step with
 * `hasFatherInfo`/`hasGuardianInfo` before the upload step is ever reached, so "any key present"
 * is never a safe signal for "already hydrated" here — every case below exercises the
 * document-field-aware guards (`hasCarriedDocFields`/`pickCarriedDocFields`) that replace it.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPreviousParentGuardianDocuments } from "@/actions/private";
import { ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { SharedUploadFormState } from "./types";
import {
  CARRIED_DOC_KEYS,
  hasCarriedDocFields,
  pickCarriedDocFields,
  useCarriedParentGuardianDocuments,
} from "./use-carried-parent-guardian-docs";

vi.mock("@/actions/private", () => ({
  getPreviousParentGuardianDocuments: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** Mirrors how a real flow component wires the hook to its Zustand store: `setFormState`
 * shallow-merges the patch into local state, exactly like every real store's `setFormState`
 * shallow-merges into `formState` — so the hook's Effect A write is visible to Effect B on the
 * next render, the same as it would be through a real store + context. */
function useHarness(initialFormState: SharedUploadFormState, queryKey: string) {
  const [formState, setFormStateRaw] = useState(initialFormState);
  const setFormState = (patch: Partial<SharedUploadFormState>) =>
    setFormStateRaw((prev) => ({ ...prev, ...patch }));

  const form = useForm<ParentGuardianUploadRequirementsSchema>({
    defaultValues: initialFormState.uploadRequirements?.parentGuardianUploadRequirements,
  });

  const carried = useCarriedParentGuardianDocuments({
    queryKey: ["test-carried-docs", queryKey],
    formState,
    setFormState,
    form,
  });

  return { ...carried, formState, setFormState, form };
}

const FUTURE_DATE = new Date("2099-01-01");

/** `getPreviousParentGuardianDocuments`'s inferred return type is a union across its many
 * early-return branches (empty object, undefined, or the full shape) — too awkward for a test
 * fixture to satisfy structurally. Matches the `as never` idiom already used for this same
 * situation in use-document-upload-dialog.test.tsx. */
function mockCarriedDocs(parentGuardianUploadRequirements: Record<string, unknown>) {
  vi.mocked(getPreviousParentGuardianDocuments).mockResolvedValue({ parentGuardianUploadRequirements } as never);
}

beforeEach(() => {
  vi.mocked(getPreviousParentGuardianDocuments).mockReset();
});

describe("hasCarriedDocFields / pickCarriedDocFields", () => {
  it("is false for null/undefined/empty input", () => {
    expect(hasCarriedDocFields(null)).toBe(false);
    expect(hasCarriedDocFields(undefined)).toBe(false);
    expect(hasCarriedDocFields({})).toBe(false);
  });

  it("is false when only non-document fields are present (hasFatherInfo/hasGuardianInfo/isValid)", () => {
    expect(hasCarriedDocFields({ hasFatherInfo: true, hasGuardianInfo: false, isValid: false })).toBe(false);
  });

  it("is true when any carried document field is populated", () => {
    expect(hasCarriedDocFields({ motherPassport: "http://old.pdf" })).toBe(true);
    expect(hasCarriedDocFields({ fatherPassType: "Dependent Pass" })).toBe(true);
  });

  it("treats an empty string as not populated", () => {
    expect(hasCarriedDocFields({ motherPassport: "" })).toBe(false);
  });

  it("pickCarriedDocFields keeps only populated document fields, dropping metadata keys", () => {
    const patch = pickCarriedDocFields({
      motherPassport: "http://old.pdf",
      motherPassportExpiry: FUTURE_DATE,
      motherPass: "",
      hasFatherInfo: true,
      isValid: true,
      toFollowDocs: ["fatherPass"],
    } as Partial<ParentGuardianUploadRequirementsSchema>);

    expect(patch).toEqual({ motherPassport: "http://old.pdf", motherPassportExpiry: FUTURE_DATE });
  });

  it("pickCarriedDocFields returns {} for null/undefined", () => {
    expect(pickCarriedDocFields(null)).toEqual({});
    expect(pickCarriedDocFields(undefined)).toEqual({});
  });

  it("CARRIED_DOC_KEYS covers all 3 roles x 6 fields", () => {
    expect(CARRIED_DOC_KEYS).toHaveLength(18);
    expect(CARRIED_DOC_KEYS).toEqual(
      expect.arrayContaining(["motherPassport", "fatherPassType", "guardianPassExpiry"]),
    );
  });
});

describe("useCarriedParentGuardianDocuments", () => {
  it("seeds the store and hydrates the form when the parent has prior documents", async () => {
    mockCarriedDocs({
      motherPassport: "http://old.pdf",
      motherPassportExpiry: FUTURE_DATE,
      hasFatherInfo: true,
      hasGuardianInfo: true,
    });

    const { result } = renderHook(
      () =>
        useHarness(
          {
            uploadRequirements: {
              parentGuardianUploadRequirements: { hasFatherInfo: false, hasGuardianInfo: false },
            },
          },
          "seeds-and-hydrates",
        ),
      { wrapper },
    );

    await waitFor(() => {
      expect(
        result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.motherPassport,
      ).toBe("http://old.pdf");
    });

    // hasFatherInfo/hasGuardianInfo stay driven by the CURRENT enrollment's own family-info
    // choices — the fetched values (both true) must never override the store's (both false).
    expect(result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.hasFatherInfo).toBe(false);
    expect(result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.hasGuardianInfo).toBe(
      false,
    );

    await waitFor(() => {
      expect(result.current.form.getValues("motherPassport")).toBe("http://old.pdf");
    });
  });

  it("no-ops when the parent has no prior documents", async () => {
    mockCarriedDocs({});

    const { result } = renderHook(
      () =>
        useHarness(
          { uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: false } } },
          "no-prior-docs",
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    // Give any (incorrect) seed effect a chance to fire before asserting it didn't.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.motherPassport).toBeUndefined();
  });

  it("does not clobber a completed step (isValid)", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });

    const { result } = renderHook(
      () =>
        useHarness(
          {
            uploadRequirements: {
              parentGuardianUploadRequirements: { motherPassport: "http://local.pdf", isValid: true },
            },
          },
          "completed-step",
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.motherPassport).toBe(
      "http://local.pdf",
    );
  });

  it("does not clobber a document the user already uploaded/edited", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });

    const { result } = renderHook(
      () =>
        useHarness(
          { uploadRequirements: { parentGuardianUploadRequirements: { motherPassport: "http://local.pdf" } } },
          "already-uploaded",
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isFetching).toBe(false));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.motherPassport).toBe(
      "http://local.pdf",
    );
  });

  it("does not re-hydrate the form if the store slice changes again after the first hydration", async () => {
    mockCarriedDocs({ motherPassport: "http://old.pdf" });

    const { result } = renderHook(
      () =>
        useHarness(
          { uploadRequirements: { parentGuardianUploadRequirements: { hasFatherInfo: false } } },
          "re-hydrate-guard",
        ),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.form.getValues("motherPassport")).toBe("http://old.pdf");
    });

    const resetSpy = vi.spyOn(result.current.form, "reset");

    // Simulate an unrelated later write to the slice (e.g. the user toggling father info) —
    // the slice reference changes, re-running Effect B, but `hydratedRef` must keep it a no-op.
    act(() => {
      result.current.setFormState({
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            ...result.current.formState.uploadRequirements?.parentGuardianUploadRequirements,
            hasFatherInfo: true,
          },
        },
      });
    });

    await waitFor(() => {
      expect(result.current.formState.uploadRequirements?.parentGuardianUploadRequirements?.hasFatherInfo).toBe(true);
    });

    expect(resetSpy).not.toHaveBeenCalled();
  });
});
