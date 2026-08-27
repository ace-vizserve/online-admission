/**
 * The absence and travel payload shapes are strict and must not be mixed: sending `withMedical`
 * on a travel declaration, or `destinationCountry` on an absence, is REJECTED by the SIS rather
 * than ignored. Since one form feeds both branches, dropping the other branch's fields is this
 * function's whole job — so these tests assert on absence of keys, not just their values.
 */
import { describe, expect, it } from "vitest";
import { toDeclarationPayload, type DeclarationFormValues } from "./declaration-payload";

function values(overrides: Partial<DeclarationFormValues> = {}): DeclarationFormValues {
  return {
    declarationType: "absence",
    studentNumbers: ["H250123"],
    startDate: "2026-09-16",
    endDate: "2026-09-18",
    withMedical: false,
    evidencePath: "",
    evidenceUrl: "",
    destinationCountry: "",
    destinationCity: "",
    parentNote: "",
    ...overrides,
  };
}

describe("toDeclarationPayload — absence", () => {
  it("sends the absence fields", () => {
    expect(toDeclarationPayload(values({ withMedical: true, evidenceUrl: "https://mc.gov.sg/xxxx" }))).toEqual({
      declarationType: "absence",
      studentNumbers: ["H250123"],
      startDate: "2026-09-16",
      endDate: "2026-09-18",
      withMedical: true,
      evidenceUrl: "https://mc.gov.sg/xxxx",
    });
  });

  it("never leaks travel fields onto an absence, even when the form holds them", () => {
    const payload = toDeclarationPayload(
      values({ destinationCountry: "Malaysia", destinationCity: "Penang" }),
    );

    expect(payload).not.toHaveProperty("destinationCountry");
    expect(payload).not.toHaveProperty("destinationCity");
  });

  it("omits evidence fields entirely when there is no medical certificate", () => {
    const payload = toDeclarationPayload(values({ withMedical: false }));

    expect(payload).not.toHaveProperty("evidencePath");
    expect(payload).not.toHaveProperty("evidenceUrl");
    expect(payload).toMatchObject({ withMedical: false });
  });

  it("sends both an upload and a link when the parent supplied both", () => {
    const payload = toDeclarationPayload(
      values({ withMedical: true, evidencePath: "declarations/a/b.pdf", evidenceUrl: "https://mc.gov.sg/x" }),
    );

    expect(payload).toMatchObject({ evidencePath: "declarations/a/b.pdf", evidenceUrl: "https://mc.gov.sg/x" });
  });
});

describe("toDeclarationPayload — travel", () => {
  it("sends the travel fields", () => {
    const payload = toDeclarationPayload(
      values({
        declarationType: "travel",
        studentNumbers: ["H250123", "H250124"],
        destinationCountry: "Malaysia",
        destinationCity: "Penang",
      }),
    );

    expect(payload).toEqual({
      declarationType: "travel",
      studentNumbers: ["H250123", "H250124"],
      startDate: "2026-09-16",
      endDate: "2026-09-18",
      destinationCountry: "Malaysia",
      destinationCity: "Penang",
    });
  });

  it("never leaks absence fields onto a travel declaration", () => {
    const payload = toDeclarationPayload(
      values({
        declarationType: "travel",
        destinationCountry: "Malaysia",
        withMedical: true,
        evidencePath: "declarations/a/b.pdf",
        evidenceUrl: "https://mc.gov.sg/x",
      }),
    );

    expect(payload).not.toHaveProperty("withMedical");
    expect(payload).not.toHaveProperty("evidencePath");
    expect(payload).not.toHaveProperty("evidenceUrl");
  });

  it("omits the city when only a country was given, since city is optional", () => {
    const payload = toDeclarationPayload(
      values({ declarationType: "travel", destinationCountry: "Japan", destinationCity: "" }),
    );

    expect(payload).not.toHaveProperty("destinationCity");
    expect(payload).toMatchObject({ destinationCountry: "Japan" });
  });
});

describe("toDeclarationPayload — the note", () => {
  it("omits an untouched note rather than sending an empty string", () => {
    expect(toDeclarationPayload(values({ parentNote: "" }))).not.toHaveProperty("parentNote");
  });

  it("omits a note that is only whitespace", () => {
    expect(toDeclarationPayload(values({ parentNote: "   " }))).not.toHaveProperty("parentNote");
  });

  it("trims a real note", () => {
    expect(toDeclarationPayload(values({ parentNote: "  Fever since Monday.  " }))).toMatchObject({
      parentNote: "Fever since Monday.",
    });
  });
});
