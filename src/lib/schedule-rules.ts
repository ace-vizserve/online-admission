/**
 * Single source of truth for the class level → preferred schedule rules used by every HFSE-IS
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
 * Capacity restriction: morning intake is full for these levels, so only Afternoon is offered.
 * They stay in MORNING_AFTERNOON_CLASS_LEVEL — this list narrows that set, it does not replace it.
 * Empty this array to restore Morning once classroom capacity frees up.
 */
export const AFTERNOON_ONLY_CLASS_LEVEL = ["Primary Two", "Primary Three", "Primary Six"];

export function scheduleOptionsForLevel(level: string): string[] {
  if (WHOLE_DAY_CLASS_LEVEL.includes(level)) return ["Whole Day"];
  if (AFTERNOON_ONLY_CLASS_LEVEL.includes(level)) return ["Afternoon"];
  if (MORNING_AFTERNOON_CLASS_LEVEL.includes(level)) return ["Morning", "Afternoon"];
  return [];
}
