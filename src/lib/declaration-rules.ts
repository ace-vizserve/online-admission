import { differenceInCalendarDays, parseISO } from "date-fns";

/** Children per submission. Siblings catching the same thing is the expected case. */
export const MAX_STUDENTS = 10;
/** Longest range the SIS accepts, counting both end days. */
export const MAX_RANGE_DAYS = 60;
/** How far back a filing may reach — a sick day is usually declared after the fact. */
export const MAX_DAYS_IN_PAST = 30;
/** How far ahead a filing may reach, for travel booked well in advance. */
export const MAX_DAYS_AHEAD = 365;
export const MAX_NOTE_LENGTH = 300;

/**
 * Length of a declaration in days, counting BOTH end days: a single-day absence is 1, not 0.
 *
 * `parseISO` reads date-only strings as local midnight; `differenceInCalendarDays` then compares
 * calendar days rather than elapsed hours, so a daylight-saving shift inside the range cannot
 * round the count down.
 */
export function rangeLengthDays(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
}

/**
 * Why this start date is outside the window the SIS will accept, or null when it is fine.
 *
 * Returns the message rather than a boolean so the caller has something to show; the SIS's own
 * wording wins on a 400, but this fires before the request is ever made.
 */
export function filingWindowError(startDate: string, today: Date): string | null {
  const daysFromToday = differenceInCalendarDays(parseISO(startDate), today);

  if (daysFromToday < -MAX_DAYS_IN_PAST) {
    return `The first day cannot be more than ${MAX_DAYS_IN_PAST} days in the past.`;
  }
  if (daysFromToday > MAX_DAYS_AHEAD) {
    return "The first day cannot be more than a year from now.";
  }
  return null;
}
