import { beforeEach, describe, expect, it, vi } from "vitest";

import { supabase } from "@/lib/client";

import { checkDocument } from "./check-document";

vi.mock("@/lib/client", () => ({ supabase: { auth: { getSession: vi.fn() } } }));

const mockFetch = vi.fn();
const answer = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const file = (name: string) => new File(["%PDF-"], name, { type: "application/pdf" });
const EXPIRY = "2030-11-14T00:00:00.000Z";
const nothing = {
  reading: { expiry: null, passportNumber: null, source: null },
  passports: [],
  poorQuality: false,
  outOfTime: false,
};
const verified = (number: string, expiry = EXPIRY) => ({
  ...nothing,
  reading: { expiry, passportNumber: number, source: "mrz" },
  passports: [{ expiry, passportNumber: number }],
});

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
  vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { access_token: "token" } } } as never);
});

describe("checkDocument", () => {
  it("sends each file to the portal's own server, and turns its dates back into dates", async () => {
    mockFetch.mockResolvedValue(answer(verified("K1234567")));

    const result = await checkDocument([file("passport.pdf")]);

    const [path, init] = mockFetch.mock.calls[0];
    expect(path).toBe("/api/scan-passport");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer token" });
    expect((init.body as FormData).get("file")).toMatchObject({ name: "passport.pdf" });
    expect(result.reading).toEqual({ expiry: new Date(EXPIRY), passportNumber: "K1234567", source: "mrz" });
    expect(result.passports).toEqual([{ expiry: new Date(EXPIRY), passportNumber: "K1234567" }]);
  });

  it("gathers the passports across files, once each, and takes the first verified reading", async () => {
    mockFetch
      .mockResolvedValueOnce(answer(nothing))
      .mockResolvedValueOnce(answer(verified("K1234567")))
      .mockResolvedValueOnce(
        answer({
          ...verified("K1234567"),
          passports: [
            { expiry: EXPIRY, passportNumber: "K1234567" },
            { expiry: null, passportNumber: "P2263418B" },
          ],
        }),
      );

    const result = await checkDocument([file("a.pdf"), file("b.pdf"), file("c.pdf")]);

    expect(result.reading.passportNumber).toBe("K1234567");
    expect(result.passports).toEqual([
      { expiry: new Date(EXPIRY), passportNumber: "K1234567" },
      { expiry: null, passportNumber: "P2263418B" },
    ]);
  });

  it("falls back to a printed date, then to a number alone", async () => {
    const label = { ...nothing, reading: { expiry: EXPIRY, passportNumber: null, source: "label" } };
    const number = { ...nothing, reading: { expiry: null, passportNumber: "K1", source: null } };

    mockFetch.mockResolvedValueOnce(answer(number)).mockResolvedValueOnce(answer(label));
    expect((await checkDocument([file("a.pdf"), file("b.pdf")])).reading.source).toBe("label");

    mockFetch.mockResolvedValueOnce(answer(nothing)).mockResolvedValueOnce(answer(number));
    expect((await checkDocument([file("a.pdf"), file("b.pdf")])).reading.passportNumber).toBe("K1");
  });

  it("reports nothing found when nothing was", async () => {
    mockFetch.mockResolvedValue(answer(nothing));

    expect(await checkDocument([file("a.pdf")])).toEqual({
      reading: { expiry: null, passportNumber: null, source: null },
      passports: [],
      poorQuality: false,
      outOfTime: false,
      text: "",
    });
  });

  it("passes on a blurry scan and running out of time, unless a read verified anyway", async () => {
    mockFetch.mockResolvedValueOnce(answer({ ...nothing, poorQuality: true, outOfTime: true, text: "raw" }));
    expect(await checkDocument([file("a.pdf")])).toMatchObject({ poorQuality: true, outOfTime: true, text: "raw" });

    mockFetch.mockResolvedValueOnce(answer({ ...nothing, poorQuality: true })).mockResolvedValueOnce(answer(verified("K1")));
    expect((await checkDocument([file("a.pdf"), file("b.pdf")])).poorQuality).toBe(false);
  });

  it("fails when the server does, which the caller treats as couldn't read it", async () => {
    mockFetch.mockResolvedValue(answer({ error: "could not read this file" }, 422));
    await expect(checkDocument([file("a.pdf")])).rejects.toThrow("could not read this file");

    mockFetch.mockResolvedValue(new Response("<html>", { status: 500 }));
    await expect(checkDocument([file("a.pdf")])).rejects.toThrow("Passport scan failed (500)");

    mockFetch.mockRejectedValue(new Error("Failed to fetch"));
    await expect(checkDocument([file("a.pdf")])).rejects.toThrow("Failed to fetch");
  });

  it("needs a signed-in parent", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as never);
    mockFetch.mockResolvedValue(answer({ error: "missing Bearer token" }, 401));

    await expect(checkDocument([file("a.pdf")])).rejects.toThrow("missing Bearer token");
    expect(mockFetch.mock.calls[0][1].headers).toEqual({});
  });
});
