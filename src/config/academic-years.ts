/**
 * Single source of truth for academic years.
 *
 * Two deliberately separate lists, because "what a parent may enrol into" and
 * "what the system still recognizes" are different concerns:
 *
 *  - PARENT_FACING_ACADEMIC_YEARS — years parents can enrol into. Drives the
 *    user-facing selectors (enrolment dropdown, open-house picker, etc.).
 *  - BACKEND_ACADEMIC_YEARS — every year the system recognizes, including
 *    historical ones that are no longer open for enrolment. Drives route-guard
 *    validation and per-year table iteration. Ordered newest-first so backend
 *    loops scan the most recent year first.
 *
 * To open a new academic year: add it to BACKEND_ACADEMIC_YEARS, and to
 * PARENT_FACING_ACADEMIC_YEARS once it's ready to accept enrolments.
 */

export type ParentFacingAcademicYear = {
  /** Internal value / table prefix, e.g. "ay2026". */
  value: string;
  /** Short label for compact UI, e.g. "2026". */
  label: string;
  /** Display name, e.g. "AY 2026". */
  name: string;
  /** The year currently in session (used for "Current Year" badges and fallbacks). */
  isCurrent: boolean;
};

export const PARENT_FACING_ACADEMIC_YEARS: ParentFacingAcademicYear[] = [
  { value: "ay2026", label: "2026", name: "AY 2026", isCurrent: true },
  { value: "ay2027", label: "2027", name: "AY 2027", isCurrent: false },
];

/** Every recognized academic year (incl. historical), newest first. */
export const BACKEND_ACADEMIC_YEARS: string[] = ["ay2027", "ay2026", "ay2025"];

/** VizSchool mirrors the same years behind a `vizschool-` prefix. */
export const VIZSCHOOL_ACADEMIC_YEARS: string[] = BACKEND_ACADEMIC_YEARS.map((ay) => `vizschool-${ay}`);

/** The academic year currently in session — used as a sensible default/fallback. */
export const CURRENT_ACADEMIC_YEAR: string =
  PARENT_FACING_ACADEMIC_YEARS.find((ay) => ay.isCurrent)?.value ?? PARENT_FACING_ACADEMIC_YEARS[0].value;
