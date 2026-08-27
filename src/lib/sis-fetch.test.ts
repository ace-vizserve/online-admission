/**
 * Behaviour tests for the shared authed SIS fetch.
 *
 * Every SIS call goes through this, so the header assembly, the FormData content-type rule and
 * the error contract are all pinned here rather than re-proved at each call site.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/lib/client", () => ({ supabase: { auth: { getSession } } }));

const { SIS_BASE, SisError, sisFetch } = await import("./sis");

/** A `fetch` stand-in resolving one canned Response, with the captured call arguments. */
function stubFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({}),
    ...response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The headers the single fetch call was made with. */
function headersOf(fetchMock: ReturnType<typeof vi.fn>) {
  return new Headers(fetchMock.mock.calls[0][1].headers);
}

beforeEach(() => {
  vi.unstubAllGlobals();
  getSession.mockReset().mockResolvedValue({ data: { session: { access_token: "token-abc" } } });
});

describe("sisFetch — request", () => {
  it("resolves the path against SIS_BASE and sends the parent's bearer token", async () => {
    const fetchMock = stubFetch({ json: async () => ({ students: [] }) });

    await sisFetch("api/parent/v2/enrolled-students");

    expect(fetchMock.mock.calls[0][0]).toBe(`${SIS_BASE}api/parent/v2/enrolled-students`);
    expect(headersOf(fetchMock).get("Authorization")).toBe("Bearer token-abc");
  });

  it("returns the parsed JSON body", async () => {
    stubFetch({ json: async () => ({ students: [{ studentNumber: "H250123" }] }) });

    await expect(sisFetch("api/parent/v2/enrolled-students")).resolves.toEqual({
      students: [{ studentNumber: "H250123" }],
    });
  });

  it("serialises a `json` payload and marks it application/json", async () => {
    const fetchMock = stubFetch({ status: 201, json: async () => ({ filingGroupId: "9e7c" }) });

    await sisFetch("api/parent/v2/declarations", { method: "POST", json: { declarationType: "absence" } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"declarationType":"absence"}');
    expect(headersOf(fetchMock).get("Content-Type")).toBe("application/json");
  });

  it("leaves Content-Type unset for FormData so the browser can set the multipart boundary", async () => {
    const fetchMock = stubFetch({ status: 201, json: async () => ({ path: "declarations/a/b.pdf" }) });
    const body = new FormData();
    body.append("file", new File(["x"], "mc.pdf", { type: "application/pdf" }));

    await sisFetch("api/parent/v2/declarations/evidence", { method: "POST", body });

    expect(headersOf(fetchMock).has("Content-Type")).toBe(false);
    expect(fetchMock.mock.calls[0][1].body).toBe(body);
  });

  it("refuses to call the SIS at all when nobody is signed in", async () => {
    const fetchMock = stubFetch({});
    getSession.mockResolvedValue({ data: { session: null } });

    await expect(sisFetch("api/parent/v2/declarations")).rejects.toThrow(/not signed in/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("sisFetch — error contract", () => {
  it("throws the SIS's own sentence, which is written to be shown to a parent", async () => {
    stubFetch({
      ok: false,
      status: 403,
      json: async () => ({ error: "One of the children selected is not on your account." }),
    });

    await expect(sisFetch("api/parent/v2/declarations")).rejects.toThrow(
      "One of the children selected is not on your account.",
    );
  });

  it("carries the status so callers can tell 403 from 401", async () => {
    stubFetch({ ok: false, status: 401, json: async () => ({ error: "invalid or expired token" }) });

    await expect(sisFetch("api/parent/v2/declarations")).rejects.toMatchObject({ status: 401 });
  });

  it("carries field-level issues from a 400 so they can be shown under their fields", async () => {
    stubFetch({
      ok: false,
      status: 400,
      json: async () => ({
        error: "Please check the form.",
        issues: [{ path: "endDate", message: "The last day cannot be before the first day." }],
      }),
    });

    await expect(sisFetch("api/parent/v2/declarations")).rejects.toMatchObject({
      status: 400,
      issues: [{ path: "endDate", message: "The last day cannot be before the first day." }],
    });
  });

  it("reads Retry-After off a 429 so the wait can be quoted to the parent", async () => {
    stubFetch({
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "30" }),
      json: async () => ({ error: "Too many requests." }),
    });

    await expect(sisFetch("api/parent/v2/declarations")).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 30,
    });
  });

  it("still reports a usable error when the failure body is not JSON", async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    });

    const error = await sisFetch("api/parent/v2/declarations").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SisError);
    expect((error as InstanceType<typeof SisError>).status).toBe(502);
    expect((error as InstanceType<typeof SisError>).message).toMatch(/\S/);
  });
});
