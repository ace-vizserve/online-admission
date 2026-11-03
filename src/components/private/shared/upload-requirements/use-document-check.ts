import { checkDocument, DocumentCheckResult, PassportRead } from "@/lib/document-check/check-document";
import { format, isAfter } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { FieldValues, Path, UseFormReturn, useWatch } from "react-hook-form";

import { DocumentConfig, siblingFields } from "./document-config";
import { SetUploadRequirementsFn, SharedUploadFormState } from "./types";
import { updateUploadRequirementsSlice } from "./use-document-upload-dialog";

type CheckState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "failed"; error: string }
  | { phase: "done"; result: DocumentCheckResult };

type Role = "number" | "expiry";

/** How long a parent waits for the read before they can carry on without it. Most take seconds; the
 * server stops reading after a minute, and this leaves time to send the file on a slow connection. */
const CHECK_TIME_LIMIT_MS = 90_000;
export const CHECK_TIMED_OUT = "Took too long to read";

/** One value read off the document, set against what the parent has entered for it. */
export type ReadField = {
  role: Role;
  label: string;
  /** Display form of the value read. */
  value: string;
  /** `empty`: nothing entered; `expired`: an expiry date already past (never filled in). */
  status: "match" | "differs" | "empty" | "expired";
  /** Passed the passport's check digits, so a difference is the parent's to fix, not a misread. */
  verified: boolean;
};

export type DocumentCheck = {
  /** This document is a passport, so it gets the read-then-confirm upload steps. */
  enabled: boolean;
  state: CheckState;
  /** For copy. */
  docName: string;
  /** The values read, for the fields this document has. Empty until a read finishes. */
  readFields: ReadField[];
  /** Every detail field for this document has a value — ready to confirm. */
  detailsComplete: boolean;
  /** Still reading, so there's nothing yet to check the details against. */
  waiting: boolean;
  /** What was entered disagrees with a verified read of the document, or the document has expired. */
  blocked: boolean;
  /** The file holds more than one passport, so nothing was filled in for the parent. */
  severalPassports: boolean;
};

/** The passport number / expiry, keyed by role rather than by form field name. */
export type DocumentDetails = { number?: unknown; expiry?: unknown };
export type DocumentDetailsPatch = { number?: string; expiry?: Date };

type UseStagedDocumentCheckArgs = {
  cfg: DocumentConfig;
  files: File[] | null;
  /** What the parent has entered right now — compared against what the document says. */
  current: DocumentDetails;
  /** Writes the values read into the fields the parent hasn't filled in yet. */
  onFill: (patch: DocumentDetailsPatch) => void;
};

const displayDate = (date: Date) => format(date, "d MMM yyyy");
const dayKey = (value: unknown) => {
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};
const normalizeNumber = (value: unknown) => String(value).replace(/\s/g, "").toUpperCase();
const isBlank = (value: unknown) => !value || String(value).trim() === "";

/** The passport in the file the parent means: the one matching what they entered, else the first. */
function passportToCompare(passports: PassportRead[], current: DocumentDetails) {
  return (
    passports.find((p) => p.passportNumber && normalizeNumber(current.number) === normalizeNumber(p.passportNumber)) ??
    passports.find((p) => p.expiry && dayKey(current.expiry) === dayKey(p.expiry)) ??
    passports[0]
  );
}

/**
 * Reads a staged passport before it's uploaded, to stop wrong details being submitted. The fields stay
 * hidden until it finishes, and then the ones still empty get filled. Details that disagree with a verified read stop the upload until the parent corrects them
 * or uploads the right passport. Only check-digit-verified values do that (a real upload hasn't
 * misread yet); a printed date without one is only shown. A document it can't read, or can't read in
 * time, isn't held up: the admin reviewing the upload checks it either way.
 *
 * Singapore passes aren't read: on real uploads (mostly a card's front) the expiry usually isn't on
 * the page, and for PRs the expiry asked for is the re-entry permit's, which isn't on the IC at all.
 *
 * Form-agnostic: the enrolment wizard uses it through `useDocumentCheck` (React Hook Form), the
 * Documents page's reupload dialog with plain `useState`.
 */
