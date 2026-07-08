/**
 * Unit coverage for `toUTCDateOnly` — the save-path date normalizer. Form dates reach Supabase
 * implicitly through postgrest's JSON.stringify → Date#toISOString() (UTC), so any Date held in
 * form state MUST be UTC-midnight of the intended calendar day: a local-midnight Date (what
 * react-day-picker's onSelect returns) serializes to the PREVIOUS day for every timezone east
 * of UTC (e.g. Singapore, UTC+8, where local midnight is 16:00Z of the day before).
 */
import { describe, expect, it } from "vitest";

import { toUTCDateOnly } from "./dates";

describe("toUTCDateOnly", () => {
  it("re-anchors a local-midnight date to UTC midnight of the same calendar day", () => {
    const picked = new Date(2026, 6, 8); // 8 July 2026, local midnight — react-day-picker's onSelect shape

    expect(toUTCDateOnly(picked).toISOString()).toBe("2026-07-08T00:00:00.000Z");
  });

  it("keeps the calendar day regardless of the input's time of day", () => {
    const almostMidnight = new Date(2026, 0, 31, 23, 59, 59);

    expect(toUTCDateOnly(almostMidnight).toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("returns a new Date without mutating the input", () => {
    const picked = new Date(2015, 11, 25, 10, 30);

    const normalized = toUTCDateOnly(picked);

    expect(normalized).not.toBe(picked);
    expect(picked.getHours()).toBe(10);
  });
});
