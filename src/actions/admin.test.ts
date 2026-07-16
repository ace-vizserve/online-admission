/**
 * Coverage for the admin create-parent-account action and its schema. The action deliberately
 * bypasses the shared `callFunction` helper because a duplicate email must NOT collapse into a
 * bare Error string — the 409 payload carries the existing account's details, which the page
 * renders as an idempotency result.
 */
import { Session } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExistingParentAccountError, adminCheckRecovery, adminCreateParentAccount, adminGenerateRecoveryLink } from "./admin";
import { adminCreateParentSchema, adminRecoveryLookupSchema, recoveryRecipientEmailsSchema } from "@/zod-schema";

const session = { access_token: "test-token" } as Session;

const params = {
  firstName: "Jane",
  lastName: "Doe",
  relationship: "mother" as const,
  email: "Jane.Doe@Example.com",
  password: "SuperSecret123",
};

function mockFetchResponse(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("adminCreateParentAccount", () => {
  it("returns the created account and sends the lowercased email with the admin bearer token", async () => {
    const account = { email: "jane.doe@example.com", fullName: "Doe, Jane", relationship: "mother" };
    const fetchMock = mockFetchResponse(200, { ok: true, account });

    await expect(adminCreateParentAccount(session, params)).resolves.toEqual(account);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/functions/v1/admin-set-password");
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(init.body)).toMatchObject({
      action: "create-account",
      firstName: "Jane",
      lastName: "Doe",
      relationship: "mother",
      email: "jane.doe@example.com",
    });
  });

  it("throws ExistingParentAccountError carrying the existing account's details on a 409", async () => {
    const existing = {
      email: "jane.doe@example.com",
      fullName: "Doe, Jane",
      relationship: "father",
      emailConfirmed: true,
      lastSignInAt: "2026-07-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    mockFetchResponse(409, { error: "An account with this email already exists", existing });

    const err = await adminCreateParentAccount(session, params).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ExistingParentAccountError);
    expect((err as ExistingParentAccountError).existing).toEqual(existing);
    expect((err as ExistingParentAccountError).message).toBe("An account with this email already exists");
  });

  it("throws a plain Error with the server message on other failures", async () => {
    mockFetchResponse(403, { error: "Forbidden" });

    await expect(adminCreateParentAccount(session, params)).rejects.toThrow("Forbidden");
  });

  it("falls back to a generic message when an ok response has no account payload", async () => {
    mockFetchResponse(200, {});

    await expect(adminCreateParentAccount(session, params)).rejects.toThrow("Request failed");
  });
});

describe("adminCheckRecovery", () => {
  it("sends the check action with the bearer token and returns the result", async () => {
    const result = {
      academicYear: "ay2027",
      enroleeNumber: "E270003",
      studentNumber: "H270003",
      category: "New",
      studentName: "DOE, JANE",
      present: { applications: false, documents: true, status: true },
      applicationsIncomplete: false,
      missing: ["applications"],
      suggestedSections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      knownEmails: null,
    };
    const fetchMock = mockFetchResponse(200, result);

    await expect(adminCheckRecovery(session, { enroleeNumber: "E270003" })).resolves.toEqual(result);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/functions/v1/recovery-link");
    expect(init.headers.Authorization).toBe("Bearer test-token");
    expect(JSON.parse(init.body)).toEqual({ action: "check", enroleeNumber: "E270003" });
  });

  it("throws the server's error message on failure", async () => {
    mockFetchResponse(422, { error: "Could not determine the application category" });

    await expect(adminCheckRecovery(session, { enroleeNumber: "E270003" })).rejects.toThrow(
      "Could not determine the application category",
    );
  });
});

