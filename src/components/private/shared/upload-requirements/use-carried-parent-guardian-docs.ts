import { getPreviousParentGuardianDocuments } from "@/actions/private";
import { ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { QueryKey, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

import { updateUploadRequirementsSlice } from "./use-document-upload-dialog";
import { SetUploadRequirementsFn, SharedUploadFormState } from "./types";

const DOC_FIELD_SUFFIXES = ["Passport", "PassportNumber", "PassportExpiry", "Pass", "PassType", "PassExpiry"] as const;
const ROLES = ["mother", "father", "guardian"] as const;

/** The 18 document-file/metadata fields `getPreviousParentGuardianDocuments` can populate —
 * deliberately excludes `hasFatherInfo`/`hasGuardianInfo`/`isValid`/`toFollowDocs`, which belong
 * to the CURRENT enrollment's own choices, not to what a prior application carries over. */
export const CARRIED_DOC_KEYS = ROLES.flatMap((role) =>
  DOC_FIELD_SUFFIXES.map((suffix) => `${role}${suffix}`),
) as (keyof ParentGuardianUploadRequirementsSchema)[];

type PartialParentGuardianReq = Partial<ParentGuardianUploadRequirementsSchema> | null | undefined;

/** True if any of the 18 carried document fields is actually populated. Used instead of
 * `Object.keys(obj).length > 0`, because the parent-guardian store slice is pre-seeded by the
 * family-information step with `hasFatherInfo`/`hasGuardianInfo` (and later `isValid`) before
 * the upload step is ever reached — a "any key present" check would always be true here. */
export function hasCarriedDocFields(value: PartialParentGuardianReq): boolean {
  if (!value) return false;
  return CARRIED_DOC_KEYS.some((key) => {
    const fieldValue = value[key];
    return fieldValue != null && fieldValue !== "";
  });
}

/** Keeps only the populated carried-document fields out of `value` — guarantees a fetched
 * `hasFatherInfo`/`hasGuardianInfo`/`isValid` can never leak over the store's own values for
 * the enrollment currently being filled out. */
export function pickCarriedDocFields(value: PartialParentGuardianReq): Partial<ParentGuardianUploadRequirementsSchema> {
  const patch: Partial<ParentGuardianUploadRequirementsSchema> = {};
  if (!value) return patch;

  CARRIED_DOC_KEYS.forEach((key) => {
    const fieldValue = value[key];
    if (fieldValue != null && fieldValue !== "") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (patch as any)[key] = fieldValue;
    }
  });

  return patch;
}

type UseCarriedParentGuardianDocumentsArgs<TFieldValues extends FieldValues> = {
  /** Pass an enroleeNumber to pin the lookup to that single record (re-enrollment); omit for a
   * new enrollment, which scans every prior academic year for the logged-in parent's latest
   * application. */
  enroleeNumber?: string;
  queryKey: QueryKey;
  formState: SharedUploadFormState;
  setFormState: SetUploadRequirementsFn;
  form: UseFormReturn<TFieldValues>;
};

/**
 * Carries a returning parent's latest passport/pass documents into a NEW enrollment's
 * parent/guardian upload step — the same behavior re-enrollment flows already have, ported here
 * via the one mechanism that's known to work correctly (mirrored from
 * `vizschool/tabs/upload-requirements/parent-guardian-upload.tsx`), adapted so the seed/hydrate
 * guards look at actual document fields rather than "the slice has any key at all" (see
 * `hasCarriedDocFields`).
 *
 * Two effects, in order:
 * - Effect A seeds the Zustand store slice with the fetched document fields — but only once,
 *   and only when the parent actually has prior documents, the step isn't already complete, and
 *   the user hasn't already uploaded/edited a document themselves. Never touches
 *   `hasFatherInfo`/`hasGuardianInfo`/`isValid`, which stay driven by the user's own
 *   family-information choices for this enrollment.
 * - Effect B hydrates the React Hook Form instance from the store exactly once, but only after
 *   Effect A (or the user) has actually put document fields into the slice — so it doesn't lock
 *   onto the pre-seeded `hasFatherInfo`-only slice before the fetch resolves.
 *
 * The uploader's "View"/"Upload" state is read from the store slice, not the form
 * (`use-document-upload-dialog.ts`), so Effect A doing the store write is what makes carried
 * documents actually render — hydrating the form alone would leave every row showing "Upload".
 */
export function useCarriedParentGuardianDocuments<TFieldValues extends FieldValues>({
  enroleeNumber,
  queryKey,
  formState,
  setFormState,
  form,
}: UseCarriedParentGuardianDocumentsArgs<TFieldValues>) {
  const { data, isPending, isSuccess, fetchStatus } = useQuery({
    queryKey,
    queryFn: async () => getPreviousParentGuardianDocuments(enroleeNumber),
  });

  const hydratedRef = useRef(false);
  const slice = formState.uploadRequirements?.parentGuardianUploadRequirements;

  useEffect(() => {
    if (!isSuccess) return;

    const fetched = data?.parentGuardianUploadRequirements;
    if (!hasCarriedDocFields(fetched)) return; // parent has no prior docs -> no-op
    if (slice?.isValid) return; // step already completed -> never clobber
    if (hasCarriedDocFields(slice)) return; // user already uploaded/edited a document -> never clobber

    updateUploadRequirementsSlice(formState, setFormState, "parentGuardian", pickCarriedDocFields(fetched));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data, slice]);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (!hasCarriedDocFields(slice)) return; // don't lock onto the pre-seed hasFatherInfo-only slice

    form.reset(slice as TFieldValues, { keepErrors: false });
    form.trigger();
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slice]);

  return { isFetching: fetchStatus === "fetching" && isPending };
}
