/**
 * The SIS enforces every one of these server-side. Mirroring them client-side is not about trust
 * — it is so a parent is told "that is more than 60 days" while they can still fix it, rather
 * than after they have filled in the whole form and pressed submit.
 */
import { describe, expect, it } from "vitest";
import {
  MAX_NOTE_LENGTH,
  MAX_RANGE_DAYS,
  MAX_STUDENTS,
  filingWindowError,
  rangeLengthDays,
  singaporeDate,
} from "./declaration-rules";

describe("rangeLengthDays", () => {
  it("counts a single day as one day, not zero", () => {
    expect(rangeLengthDays("2026-09-16", "2026-09-16")).toBe(1);
  });

  it("counts both ends of a range", () => {
    expect(rangeLengthDays("2026-09-16", "2026-09-18")).toBe(3);
  });

  it("counts across a month boundary", () => {
    expect(rangeLengthDays("2026-11-28", "2026-12-03")).toBe(6);
  });

  it("counts a full 60-day range as exactly the limit", () => {
    expect(rangeLengthDays("2026-09-01", "2026-10-30")).toBe(MAX_RANGE_DAYS);
  });
});

describe("filingWindowError", () => {
  const today = "2026-09-16";

  it("accepts today", () => {
    expect(filingWindowError("2026-09-16", today)).toBeNull();
  });

  it("accepts a recent past absence, which is the common case for a sick child", () => {
    expect(filingWindowError("2026-09-10", today)).toBeNull();
  });

  it("accepts a trip planned months ahead", () => {
    expect(filingWindowError("2027-06-01", today)).toBeNull();
  });

  it("rejects a start date more than 30 days in the past", () => {
    expect(filingWindowError("2026-07-01", today)).toMatch(/\S/);
  });

  it("rejects a start date more than a year ahead", () => {
    expect(filingWindowError("2028-01-01", today)).toMatch(/\S/);
  });

  it("accepts the exact boundaries rather than rejecting them off by one", () => {
    expect(filingWindowError("2026-08-17", today)).toBeNull();
    expect(filingWindowError("2027-09-16", today)).toBeNull();
  });
});

describe("limits", () => {
  it("matches the server's caps", () => {
    expect(MAX_STUDENTS).toBe(10);
    expect(MAX_RANGE_DAYS).toBe(60);
    expect(MAX_NOTE_LENGTH).toBe(300);
  });
});

describe("singaporeDate", () => {
  it("gives the calendar day in Singapore, not the device's", () => {
    // 17:30 UTC is already the next morning in Singapore (UTC+8). A device in London filing at
    // that moment would otherwise disagree with the server about which days are offerable —
    // and this is the travel feature, so a parent abroad is the expected case.
    expect(singaporeDate(new Date("2026-09-16T17:30:00Z"))).toBe("2026-09-17");
  });

  it("still gives the same day when the device is already on it", () => {
    expect(singaporeDate(new Date("2026-09-16T02:00:00Z"))).toBe("2026-09-16");
  });

  it("formats as the YYYY-MM-DD the API compares as text", () => {
    expect(singaporeDate(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
  });
});
