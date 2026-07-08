/**
 * Re-anchors a Date at UTC midnight of its local calendar day.
 *
 * Form dates reach Supabase through postgrest's JSON serialization (Date#toISOString, UTC), so
 * every Date held in form state must be UTC-midnight of the intended day. react-day-picker's
 * onSelect hands back a LOCAL-midnight Date — in any UTC+ timezone (Singapore is UTC+8) that
 * serializes to 16:00Z of the PREVIOUS day. Every calendar onSelect must pass through here.
 */
export function toUTCDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}
