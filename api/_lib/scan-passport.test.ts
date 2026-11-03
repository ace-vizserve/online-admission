// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../scan-passport";
import { readPassportFile } from "./read-passport-file";

// The shared test setup clears these after every test; this file runs where the server does.
vi.stubGlobal("localStorage", { clear: () => {} });
vi.stubGlobal("sessionStorage", { clear: () => {} });

const getUser = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser } }) }));
vi.mock("./read-passport-file", () => ({ readPassportFile: vi.fn() }));
const mockRead = vi.mocked(readPassportFile);

const RESULT = {
  reading: { expiry: null, passportNumber: null, source: null },
  passports: [],
  poorQuality: false,
  outOfTime: false,
  text: "raw",
};

let user = 0;
function post(body?: RequestInit["body"], token: string | null = "token") {
  return handler.fetch(
    new Request("http://portal/api/scan-passport", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body,
    }),
  );
}
function pdf(content = "%PDF-1.7") {
  const form = new FormData();
  form.append("file", new File([content], "passport.pdf", { type: "application/pdf" }));
  return form;
}

beforeEach(() => {
  // A new user each test, so the per-minute limit doesn't carry over.
  getUser.mockReset().mockResolvedValue({ data: { user: { id: `user-${++user}` } }, error: null });
  mockRead.mockReset().mockResolvedValue(RESULT as never);
  vi.unstubAllEnvs();
});

describe("POST /api/scan-passport", () => {
  it("reads the PDF and answers with what it says", async () => {
    const response = await post(pdf());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(RESULT);
    expect(mockRead).toHaveBeenCalledOnce();
  });

  it("keeps the raw text out of a deployed answer", async () => {
    vi.stubEnv("VERCEL", "1");

    expect(await (await post(pdf())).json()).not.toHaveProperty("text");
  });

  it("only takes POST", async () => {
    const response = await handler.fetch(new Request("http://portal/api/scan-passport"));
    expect(response.status).toBe(405);
  });

  it("needs a signed-in parent", async () => {
    expect((await post(pdf(), null)).status).toBe(401);

    getUser.mockResolvedValue({ data: { user: null }, error: new Error("bad") });
    expect((await post(pdf())).status).toBe(401);
    expect(mockRead).not.toHaveBeenCalled();
  });

  it("refuses anything but a PDF of a sensible size", async () => {
    expect((await post("not a form")).status).toBe(400);
    expect((await post(pdf("<html>"))).status).toBe(400);
    expect((await post(pdf("%PDF-".padEnd(4 * 1024 * 1024 + 1, "x")))).status).toBe(413);
    const noFile = new FormData();
    noFile.append("other", "x");
    expect((await post(noFile)).status).toBe(400);
    expect(mockRead).not.toHaveBeenCalled();
  });

  it("slows down a parent scanning too much", async () => {
    for (let i = 0; i < 10; i++) expect((await post(pdf())).status).toBe(200);

    expect((await post(pdf())).status).toBe(429);
  });

  it("answers plainly when a file can't be read, without the details", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    mockRead.mockRejectedValueOnce(new Error("secret detail"));
    const response = await post(pdf());
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "could not read this file" });

    mockRead.mockRejectedValueOnce("not an error");
    expect((await post(pdf())).status).toBe(422);

    logged.mockRestore();
  });
});
