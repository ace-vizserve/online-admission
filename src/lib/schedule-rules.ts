/**
 * Single source of truth for the class level + class type → preferred schedule rules used by every HFSE-IS
 * enrolment form (new student, re-enrolment, open house, and the public completion page).
 *
 * Both the schedule dropdown and the submit-time guard in those forms are derived from
 * `scheduleOptionsForLevel`, so they can never disagree. The VizSchool flows have their own
 * schedule handling and deliberately do not use this module.
 */

export const MORNING_AFTERNOON_CLASS_LEVEL = [
  "YoungStarter Little Star",
  "YoungStarter Junior Star",

  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",

  "HFSE International Education Programme – Year 1 (equivalent to K2)",
  "HFSE International Education Programme – Year 2 (equivalent to Primary One)",
];

export const WHOLE_DAY_CLASS_LEVEL = [
  "Secondary One",
  "Secondary Two",
  "Secondary Three",
  "Secondary Four",

  "HFSE International Education Programme – Year 8",
  "HFSE International Education Programme – Year 9",
  "HFSE International Education Programme – Year 10",
];

/**
 * Capacity restriction: morning intake is full for the Standard Class track at these levels, so
 * only Afternoon is offered there. The levels stay in MORNING_AFTERNOON_CLASS_LEVEL and every other
 * track at the same level (the GLOBAL language classes, Enrichment, Cambridge) keeps both
 * schedules — this list narrows the set for one class type, it does not replace it.
 * Empty this array to restore Morning once classroom capacity frees up.
 */
export const AFTERNOON_ONLY_CLASS_LEVEL = ["Primary Two", "Primary Three", "Primary Four", "Primary Six"];

/** The one class type the capacity restriction above applies to, spelled as every HFSE-IS form renders it. */
export const AFTERNOON_ONLY_CLASS_TYPE = "Standard Class (ENGLISH + FILIPINO)";

/**
 * `classType` is required rather than optional so a caller that forgets to pass it fails the build
 * instead of silently skipping the capacity restriction. Pass "" before a class type has been
 * chosen: the restriction then does not apply and both schedules stay on offer.
 */
export function scheduleOptionsForLevel(level: string, classType: string): string[] {
  if (WHOLE_DAY_CLASS_LEVEL.includes(level)) return ["Whole Day"];
  if (AFTERNOON_ONLY_CLASS_LEVEL.includes(level) && classType === AFTERNOON_ONLY_CLASS_TYPE) return ["Afternoon"];
  if (MORNING_AFTERNOON_CLASS_LEVEL.includes(level)) return ["Morning", "Afternoon"];
  return [];
}
