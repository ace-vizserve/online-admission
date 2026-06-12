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

/**
 * Resolve the academic year an enrolee number belongs to, or `null` if it can't
 * be parsed / matched.
 *
 * Enrolee numbers embed the year's last two digits right after the "E"
 * (e.g. "E26####"), because they're generated as `E${academicYear.slice(-2)}…`.
 * We match that suffix back against BACKEND_ACADEMIC_YEARS — the true inverse of
 * generation — instead of assuming the century is "20". That keeps it correct for
 * any year in the config (e.g. a test "ay9999" resolves from "E99####", not "ay2099").
 */
export function tryAcademicYearFromEnroleeNumber(enroleeNumber: string | null | undefined): string | null {
  if (!enroleeNumber) return null;
  const match = enroleeNumber.match(/E(\d{2})/);
  if (!match) return null;
  return BACKEND_ACADEMIC_YEARS.find((ay) => ay.slice(-2) === match[1]) ?? null;
}

/** Like {@link tryAcademicYearFromEnroleeNumber}, but throws on an unparseable / unknown enrolee number. */
export function academicYearFromEnroleeNumber(enroleeNumber: string): string {
  const academicYear = tryAcademicYearFromEnroleeNumber(enroleeNumber);
  if (!academicYear) throw new Error(`Invalid or unrecognized enrolee number: "${enroleeNumber}"`);
  return academicYear;
}
