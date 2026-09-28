/**
 * Consent fields are explicit Yes/No answers: `false` ("No") is valid, unanswered is not.
 * A father's or guardian's consent is only required when that person's details are given.
 */
import { describe, expect, it } from "vitest";

import {
  CONSENT_REQUIRED_MESSAGE,
  enrollmentInformationSchema,
  fatherInformationSchema,
  guardianInformationSchema,
  medicalChecklistSchema,
  motherInformationSchema,
} from "@/zod-schema";

const FATHER = {
  fatherFirstName: "Jose",
  fatherLastName: "Dela Cruz",
  fatherPreferredName: "Jose",
  fatherBirthDay: new Date("1983-02-01"),
  fatherNationality: "Singaporean",
  fatherReligion: "Catholic",
  fatherNric: "S1234568B",
  fatherMobile: "65222222",
  fatherEmail: "jose@example.com",
  fatherCompanyName: "Acme Pte Ltd",
  fatherPosition: "Engineer",
  noFatherInfo: false,
};

const MOTHER = {
  motherFirstName: "Maria",
  motherLastName: "Dela Cruz",
  motherPreferredName: "Maria",
  motherBirthDay: new Date("1985-03-01"),
  motherNationality: "Singaporean",
  motherReligion: "Catholic",
  motherNric: "S1234567A",
  motherMobile: "65111111",
  motherEmail: "maria@example.com",
  motherCompanyName: "Acme Pte Ltd",
  motherPosition: "Manager",
};

const GUARDIAN = {
  guardianFirstName: "Ana",
  guardianLastName: "Santos",
  guardianPreferredName: "Ana",
  guardianBirthDay: new Date("1980-01-01"),
  guardianNationality: "Singaporean",
  guardianReligion: "Catholic",
  guardianNric: "S1234569C",
  guardianMobile: "65333333",
  guardianEmail: "ana@example.com",
  guardianCompanyName: "Acme Pte Ltd",
  guardianPosition: "Director",
  noGuardianInfo: false,
};

function consentIssue(result: { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } }, path: string) {
  return result.error?.issues.find((issue) => issue.path.join(".") === path);
}

describe.each([
  ["mother", motherInformationSchema, MOTHER, "motherWhatsappTeamsConsent"],
  ["father", fatherInformationSchema, FATHER, "fatherWhatsappTeamsConsent"],
  ["guardian", guardianInformationSchema, GUARDIAN, "guardianWhatsappTeamsConsent"],
] as const)("%s WhatsApp/Teams consent", (_who, schema, base, key) => {
  it.each([true, false])("accepts %s as an answer", (answer) => {
    expect(schema.safeParse({ ...base, [key]: answer }).success).toBe(true);
  });

  it.each([undefined, null])("rejects %s (unanswered) while the details are given", (answer) => {
    const result = schema.safeParse({ ...base, [key]: answer });
    expect(result.success).toBe(false);
    expect(consentIssue(result, key)?.message).toBe(CONSENT_REQUIRED_MESSAGE);
  });
});

describe("optional parent/guardian consent", () => {
  it("does not require the father's consent when there is no father information", () => {
    expect(fatherInformationSchema.safeParse({ noFatherInfo: true }).success).toBe(true);
    expect(fatherInformationSchema.safeParse({ noFatherInfo: true, fatherWhatsappTeamsConsent: null }).success).toBe(
      true,
    );
  });

  it("does not require the guardian's consent when there is no guardian information", () => {
    expect(guardianInformationSchema.safeParse({ noGuardianInfo: true }).success).toBe(true);
    expect(
      guardianInformationSchema.safeParse({ noGuardianInfo: true, guardianWhatsappTeamsConsent: null }).success,
    ).toBe(true);
  });
});

describe("medication consent", () => {
  const base = { medicalChecklist: { none: true } };

  it.each([true, false])("accepts %s as an answer", (answer) => {
    expect(medicalChecklistSchema.safeParse({ ...base, paracetamolConsent: answer }).success).toBe(true);
  });

  it.each([undefined, null])("rejects %s (unanswered)", (answer) => {
    const result = medicalChecklistSchema.safeParse({ ...base, paracetamolConsent: answer });
    expect(consentIssue(result, "paracetamolConsent")?.message).toBe(CONSENT_REQUIRED_MESSAGE);
  });
});

describe("social media consent", () => {
  const base = {
    levelApplied: "Primary One",
    classType: "Enrichment Class",
    preferredSchedule: "Morning",
    availSchoolBus: "No",
    availStudentCare: "No",
    paymentOption: "Option 1",
    contractSignatory: "Mother",
    preferredPaymentScheme: "Annual (Full Payment)",
    preferredPaymentMethod: "Bank Transfer",
  };

  it("accepts No as an answer", () => {
    const result = enrollmentInformationSchema.safeParse({ ...base, socialMediaConsent: false });
    expect(consentIssue(result, "socialMediaConsent")).toBeUndefined();
  });

  it("rejects an unanswered consent", () => {
    const result = enrollmentInformationSchema.safeParse(base);
    expect(consentIssue(result, "socialMediaConsent")?.message).toBe(CONSENT_REQUIRED_MESSAGE);
  });
});
