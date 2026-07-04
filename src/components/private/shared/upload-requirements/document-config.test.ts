/**
 * Config-level coverage for the shared upload-requirements policy table — the replacement for
 * the hand-written `{name === "..."}` branches and `NOT_FILE_INPUTS`/`TO_FOLLOW_DOCS` constants
 * that used to be re-declared (and drift) in each of the 10 duplicated dialog files.
 */
import { describe, expect, it } from "vitest";

import {
  PARENT_GUARDIAN_DOCUMENTS,
  STUDENT_DOCUMENTS,
  notFileInputFields,
  siblingFields,
} from "./document-config";

describe("siblingFields", () => {
  it("returns no sibling fields for a plain document (idPicture, birthCert, etc.)", () => {
    const cfg = STUDENT_DOCUMENTS.find((d) => d.name === "idPicture")!;
    expect(siblingFields(cfg)).toEqual({});
  });

  it("derives {number, expiry} for a passportNumber+expiry document", () => {
    const cfg = STUDENT_DOCUMENTS.find((d) => d.name === "passport")!;
    expect(siblingFields(cfg)).toEqual({ number: "passportNumber", expiry: "passportExpiry" });
  });

  it("derives {type, expiry} for a passType+expiry document", () => {
    const cfg = STUDENT_DOCUMENTS.find((d) => d.name === "pass")!;
    expect(siblingFields(cfg)).toEqual({ type: "passType", expiry: "passExpiry" });
  });

  it("prefixes sibling names per parent/guardian document (motherPassport -> motherPassportNumber/Expiry)", () => {
    const cfg = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "motherPassport")!;
    expect(siblingFields(cfg)).toEqual({ number: "motherPassportNumber", expiry: "motherPassportExpiry" });

    const passCfg = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "fatherPass")!;
    expect(siblingFields(passCfg)).toEqual({ type: "fatherPassType", expiry: "fatherPassExpiry" });
  });
});

describe("notFileInputFields", () => {
  it("collects every sibling field across a config list, excluding plain documents", () => {
    const fields = notFileInputFields(STUDENT_DOCUMENTS);

    expect(fields).toEqual(
      expect.arrayContaining(["passportNumber", "passportExpiry", "passType", "passExpiry"]),
    );
    // idPicture/birthCert/educCert/medical are "plain" and contribute nothing.
    expect(fields).toHaveLength(4);
  });

  it("covers all 6 parent/guardian documents (mother/father/guardian x pass/passport)", () => {
    const fields = notFileInputFields(PARENT_GUARDIAN_DOCUMENTS);

    for (const prefix of ["mother", "father", "guardian"]) {
      expect(fields).toContain(`${prefix}PassportNumber`);
      expect(fields).toContain(`${prefix}PassportExpiry`);
      expect(fields).toContain(`${prefix}PassType`);
      expect(fields).toContain(`${prefix}PassExpiry`);
    }
  });
});

describe("document copy regressions", () => {
  it("never has a double-spaced number placeholder (regression: 'Enter  passport number' typo)", () => {
    const allConfigs = [...STUDENT_DOCUMENTS, ...PARENT_GUARDIAN_DOCUMENTS];
    for (const cfg of allConfigs) {
      if (cfg.numberPlaceholder) {
        expect(cfg.numberPlaceholder).not.toMatch(/ {2,}/);
      }
    }
  });

  it("gives each parent/guardian document a description naming the correct prefix", () => {
    const motherPass = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "motherPass")!;
    const fatherPass = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "fatherPass")!;
    const guardianPass = PARENT_GUARDIAN_DOCUMENTS.find((d) => d.name === "guardianPass")!;

    expect(motherPass.description).toMatch(/mother/i);
    expect(fatherPass.description).toMatch(/father/i);
    expect(guardianPass.description).toMatch(/guardian/i);
  });
});
