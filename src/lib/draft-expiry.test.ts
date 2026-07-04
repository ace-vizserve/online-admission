import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isExpired, isExpiringSoon } from "./draft-storage";

// Freeze time at a fixed point so assertions are deterministic.
const FIXED_NOW = new Date("2024-06-15T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// isExpired
// ---------------------------------------------------------------------------

describe("isExpired", () => {
  it("returns false for a future expiry", () => {
    expect(isExpired("2024-06-16T12:00:00Z")).toBe(false);
  });

  it("returns true for a past expiry", () => {
    expect(isExpired("2024-06-14T12:00:00Z")).toBe(true);
  });

  it("returns false at exact boundary (strict < comparison)", () => {
    // expiresAt === now: the expiry instant has arrived but is NOT in the past
    expect(isExpired(FIXED_NOW.toISOString())).toBe(false);
  });

  it("returns true one millisecond past expiry", () => {
    const oneSecondAgo = new Date(FIXED_NOW.getTime() - 1000).toISOString();
    expect(isExpired(oneSecondAgo)).toBe(true);
  });

  // --- fail-safe cases (post-fix): treat untrustworthy expiry as expired ---

  it("returns true when expiresAt is undefined (fail-safe)", () => {
    expect(isExpired(undefined)).toBe(true);
  });

  it("returns true when expiresAt is an empty string (fail-safe)", () => {
    // Empty string is falsy — same code path as undefined
    expect(isExpired("" as unknown as undefined)).toBe(true);
  });

  it("returns true for a garbage/non-date string (NaN path, fail-safe)", () => {
    expect(isExpired("not-a-date")).toBe(true);
    expect(isExpired("NaN")).toBe(true);
    expect(isExpired("undefined")).toBe(true);
  });

  // --- Date object overload ---

  it("accepts a Date object — future", () => {
    expect(isExpired(new Date("2024-06-16T12:00:00Z"))).toBe(false);
  });

  it("accepts a Date object — past", () => {
    expect(isExpired(new Date("2024-06-14T12:00:00Z"))).toBe(true);
  });

  it("returns true for an Invalid Date object (fail-safe)", () => {
    expect(isExpired(new Date("bad"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isExpiringSoon
// ---------------------------------------------------------------------------

describe("isExpiringSoon", () => {
  it("returns true when expiry is within the default 5-day window", () => {
    // 2 days from now — within 5-day window
    expect(isExpiringSoon("2024-06-17T12:00:00Z")).toBe(true);
  });

  it("returns true at the edge of the 5-day window (inclusive end)", () => {
    // Exactly 5 days from now at same time
    expect(isExpiringSoon("2024-06-20T12:00:00Z")).toBe(true);
  });

  it("returns false when expiry is beyond the 5-day window", () => {
    // 10 days from now — outside default 5-day window
    expect(isExpiringSoon("2024-06-25T12:00:00Z")).toBe(false);
  });

  it("returns false when already expired (not 'expiring soon')", () => {
    expect(isExpiringSoon("2024-06-14T12:00:00Z")).toBe(false);
  });

  // --- corrupt / missing expiry: not "expiring soon" ---

  it("returns false for undefined expiresAt (not 'expiring soon')", () => {
    expect(isExpiringSoon(undefined)).toBe(false);
  });

  it("returns false for a corrupt string (not 'expiring soon')", () => {
    expect(isExpiringSoon("not-a-date")).toBe(false);
  });

  // --- custom days window ---

  it("respects a custom 10-day window — inside", () => {
    expect(isExpiringSoon("2024-06-20T12:00:00Z", 10)).toBe(true);
  });

  it("respects a custom 10-day window — outside", () => {
    expect(isExpiringSoon("2024-06-30T12:00:00Z", 10)).toBe(false);
  });

  // --- Date object overload ---

  it("accepts a Date object — within window", () => {
    expect(isExpiringSoon(new Date("2024-06-17T12:00:00Z"))).toBe(true);
  });

  it("accepts a Date object — beyond window", () => {
    expect(isExpiringSoon(new Date("2024-06-25T12:00:00Z"))).toBe(false);
  });
});
