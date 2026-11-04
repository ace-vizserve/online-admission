// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import handler from "../document-quality";
import { measureDocument } from "./document-quality";

// The shared test setup clears these after every test; this file runs where the server does.
vi.stubGlobal("localStorage", { clear: () => {} });
vi.stubGlobal("sessionStorage", { clear: () => {} });

const getUser = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser } }) }));
vi.mock("./document-quality", () => ({ measureDocument: vi.fn() }));
const mockMeasure = vi.mocked(measureDocument);
const mockFetch = vi.fn();

const SUPABASE = "https://project.supabase.co";
const FILE = `${SUPABASE}/storage/v1/object/public/parent-portal/ay2027/documents/1_birth.pdf`;
const QUALITY = { pages: 1, totalPages: 1, fileBytes: 1000, hasText: true, width: null, height: null, sharpness: 900, inkRatio: 0.1, brightness: 200, contrast: 40 };

function post(body: unknown, token: string | null = "token") {
  return handler.fetch(
    new Request("http://portal/api/document-quality", {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", SUPABASE);
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
  vi.stubGlobal("fetch", mockFetch);
  getUser.mockReset().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockMeasure.mockReset().mockResolvedValue(QUALITY);
  mockFetch.mockReset().mockResolvedValue(new Response("%PDF-1.7"));
});

describe("POST /api/document-quality", () => {
  it("measures a file from our bucket", async () => {
    const response = await post({ fileUrl: FILE });

    expect(mockFetch).toHaveBeenCalledWith(FILE);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(QUALITY);
  });

  it("only takes POST", async () => {
    const response = await handler.fetch(new Request("http://portal/api/document-quality"));
    expect(response.status).toBe(405);
  });

  it("needs a signed-in parent", async () => {
    expect((await post({ fileUrl: FILE }, null)).status).toBe(401);

    getUser.mockResolvedValue({ data: { user: null }, error: new Error("bad") });
    expect((await post({ fileUrl: FILE })).status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    ["another site", { fileUrl: "https://evil.example/x.pdf" }],
    ["another bucket", { fileUrl: `${SUPABASE}/storage/v1/object/public/secret/x.pdf` }],
    ["no URL", {}],
    ["a body that isn't JSON", "nonsense"],
  ])("won't fetch %s", async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("says when the file is gone or too big", async () => {
    mockFetch.mockResolvedValueOnce(new Response("", { status: 404 }));
    expect((await post({ fileUrl: FILE })).status).toBe(404);

    mockFetch.mockResolvedValueOnce(new Response(new Uint8Array(20 * 1024 * 1024 + 1)));
    expect((await post({ fileUrl: FILE })).status).toBe(413);
    expect(mockMeasure).not.toHaveBeenCalled();
  });

  it("answers plainly when a file can't be measured, without the details", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    mockMeasure.mockRejectedValueOnce(new Error("secret detail"));
    const response = await post({ fileUrl: FILE });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "could not measure this file" });

    mockMeasure.mockRejectedValueOnce("not an error");
    expect((await post({ fileUrl: FILE })).status).toBe(422);

    logged.mockRestore();
  });
});