describe("adminGenerateRecoveryLink", () => {
  it("sends the generate action and returns the token/url", async () => {
    const result = {
      token: "11111111-1111-1111-1111-111111111111",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/11111111-1111-1111-1111-111111111111",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: false,
    };
    const fetchMock = mockFetchResponse(200, result);

    await expect(adminGenerateRecoveryLink(session, { enroleeNumber: "E270003" })).resolves.toEqual(result);

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ action: "generate", enroleeNumber: "E270003" });
  });

  it("sends an explicit section selection when provided", async () => {
    const fetchMock = mockFetchResponse(200, {
      token: "t",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/t",
      missing: ["applications"],
      sections: ["familyInfo"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: false,
    });

    await adminGenerateRecoveryLink(session, { enroleeNumber: "E270003", sections: ["familyInfo"] });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ action: "generate", enroleeNumber: "E270003", sections: ["familyInfo"] });
  });

  it("sends recipientEmails and reports emailSent on success", async () => {
    const fetchMock = mockFetchResponse(200, {
      token: "t",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/t",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: true,
    });

    const result = await adminGenerateRecoveryLink(session, {
      enroleeNumber: "E270003",
      recipientEmails: "jane@example.com, john@example.com",
    });

    expect(result.emailSent).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      action: "generate",
      enroleeNumber: "E270003",
      recipientEmails: "jane@example.com, john@example.com",
    });
  });

  it("surfaces emailError without throwing when the link was created but the email failed", async () => {
    mockFetchResponse(200, {
      token: "t",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/t",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: false,
      emailError: "Resend API returned 422: invalid recipient",
    });

    const result = await adminGenerateRecoveryLink(session, {
      enroleeNumber: "E270003",
      recipientEmails: "not-a-real-address",
    });

    expect(result.emailSent).toBe(false);
    expect(result.emailError).toContain("Resend API returned 422");
    expect(result.token).toBe("t");
  });

  it("throws when there's nothing to recover", async () => {
    mockFetchResponse(409, { error: "Nothing to recover — all three tables already have a row." });

    await expect(adminGenerateRecoveryLink(session, { enroleeNumber: "E270003" })).rejects.toThrow(
      "Nothing to recover",
    );
  });
});

describe("adminRecoveryLookupSchema", () => {
  it("trims and uppercases the enrolee number", () => {
    expect(adminRecoveryLookupSchema.parse({ enroleeNumber: " e270003 " }).enroleeNumber).toBe("E270003");
  });

  it("rejects an empty enrolee number", () => {
    expect(adminRecoveryLookupSchema.safeParse({ enroleeNumber: "" }).success).toBe(false);
  });
});

describe("recoveryRecipientEmailsSchema", () => {
  it("rejects an empty string without throwing", () => {
    // Regression: chaining .refine() after .transform() when the raw string is empty must not
    // hand the untransformed string to a refine expecting an array (TypeError: .every is not
    // a function) — see the schema's own comment for why `.min(1)` was removed.
    const result = recoveryRecipientEmailsSchema.safeParse({ recipientEmails: "" });
    expect(result.success).toBe(false);
  });

  it("splits, trims, and accepts multiple comma-separated addresses", () => {
    const result = recoveryRecipientEmailsSchema.parse({ recipientEmails: " jane@example.com , john@example.com " });
    expect(result.recipientEmails).toEqual(["jane@example.com", "john@example.com"]);
  });

  it("rejects when any entry isn't a valid email", () => {
    const result = recoveryRecipientEmailsSchema.safeParse({ recipientEmails: "jane@example.com, not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("adminCreateParentSchema", () => {
  const valid = {
    firstName: "jane marie",
    lastName: "doe",
    relationship: "mother",
    email: "jane@example.com",
    password: "SuperSecret123",
    confirmPassword: "SuperSecret123",
  };

  it("accepts valid input and capitalizes names", () => {
    const parsed = adminCreateParentSchema.parse(valid);

    expect(parsed.firstName).toBe("Jane Marie");
    expect(parsed.lastName).toBe("Doe");
  });

  it("rejects guardian — admins only provision mother/father accounts", () => {
    expect(adminCreateParentSchema.safeParse({ ...valid, relationship: "guardian" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(adminCreateParentSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a password under 8 characters", () => {
    expect(adminCreateParentSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success).toBe(
      false,
    );
  });

  it("rejects mismatched password confirmation", () => {
    const result = adminCreateParentSchema.safeParse({ ...valid, confirmPassword: "Different123" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});
