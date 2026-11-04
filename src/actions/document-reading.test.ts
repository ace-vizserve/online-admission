import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHECK_TIMED_OUT } from "@/components/private/shared/upload-requirements/use-document-check";
import { PassportRead } from "@/lib/document-check/check-document";
import { supabase } from "@/lib/client";
import { sisFetch } from "@/lib/sis";

import { documentReadingReport, sendDocumentReading } from "./document-reading";

vi.mock("@/lib/sis", () => ({ sisFetch: vi.fn() }));
vi.mock("@/lib/client", () => ({ supabase: { auth: { getSession: vi.fn() } } }));
vi.mock("@/lib/document-check/check-document", () => ({ checkDocument: vi.fn() }));
const mockSis = vi.mocked(sisFetch);
const mockFetch = vi.fn();

const QUALITY = { pages: 1, sharpness: 900 };
const EXPIRY = new Date(Date.UTC(2030, 10, 14));
const done = (passports: PassportRead[], outOfTime = false) => ({
  state: {
    phase: "done" as const,
    result: {
      reading: { expiry: null, passportNumber: null, source: null },
      passports,
      poorQuality: false,
      outOfTime,
    },
  },
});

beforeEach(() => {
  mockSis.mockReset();
  mockFetch.mockReset().mockImplementation(async () => new Response(JSON.stringify(QUALITY)));
  vi.stubGlobal("fetch", mockFetch);
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
});

describe("documentReadingReport", () => {
  it("reports every passport read, with its dates as plain days", () => {
    const report = documentReadingReport(
      done([
        { expiry: EXPIRY, passportNumber: "K1234567" },
        { expiry: null, passportNumber: "P2263418B" },
      ]),
    );
    expect(report).toEqual({
      status: "read",
      passports: [
        { expiry: "2030-11-14", number: "K1234567" },
        { expiry: null, number: "P2263418B" },
      ],
    });
  });

  it("passes on what else was read from the passport", () => {
    const report = documentReadingReport(
      done([{ expiry: EXPIRY, passportNumber: "K1", birthDate: "2015-01-01", name: "TAN, MEI", nationality: "SGP", sex: "F" }]),
    );
    expect(report.passports[0]).toEqual({
      expiry: "2030-11-14",
      number: "K1",
      birthDate: "2015-01-01",
      name: "TAN, MEI",
      nationality: "SGP",
      sex: "F",
    });
  });

  it("says when a file couldn't be read", () => {
    expect(documentReadingReport(done([]))).toEqual({ status: "unreadable", passports: [] });
  });

  it("says when the read ran out of time before finding anything, but keeps what it did find", () => {
    expect(documentReadingReport(done([], true))).toEqual({ status: "timed_out", passports: [] });
    expect(documentReadingReport(done([{ expiry: EXPIRY, passportNumber: null }], true)).status).toBe("read");
  });

  it("tells a read that ran out of time from one that broke", () => {
    expect(documentReadingReport({ state: { phase: "failed", error: CHECK_TIMED_OUT } }).status).toBe("timed_out");
    expect(documentReadingReport({ state: { phase: "failed", error: "boom" } }).status).toBe("failed");
  });

  it("marks a document the check doesn't read", () => {
    expect(documentReadingReport({ state: { phase: "idle" } })).toEqual({ status: "not_read", passports: [] });
  });
});

describe("sendDocumentReading", () => {
  const check = done([{ expiry: EXPIRY, passportNumber: "K1234567" }]);

  it("measures the file, then sends the reading and what the parent entered, keyed by its URL", async () => {
    await sendDocumentReading("https://x/file.pdf", check, { number: "P7654321", expiry: EXPIRY.toISOString() });

    const [path, init] = mockFetch.mock.calls[0];
    expect(path).toBe("/api/document-quality");
    expect(init.headers.Authorization).toBe("Bearer token");
    expect(JSON.parse(init.body)).toEqual({ fileUrl: "https://x/file.pdf" });
    expect(mockSis).toHaveBeenCalledWith("api/parent/v2/document-readings", {
      method: "POST",
      json: {
        fileUrl: "https://x/file.pdf",
        status: "read",
        passports: [{ expiry: "2030-11-14", number: "K1234567" }],
        quality: QUALITY,
        enteredNumber: "P7654321",
        enteredExpiry: "2030-11-14",
      },
    });
  });

  it("reports the quality of a document the check doesn't read", async () => {
    await sendDocumentReading("https://x/birth.pdf", { state: { phase: "idle" } }, {});

    expect(mockSis.mock.calls[0][1]?.json).toMatchObject({ status: "not_read", passports: [], quality: QUALITY });
  });

  it("still sends the reading when the quality couldn't be measured", async () => {
    mockFetch.mockImplementation(async () => new Response("{}", { status: 422 }));

    await sendDocumentReading("https://x/file.pdf", check, {});

    expect(mockSis.mock.calls[0][1]?.json).toMatchObject({ status: "read", quality: null });
  });

  it("sends blanks for details not entered or not readable as a date", async () => {
    await sendDocumentReading("https://x/file.pdf", check, { number: "", expiry: "not a date" });

    expect(mockSis.mock.calls[0][1]?.json).toMatchObject({ enteredNumber: null, enteredExpiry: null });
  });

  it("never lets a failure reach the parent", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSis.mockRejectedValue(new Error("Failed to fetch"));

    await expect(sendDocumentReading("https://x/file.pdf", check, {})).resolves.toBeUndefined();

    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});
