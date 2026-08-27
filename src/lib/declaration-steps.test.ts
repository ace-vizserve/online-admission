/**
 * Which questions the wizard asks depends on the answers already given: a travel declaration
 * asks nothing about medical certificates, and "no certificate" hides the upload entirely.
 *
 * Keeping that as a pure function is what lets the Back button work — the step list is derived
 * from the current values rather than from a history of what was shown.
 */
import { describe, expect, it } from "vitest";
import type { DeclarationFormValues } from "@/actions/declaration-payload";
import { fieldsForStep, visibleSteps } from "./declaration-steps";

function values(overrides: Partial<DeclarationFormValues> = {}): DeclarationFormValues {
  return {
    declarationType: "absence",
    studentNumbers: [],
    startDate: "",
    endDate: "",
    withMedical: false,
    evidencePath: "",
    evidenceUrl: "",
    destinationCountry: "",
    destinationCity: "",
    parentNote: "",
    ...overrides,
  };
}

describe("visibleSteps", () => {
  it("always starts by asking who it is about and ends at the review", () => {
    const steps = visibleSteps(values());

    expect(steps[0]).toBe("who");
    expect(steps[steps.length - 1]).toBe("review");
  });

  it("asks about a medical certificate on an absence", () => {
    expect(visibleSteps(values({ declarationType: "absence" }))).toContain("certificate");
  });

  it("never asks a travelling family about medical certificates", () => {
    const steps = visibleSteps(values({ declarationType: "travel" }));

    expect(steps).not.toContain("certificate");
    expect(steps).not.toContain("attach");
  });

  it("only asks for the attachment once a certificate is declared", () => {
    expect(visibleSteps(values({ withMedical: false }))).not.toContain("attach");
    expect(visibleSteps(values({ withMedical: true }))).toContain("attach");
  });

  it("asks where they are going only on a travel declaration", () => {
    expect(visibleSteps(values({ declarationType: "travel" }))).toContain("destination");
    expect(visibleSteps(values({ declarationType: "absence" }))).not.toContain("destination");
  });

  it("drops the attachment question when a parent switches from absence to travel", () => {
    // The form keeps withMedical from the absence branch; the step list must not.
    const steps = visibleSteps(values({ declarationType: "travel", withMedical: true }));

    expect(steps).not.toContain("attach");
  });

  it("keeps the questions in the order the parent expects", () => {
    expect(visibleSteps(values({ declarationType: "absence", withMedical: true }))).toEqual([
      "who",
      "type",
      "when",
      "certificate",
      "attach",
      "note",
      "review",
    ]);

    expect(visibleSteps(values({ declarationType: "travel" }))).toEqual([
      "who",
      "type",
      "when",
      "destination",
      "note",
      "review",
    ]);
  });
});

describe("fieldsForStep", () => {
  it("validates only the fields that step actually asked about", () => {
    expect(fieldsForStep("who")).toEqual(["studentNumbers"]);
    expect(fieldsForStep("when")).toEqual(["startDate", "endDate"]);
    expect(fieldsForStep("destination")).toEqual(["destinationCountry", "destinationCity"]);
  });

  it("asks for nothing on the review step, which only reads back", () => {
    expect(fieldsForStep("review")).toEqual([]);
  });
});
