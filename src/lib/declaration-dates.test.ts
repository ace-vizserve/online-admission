/**
 * The SIS sends date-only strings ("2026-09-16"). Parsing those as UTC and rendering them in a
 * local timezone shifts the day, which on this feature would misreport which day a child was
 * away — so these assertions pin the day itself, not just the formatting.
 */
import { describe, expect, it } from "vitest";
import { formatDeclarationDateRange } from "./declaration-dates";

describe("formatDeclarationDateRange", () => {
  it("shows a single day once, not as a range of one", () => {
    expect(formatDeclarationDateRange("2026-09-16", "2026-09-16")).toBe("16 Sep 2026");
  });

  it("shows a range within one month without repeating the month", () => {
    expect(formatDeclarationDateRange("2026-09-16", "2026-09-18")).toBe("16 – 18 Sep 2026");
  });

  it("spells out both months when the range crosses one", () => {
    expect(formatDeclarationDateRange("2026-11-28", "2026-12-03")).toBe("28 Nov – 3 Dec 2026");
  });

  it("spells out both years when the range crosses one", () => {
    expect(formatDeclarationDateRange("2026-12-20", "2027-01-05")).toBe("20 Dec 2026 – 5 Jan 2027");
  });

  it("keeps the calendar day the SIS sent, regardless of the viewer's timezone", () => {
    // A UTC-parsed "2026-01-01" renders as 31 Dec in any negative offset.
    expect(formatDeclarationDateRange("2026-01-01", "2026-01-01")).toBe("1 Jan 2026");
  });
});
