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
 * Timetable rule: the Global tracks only ever run in the morning, so they are offered Morning alone at
 * every Morning/Afternoon level. Matched as a substring rather than an explicit list of labels so a
 * newly added Global variant is covered the day it appears in `classTypes`, without a change here.
 * Whole-day levels are resolved before this rule, so a Global track at Secondary stays Whole Day.
 */
export const MORNING_ONLY_CLASS_TYPE_MARKER = "global";

/**
 * Capacity restriction: morning intake is full for the Standard Class track at these levels, so
 * only Afternoon is offered there. The levels stay in MORNING_AFTERNOON_CLASS_LEVEL and every other
 * track at the same level (the Global classes, Enrichment) is unaffected — this list narrows the set
 * for one class type, it does not replace it.
 * Empty this array to restore Morning once classroom capacity frees up.
 */
export const AFTERNOON_ONLY_CLASS_LEVEL = ["Primary Two", "Primary Three", "Primary Four", "Primary Six"];

/** The one class type the capacity restriction above applies to, spelled as every HFSE-IS form renders it. */
export const AFTERNOON_ONLY_CLASS_TYPE = "Standard Class (ENGLISH + FILIPINO)";

/**
 * `classType` is required rather than optional so a caller that forgets to pass it fails the build
 * instead of silently skipping the restrictions. Pass "" before a class type has been chosen: neither
 * restriction then applies and both schedules stay on offer.
 *
 * It is nonetheless normalised defensively, because the dropdowns call this with
 * `form.watch("classType")`, which React Hook Form types as a string but resolves to undefined on the
 * first render of a form with no seeded class type.
 */
export function scheduleOptionsForLevel(level: string, classType: string): string[] {
  if (WHOLE_DAY_CLASS_LEVEL.includes(level)) return ["Whole Day"];
  if (!MORNING_AFTERNOON_CLASS_LEVEL.includes(level)) return [];

  const chosenClassType = classType ?? "";
  if (chosenClassType.toLowerCase().includes(MORNING_ONLY_CLASS_TYPE_MARKER)) return ["Morning"];
  if (AFTERNOON_ONLY_CLASS_LEVEL.includes(level) && chosenClassType === AFTERNOON_ONLY_CLASS_TYPE) {
    return ["Afternoon"];
  }

  return ["Morning", "Afternoon"];
}
