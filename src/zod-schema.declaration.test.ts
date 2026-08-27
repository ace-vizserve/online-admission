/**
 * Client-side mirror of the SIS's own rules. The SIS enforces all of these anyway; validating
 * here is so the parent is corrected while they can still fix it, rather than after submitting.
 */
import { describe, expect, it } from "vitest";
import { declarationSchema } from "./zod-schema";

const TODAY = "2026-09-16";
const base = {
  declarationType: "absence" as const,
  studentNumbers: ["H250123"],
  startDate: TODAY,
  endDate: TODAY,
  withMedical: false,
  evidencePath: "",
  evidenceUrl: "",
  destinationCountry: "",
  destinationCity: "",
  parentNote: "",
};

/** The error message attached to `field`, or undefined when that field validated cleanly. */
function errorFor(overrides: Record<string, unknown>, field: string) {
  const result = declarationSchema.safeParse({ ...base, ...overrides });
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join(".") === field)?.message;
}

const isValid = (overrides: Record<string, unknown> = {}) =>
  declarationSchema.safeParse({ ...base, ...overrides }).success;

describe("declarationSchema — who", () => {
  it("accepts a single child", () => {
    expect(isValid()).toBe(true);
  });

  it("requires at least one child", () => {
    expect(errorFor({ studentNumbers: [] }, "studentNumbers")).toMatch(/\S/);
  });

  it("rejects more children than the server accepts", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `H25${i}`);
    expect(errorFor({ studentNumbers: eleven }, "studentNumbers")).toMatch(/\S/);
  });

  it("rejects the same child twice", () => {
    expect(errorFor({ studentNumbers: ["H250123", "H250123"] }, "studentNumbers")).toMatch(/\S/);
  });
});

describe("declarationSchema — when", () => {
  it("accepts a single day, the common case", () => {
    expect(isValid({ startDate: TODAY, endDate: TODAY })).toBe(true);
  });

  it("requires a first day", () => {
    expect(errorFor({ startDate: "" }, "startDate")).toMatch(/\S/);
  });

  it("rejects an end date before the start date", () => {
    expect(errorFor({ startDate: "2026-09-18", endDate: "2026-09-16" }, "endDate")).toMatch(/\S/);
  });

  it("rejects a range longer than 60 days", () => {
    expect(errorFor({ startDate: "2026-09-01", endDate: "2026-11-30" }, "endDate")).toMatch(/\S/);
  });

  it("rejects a start date far in the past", () => {
    expect(errorFor({ startDate: "2020-01-01", endDate: "2020-01-01" }, "startDate")).toMatch(/\S/);
  });
});

describe("declarationSchema — the certificate", () => {
  it("accepts an absence with no certificate", () => {
    expect(isValid({ withMedical: false })).toBe(true);
  });

  it("requires something attached once a certificate is declared", () => {
    expect(errorFor({ withMedical: true }, "evidenceUrl")).toMatch(/\S/);
  });

  it("accepts an uploaded certificate alone", () => {
    expect(isValid({ withMedical: true, evidencePath: "declarations/a/b.pdf" })).toBe(true);
  });

  it("accepts a digital MC link alone", () => {
    expect(isValid({ withMedical: true, evidenceUrl: "https://mc.gov.sg/xxxx" })).toBe(true);
  });

  it("rejects an insecure link, which the SIS will not store", () => {
    expect(errorFor({ withMedical: true, evidenceUrl: "http://mc.gov.sg/xxxx" }, "evidenceUrl")).toMatch(/\S/);
  });
});

describe("declarationSchema — travel", () => {
  const travel = { declarationType: "travel" as const };

  it("requires a destination country", () => {
    expect(errorFor({ ...travel, destinationCountry: "" }, "destinationCountry")).toMatch(/\S/);
  });

  it("accepts a country with no city, since city is optional", () => {
    expect(isValid({ ...travel, destinationCountry: "Malaysia", destinationCity: "" })).toBe(true);
  });

  it("does not demand a certificate on a travel declaration", () => {
    expect(isValid({ ...travel, destinationCountry: "Japan", withMedical: true })).toBe(true);
  });
});

describe("declarationSchema — the note", () => {
  it("accepts an empty note", () => {
    expect(isValid({ parentNote: "" })).toBe(true);
  });

  it("rejects a note longer than 300 characters", () => {
    expect(errorFor({ parentNote: "x".repeat(301) }, "parentNote")).toMatch(/\S/);
  });
});
