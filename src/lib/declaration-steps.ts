import type { DeclarationFormValues } from "@/actions/declaration-payload";

export type StepId = "who" | "type" | "when" | "certificate" | "attach" | "destination" | "note" | "review";

/**
 * The questions to ask, given what has been answered so far.
 *
 * Derived from the current values on every render rather than accumulated as the parent advances.
 * That is what makes Back correct: switching from absence to travel on step 2 removes the
 * certificate questions immediately, even though the form still holds `withMedical` from before.
 *
 * One question per step is deliberate. Putting these on one screen produces a form that visibly
 * rearranges itself while someone is filling it in, which reads as broken.
 */
export function visibleSteps(values: DeclarationFormValues): StepId[] {
  const isTravel = values.declarationType === "travel";

  return [
    "who",
    "type",
    "when",
    ...(isTravel ? (["destination"] as const) : (["certificate"] as const)),
    // Only reachable on the absence branch, so `withMedical` left over from a switched-away
    // absence cannot resurrect the upload on a travel declaration.
    ...(!isTravel && values.withMedical ? (["attach"] as const) : []),
    "note",
    "review",
  ];
}

const STEP_FIELDS: Record<StepId, Array<keyof DeclarationFormValues>> = {
  who: ["studentNumbers"],
  type: ["declarationType"],
  when: ["startDate", "endDate"],
  certificate: ["withMedical"],
  attach: ["evidencePath", "evidenceUrl"],
  destination: ["destinationCountry", "destinationCity"],
  note: ["parentNote"],
  review: [],
};

/** The fields to validate before leaving a step — not the whole form, which is mostly unanswered. */
export function fieldsForStep(step: StepId): Array<keyof DeclarationFormValues> {
  return STEP_FIELDS[step];
}
