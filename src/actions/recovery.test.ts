/**
 * Coverage for the public (no-login) recovery-link wrappers. Unlike the admin wrappers in
 * admin.ts, these call `supabase.functions.invoke` directly (the token is the authorization,
 * there's no session to attach) — mirroring `checkEmailExists` in src/lib/utils.ts.
 */
import { describe, expect, it, vi } from "vitest";

import { getRecoveryToken, signRecoveryUpload, submitRecovery } from "./recovery";

const invokeMock = vi.fn();

vi.mock("@/lib/client", () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

describe("getRecoveryToken", () => {
  it("invokes the get action with the token and returns the data", async () => {
    const data = {
      enroleeNumber: "E270003",
      academicYear: "ay2027",
      category: "New",
      studentName: "DOE, JANE",
      missing: ["applications"],
    };
    invokeMock.mockResolvedValueOnce({ data, error: null });

    await expect(getRecoveryToken("tok-1")).resolves.toEqual(data);
    expect(invokeMock).toHaveBeenCalledWith("recovery-link", { body: { action: "get", token: "tok-1" } });
  });

  it("throws on a transport-level error", async () => {
    invokeMock.mockResolvedValueOnce({ data: null, error: { message: "Network error" } });

    await expect(getRecoveryToken("tok-1")).rejects.toThrow("Network error");
  });

  it("throws on an application-level error payload", async () => {
    invokeMock.mockResolvedValueOnce({ data: { error: "This link has expired." }, error: null });

    await expect(getRecoveryToken("tok-1")).rejects.toThrow("This link has expired.");
  });
});

describe("signRecoveryUpload", () => {
  it("invokes sign-upload with the token, field, and filename", async () => {
    const data = {
      path: "ay2027/documents/E270003/idPicture-123-photo.jpg",
      token: "signed-token",
      signedUrl: "https://example.com/signed",
      publicUrl: "https://example.com/public",
    };
    invokeMock.mockResolvedValueOnce({ data, error: null });

    await expect(signRecoveryUpload("tok-1", "idPicture", "photo.jpg")).resolves.toEqual(data);
    expect(invokeMock).toHaveBeenCalledWith("recovery-link", {
      body: { action: "sign-upload", token: "tok-1", field: "idPicture", filename: "photo.jpg" },
    });
  });
});

describe("submitRecovery", () => {
  it("invokes submit with the token and form state", async () => {
    invokeMock.mockResolvedValueOnce({ data: { ok: true, enroleeNumber: "E270003" }, error: null });

    const formState = { studentInfo: {} };
    await expect(submitRecovery("tok-1", formState)).resolves.toEqual({ ok: true, enroleeNumber: "E270003" });
    expect(invokeMock).toHaveBeenCalledWith("recovery-link", { body: { action: "submit", token: "tok-1", formState } });
  });
});