export function useStagedDocumentCheck({ cfg, files, current, onFill }: UseStagedDocumentCheckArgs): DocumentCheck {
  const enabled = cfg.fieldKind === "passportNumber+expiry";
  const fields = siblingFields(cfg);
  const docName = "passport";
  const [state, setState] = useState<CheckState>({ phase: "idle" });

  // OCR takes seconds; fill through whatever callback and values are current when it finishes.
  const onFillRef = useRef(onFill);
  onFillRef.current = onFill;
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (!enabled || !files?.length) {
      setState({ phase: "idle" });
      return;
    }

    let cancelled = false;
    setState({ phase: "checking" });
    const timeLimit = setTimeout(() => {
      cancelled = true;
      setState({ phase: "failed", error: CHECK_TIMED_OUT });
    }, CHECK_TIME_LIMIT_MS);

    checkDocument(files)
      .then((result) => {
        if (cancelled) return;
        clearTimeout(timeLimit);
        setState({ phase: "done", result });

        const { reading, passports } = result;
        // Which passport in the file is this person's is for the parent to say.
        if (passports.length > 1) return;
        // What the parent typed while it was reading wins; a difference shows as a hint instead.
        const empty = (role: Role) => isBlank(currentRef.current[role]);
        const patch: DocumentDetailsPatch = {};
        if (fields.number && reading.passportNumber && empty("number")) patch.number = reading.passportNumber;
        // An expired date is never filled in; the date picker doesn't take past dates anyway.
        // Already UTC midnight, the shape toUTCDateOnly gives the picker.
        if (fields.expiry && reading.expiry && isAfter(reading.expiry, new Date()) && empty("expiry")) {
          patch.expiry = reading.expiry;
        }
        if (Object.keys(patch).length) onFillRef.current(patch);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        clearTimeout(timeLimit);
        console.error("Document check failed", error);
        setState({ phase: "failed", error: error instanceof Error ? error.message : String(error) });
      });

    return () => {
      cancelled = true;
      clearTimeout(timeLimit);
    };
    // `fields` is derived from `cfg`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, files, cfg]);

  const readFields: ReadField[] = [];

  if (state.phase === "done") {
    const { reading, passports } = state.result;
    const compared = passportToCompare(passports, current);
    const number = compared?.passportNumber ?? reading.passportNumber;
    const expiry = compared?.expiry ?? reading.expiry;
    const add = (role: Role, label: string, value: string, matches: boolean, verified: boolean, expired = false) => {
      const status = expired ? "expired" : !current[role] ? "empty" : matches ? "match" : "differs";
      readFields.push({ role, label, value, status, verified });
    };

    if (fields.number && number) {
      const matches = normalizeNumber(current.number) === normalizeNumber(number);
      add("number", "passport number", number, matches, !!compared?.passportNumber);
    }
    if (fields.expiry && expiry) {
      const expired = !isAfter(expiry, new Date());
      add("expiry", "expiry date", displayDate(expiry), dayKey(current.expiry) === dayKey(expiry), !!compared?.expiry, expired);
    }
  }

  const roles = (["number", "expiry"] as const).filter((role) => fields[role]);
  return {
    enabled,
    state,
    docName,
    readFields,
    detailsComplete: roles.every((role) => !isBlank(current[role])),
    waiting: state.phase === "checking",
    blocked: readFields.some((field) => field.verified && (field.status === "differs" || field.status === "expired")),
    severalPassports: state.phase === "done" && state.result.passports.length > 1,
  };
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

  const roles = (["number", "expiry"] as const).filter((role) => fields[role]);
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
      if (patch.number) byField[fields.number!] = patch.number;
      if (patch.expiry) byField[fields.expiry!] = patch.expiry;

      for (const [name, fieldValue] of Object.entries(byField)) {
        form.setValue(name as Path<TFieldValues>, fieldValue as never, { shouldDirty: true });
      }
      updateUploadRequirementsSlice(formState, setFormState, cfg.group, byField);
      form.trigger();
    },
  });
}
