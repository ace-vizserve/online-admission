import { checkDocument, DocumentCheckResult } from "@/lib/document-check/check-document";
import { readPass, readPassport } from "@/lib/document-check/read-document-text";
import { format, isAfter } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { FieldValues, Path, UseFormReturn, useWatch } from "react-hook-form";

import { DocumentConfig, siblingFields } from "./document-config";
import { SetUploadRequirementsFn, SharedUploadFormState } from "./types";
import { updateUploadRequirementsSlice } from "./use-document-upload-dialog";

type CheckState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "failed" }
  | { phase: "done"; result: DocumentCheckResult };

export type DocumentCheck = {
  state: CheckState;
  /** Why the staged files can't be uploaded yet, or null when they can. */
  blockReason: string | null;
  /** Non-blocking guidance: what was filled in, or that the parent needs to fill it in. */
  notice: string | null;
};

/** The pass type / passport number / expiry, keyed by role rather than by form field name. */
export type DocumentDetails = { type?: unknown; number?: unknown; expiry?: unknown };
export type DocumentDetailsPatch = { type?: string; number?: string; expiry?: Date };

type UseStagedDocumentCheckArgs = {
  cfg: DocumentConfig;
  files: File[] | null;
  /** What the parent has entered right now — compared against what the document says. */
  current: DocumentDetails;
  /** Called once per read with the details worth filling in (never an expired date). */
  onFill: (patch: DocumentDetailsPatch) => void;
};

const displayDate = (date: Date) => format(date, "d MMM yyyy");
const dayKey = (value: unknown) => {
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};
const normalizeNumber = (value: unknown) => String(value).replace(/\s/g, "").toUpperCase();

/**
 * Reads a staged passport / pass before it's uploaded: rejects blurry or unreadable scans and
 * expired documents, hands back the pass type / passport number / expiry it read to be filled in,
 * and blocks the upload if the parent then changes a filled-in value to something the document
 * contradicts. When nothing can be read the parent simply fills the fields in by hand, as before.
 *
 * Form-agnostic: the enrolment wizard uses it through `useDocumentCheck` (React Hook Form), the
 * Documents page's reupload dialog with plain `useState`.
 */
export function useStagedDocumentCheck({ cfg, files, current, onFill }: UseStagedDocumentCheckArgs): DocumentCheck {
  const enabled = cfg.expiring && cfg.fieldKind !== "plain";
  const fields = siblingFields(cfg);
  const [state, setState] = useState<CheckState>({ phase: "idle" });

  // OCR takes seconds; fill through whatever callback is current when it finishes.
  const onFillRef = useRef(onFill);
  onFillRef.current = onFill;

  useEffect(() => {
    if (!enabled || !files?.length) {
      setState({ phase: "idle" });
      return;
    }

    let cancelled = false;
    setState({ phase: "checking" });

    const read =
      cfg.fieldKind === "passportNumber+expiry"
        ? readPassport
        : (text: string) => readPass(text, cfg.passTypeOptions ?? []);

    checkDocument(files, read)
      .then((result) => {
        if (cancelled) return;
        setState({ phase: "done", result });
        if (result.status !== "read") return;

        const { reading } = result;
        const { type, number, expiry } = siblingFields(cfg);
        const patch: DocumentDetailsPatch = {};
        if (type && reading.passType) patch.type = reading.passType;
        if (number && reading.passportNumber) patch.number = reading.passportNumber;
        // An expired date is never filled in — the upload is blocked instead, and the date picker
        // doesn't accept past dates anyway.
        if (expiry && reading.expiry && isAfter(reading.expiry, new Date())) patch.expiry = reading.expiry;
        if (Object.keys(patch).length) onFillRef.current(patch);
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "failed" });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, files, cfg]);

  const docName = cfg.fieldKind === "passportNumber+expiry" ? "passport" : "pass";
  let blockReason: string | null = null;
  let notice: string | null = null;

  if (state.phase === "checking") {
    blockReason = `Checking your ${docName}…`;
  } else if (state.phase === "failed") {
    notice = `We couldn't read this ${docName} automatically. Please fill in the details below.`;
  } else if (state.phase === "done" && state.result.status === "poor-quality") {
    blockReason = `This ${docName} is blurry or hard to read. Please upload a clearer scan.`;
  } else if (state.phase === "done" && state.result.status === "read") {
    const { reading } = state.result;

    if (reading.expiry && !isAfter(reading.expiry, new Date())) {
      blockReason = `This ${docName} expired on ${displayDate(reading.expiry)}. Please upload a valid one.`;
    } else {
      const mismatches: string[] = [];
      if (fields.type && reading.passType && current.type && current.type !== reading.passType) {
        mismatches.push(`pass type (document shows ${reading.passType})`);
      }
      if (
        fields.number &&
        reading.passportNumber &&
        current.number &&
        normalizeNumber(current.number) !== normalizeNumber(reading.passportNumber)
      ) {
        mismatches.push("passport number");
      }
      if (fields.expiry && reading.expiry && current.expiry && dayKey(current.expiry) !== dayKey(reading.expiry)) {
        mismatches.push(`expiry date (document shows ${displayDate(reading.expiry)})`);
      }

      const found = [reading.passType, reading.passportNumber, reading.expiry].filter(Boolean).length;
      if (mismatches.length) {
        blockReason = `The ${mismatches.join(" and ")} you entered doesn't match the ${docName}. Please correct it.`;
      } else if (found) {
        notice = `We filled in the details we could read from your ${docName}. Please check they're correct.`;
      } else {
        notice = `We couldn't read the details from this ${docName}. Please fill them in below.`;
      }
    }
  }

  return { state, blockReason, notice };
}

type UseDocumentCheckArgs<TFieldValues extends FieldValues> = {
  cfg: DocumentConfig;
  form: UseFormReturn<TFieldValues>;
  value: File[] | null;
  formState: SharedUploadFormState;
  setFormState: SetUploadRequirementsFn;
};

/** `useStagedDocumentCheck` wired to the enrolment wizard's React Hook Form + draft store. */
export function useDocumentCheck<TFieldValues extends FieldValues>({
  cfg,
  form,
  value,
  formState,
  setFormState,
}: UseDocumentCheckArgs<TFieldValues>): DocumentCheck {
  const fields = siblingFields(cfg);

  // The store write after OCR must merge into the form state as it is THEN, not as it was when
  // the check started, or it would undo anything edited in the meantime.
  const latest = useRef({ formState, setFormState });
  latest.current = { formState, setFormState };

  const roles = (["type", "number", "expiry"] as const).filter((role) => fields[role]);
  const watched = useWatch({
    control: form.control,
    name: roles.map((role) => fields[role]) as Path<TFieldValues>[],
  }) as unknown[];
  const current: DocumentDetails = {};
  roles.forEach((role, i) => (current[role] = watched[i]));

  return useStagedDocumentCheck({
    cfg,
    files: value,
    current,
    onFill: (patch) => {
      const byField: Record<string, unknown> = {};
      if (patch.type) byField[fields.type!] = patch.type;
      if (patch.number) byField[fields.number!] = patch.number;
      // Already UTC midnight, the shape toUTCDateOnly gives the picker.
      if (patch.expiry) byField[fields.expiry!] = patch.expiry;

      for (const [name, fieldValue] of Object.entries(byField)) {
        form.setValue(name as Path<TFieldValues>, fieldValue as never, { shouldDirty: true });
      }
      updateUploadRequirementsSlice(latest.current.formState, latest.current.setFormState, cfg.group, byField);
      form.trigger();
    },
  });
}
