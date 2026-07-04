import { deleteFile, uploadFileToBucket } from "@/actions/private";
import { useSelectAcademicYear } from "@/zustand-store";
import { useMutation } from "@tanstack/react-query";
import { isAfter } from "date-fns";
import { useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { FieldValues, Path, UseFormReturn, useFormState } from "react-hook-form";

import { DocumentConfig, DocumentGroup, siblingFields } from "./document-config";
import {
  ResetStrategy,
  SetUploadRequirementsFn,
  SharedUploadFormState,
  UploadRequirementsPatch,
  UploadRequirementsSlice,
} from "./types";

/** Merges a partial update into whichever `uploadRequirements` sub-slice a document belongs to,
 * spreading the CURRENT value of both sub-slices through first — mirrors the defensive "spread
 * both groups, and the rest of this group's own fields" pattern every original dialog repeated
 * by hand at every call site. Without this, every store's `setFormState` only shallow-merges at
 * the top FormState level (`{...state.formState, ...data}`), so setting `uploadRequirements`
 * with just one patched field would silently wipe every other document already saved in BOTH
 * the same group (e.g. every other student document) and the other group (parent/guardian). */
export function updateUploadRequirementsSlice(
  formState: SharedUploadFormState,
  setFormState: SetUploadRequirementsFn,
  group: DocumentGroup,
  patch: Record<string, unknown>,
) {
  const key: keyof UploadRequirementsSlice =
    group === "student" ? "studentUploadRequirements" : "parentGuardianUploadRequirements";
  const otherKey: keyof UploadRequirementsSlice =
    group === "student" ? "parentGuardianUploadRequirements" : "studentUploadRequirements";

  setFormState({
    uploadRequirements: {
      [otherKey]: { ...(formState.uploadRequirements?.[otherKey] ?? {}) },
      [key]: { ...(formState.uploadRequirements?.[key] ?? {}), ...patch },
    } as UploadRequirementsPatch,
  });
}

type DocDescription = {
  description: string;
  status: string;
  expirationDate?: string;
};

type UseDocumentUploadDialogArgs<TFieldValues extends FieldValues> = {
  cfg: DocumentConfig;
  form: UseFormReturn<TFieldValues>;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: SharedUploadFormState;
  setFormState: SetUploadRequirementsFn;
  resetStrategy?: ResetStrategy;
};

export function useDocumentUploadDialog<TFieldValues extends FieldValues>({
  cfg,
  form,
  value,
  onValueChange,
  formState,
  setFormState,
  resetStrategy = "empty-string",
}: UseDocumentUploadDialogArgs<TFieldValues>) {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const [isChangingDocument, setIsChangingDocument] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const slice =
    cfg.group === "student"
      ? formState.uploadRequirements?.studentUploadRequirements
      : formState.uploadRequirements?.parentGuardianUploadRequirements;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sliceValue = (slice as any)?.[cfg.name] as string | undefined;

  const { mutate, isPending } = useMutation({
    mutationFn: async (files: File[]) => {
      const isImage = cfg.group === "student" && files.length === 1;
      return await uploadFileToBucket(isImage, files, academicYear);
    },
    onSuccess(data) {
      onValueChange(null);
      if (data?.imagePath) {
        form.setValue(cfg.name as Path<TFieldValues>, data.imagePath as never);
        updateUploadRequirementsSlice(formState, setFormState, cfg.group, { [cfg.name]: data.imagePath });
      }
    },
    onSettled() {
      form.trigger();
    },
  });

  const dropZoneConfig: DropzoneOptions = {
    maxFiles: cfg.maxFiles,
    maxSize: 1024 * 1024 * 4, // 4MB max per source file — see uploadFileToBucket for the merged-output guard
    accept: cfg.accept,
  };

  function uploadFile() {
    if (!value?.length) return;
    mutate(value);
  }

  /** Clears the main field only — used when the user removes a not-yet-uploaded staged file
   * (matches the original behavior: sibling pass-type/expiry fields are left alone here, only
   * changing/following the document clears them). Every flow's change-document/remove-file
   * handler resets to `""` — the `resetStrategy` prop does NOT apply here (see `toggleToFollow`
   * below for the one handler where it does). */
  function clearMainFieldPatch() {
    form.setValue(cfg.name as Path<TFieldValues>, "" as never);
    form.setValue("isValid" as Path<TFieldValues>, false as never);
    return { [cfg.name]: "", isValid: false };
  }

  /** Clears the main field AND its sibling pass-type/number/expiry fields. */
  function clearMainFieldAndSiblingsPatch() {
    const { type, number, expiry } = siblingFields(cfg);
    const patch = clearMainFieldPatch();

    if (type) {
      form.setValue(type as Path<TFieldValues>, "" as never);
      Object.assign(patch, { [type]: "" });
    }
    if (number) {
      form.setValue(number as Path<TFieldValues>, "" as never);
      Object.assign(patch, { [number]: "" });
    }
    if (expiry) {
      form.setValue(expiry as Path<TFieldValues>, null as never);
      Object.assign(patch, { [expiry]: null });
    }

    return patch;
  }

  function removeSelectedFile() {
    onValueChange(null);
    const patch = clearMainFieldPatch();
    updateUploadRequirementsSlice(formState, setFormState, cfg.group, patch);
    form.trigger();
  }

  function requestChangeDocument() {
    setConfirmOpen(true);
  }

  async function confirmChangeDocument() {
    setConfirmOpen(false);
    if (!sliceValue) return;

    try {
      setIsChangingDocument(true);
      // Awaited before any form/store mutation below — if the storage delete fails, deleteFile
      // re-throws (after its own toast), and the catch below skips clearing the document instead
      // of leaving the UI showing "removed" while the file is still orphaned in the bucket.
      await deleteFile(sliceValue, academicYear);

      const patch = clearMainFieldAndSiblingsPatch();
      onValueChange(null);
      updateUploadRequirementsSlice(formState, setFormState, cfg.group, patch);
      setIsChangingDocument(false);
    } catch {
      setIsChangingDocument(false);
    } finally {
      form.trigger();
    }
  }

  function toggleToFollow(checked: boolean) {
    const current = (form.getValues("toFollowDocs" as Path<TFieldValues>) as string[] | undefined) ?? [];
    const updatedDocs = checked ? [...current, cfg.name] : current.filter((item) => item !== cfg.name);

    // The main field + isValid are cleared either way (turning "to follow" off still means the
    // user needs to actually upload something); sibling pass-type/number/expiry fields are only
    // cleared when turning it ON, matching the original per-document handlers.
    const patch = checked ? clearMainFieldAndSiblingsPatch() : clearMainFieldPatch();

    // The one real quirk the audit found between flow copies: VizSchool's student toggle-to-
    // follow handler (both directions) resets the main field to `undefined` instead of `""` —
    // every other action, in every flow, uses `""`. Preserved via `resetStrategy` rather than
    // silently normalized, since it's the one place a behavioral difference actually exists.
    if (resetStrategy === "undefined") {
      form.setValue(cfg.name as Path<TFieldValues>, undefined as never);
      (patch as Record<string, unknown>)[cfg.name] = undefined;
    }

    Object.assign(patch, { toFollowDocs: updatedDocs });

    form.setValue("toFollowDocs" as Path<TFieldValues>, updatedDocs as never);
    onValueChange(null);

    updateUploadRequirementsSlice(formState, setFormState, cfg.group, patch);
    form.trigger();
  }

  const { errors } = useFormState({ control: form.control });
  const hasError = errors[cfg.name as Path<TFieldValues>] != null;
  const isToFollow = ((slice as { toFollowDocs?: string[] } | undefined)?.toFollowDocs ?? []).includes(cfg.name);
  const isUploaded = String(sliceValue ?? "").startsWith("http");

  const { expiry } = siblingFields(cfg);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expirationDate: string | null = cfg.expiring && expiry ? ((slice as any)?.[expiry] ?? null) : null;
  const isExpired = !!expirationDate && !isAfter(new Date(expirationDate), new Date());
  const isValid = isUploaded && !isExpired;

  let docDescription: DocDescription = { description: "", status: "" };

  if (hasError && !isUploaded) {
    docDescription = { description: "Action Required", status: "Missing" };
  } else if (isToFollow) {
    docDescription = { description: "Marked to follow", status: "" };
  } else if (cfg.expiring) {
    if (isUploaded && isValid) {
      docDescription = { description: "", status: "Valid", expirationDate: expirationDate || "" };
    } else if (isUploaded && isExpired) {
      docDescription = { description: "", status: "Expired", expirationDate: expirationDate || "" };
    } else {
      docDescription = { description: "", status: "Missing", expirationDate: expirationDate || "" };
    }
  } else if (isUploaded) {
    docDescription = { description: "Record saved", status: "Uploaded" };
  } else if (cfg.optional) {
    docDescription = { description: "Optional document", status: "" };
  }

  return {
    dropZoneConfig,
    isPending,
    uploadFile,
    isChangingDocument,
    confirmOpen,
    setConfirmOpen,
    requestChangeDocument,
    confirmChangeDocument,
    removeSelectedFile,
    toggleToFollow,
    hasError,
    isToFollow,
    isUploaded,
    isExpired,
    isValid,
    docDescription,
    sliceValue,
  };
}
