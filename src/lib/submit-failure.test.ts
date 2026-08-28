import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { diagnoseSubmitFailure, isNetworkError } from "./submit-failure";

/** Puts `navigator.onLine` under the test's control; jsdom hardcodes it to true. */
function setOnLine(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { value, configurable: true });
}

describe("isNetworkError", () => {
  it("recognises the TypeError the browser throws for a dropped request", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  // postgrest-js catches the fetch rejection and hands the wording back on a plain Error.
  it("recognises the wording when it arrives on an ordinary Error", () => {
    expect(isNetworkError(new Error("TypeError: Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("NetworkError when attempting to fetch resource."))).toBe(true);
    expect(isNetworkError(new Error("Load failed"))).toBe(true);
  });

  it("recognises the wording on a bare string", () => {
    expect(isNetworkError("Failed to fetch")).toBe(true);
  });

  it("does not claim a real database error is a network error", () => {
    expect(isNetworkError(new Error('duplicate key value violates unique constraint "pk"'))).toBe(false);
  });

  it("does not choke on a thrown non-error", () => {
    expect(isNetworkError({ nope: true })).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});

describe("diagnoseSubmitFailure", () => {
  beforeEach(() => {
    setOnLine(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setOnLine(true);
  });

  // A corporate proxy can hold a connection open instead of refusing it. The parent is staring
  // at a spinner, so the diagnosis has to give up rather than wait indefinitely.
  it("gives up on the probe rather than hanging when nothing answers", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      ),
    );

    const pending = diagnoseSubmitFailure(new TypeError("Failed to fetch"));
    await vi.advanceTimersByTimeAsync(3000);

    await expect(pending).resolves.toMatchObject({ kind: "offline" });
  });

  it("blames the network in between when our own origin answers but Supabase did not", async () => {
    // The corporate-DLP shape: selective blocking, which a dead connection cannot produce.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    const failure = await diagnoseSubmitFailure(new TypeError("Failed to fetch"));

    expect(failure.kind).toBe("blocked");
    expect(failure.description).toMatch(/work computers or company networks/i);
  });

  it("says offline when nothing at all is reachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const failure = await diagnoseSubmitFailure(new TypeError("Failed to fetch"));

    expect(failure.kind).toBe("offline");
    expect(failure.description).toMatch(/offline/i);
  });

  it("trusts navigator.onLine and skips the probe when the device knows it is offline", async () => {
    setOnLine(false);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const failure = await diagnoseSubmitFailure(new TypeError("Failed to fetch"));

    expect(failure.kind).toBe("offline");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("passes a real error's own message through rather than guessing at the network", async () => {
    const failure = await diagnoseSubmitFailure(new Error("levelApplied violates check constraint"));

    expect(failure.kind).toBe("unknown");
    expect(failure.description).toContain("levelApplied violates check constraint");
  });

  it("falls back to generic wording when the thrown value carries no message", async () => {
    const failure = await diagnoseSubmitFailure({});

    expect(failure.kind).toBe("unknown");
    expect(failure.description).toMatch(/something went wrong/i);
  });

  // The single most important property: a parent must never close the tab believing they
  // submitted. Every branch says so outright.
  it.each([
    ["blocked", () => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null))), new TypeError("Failed to fetch")],
    ["offline", () => vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("x"))), new TypeError("Failed to fetch")],
    ["unknown", () => {}, new Error("boom")],
  ] as const)("states plainly that nothing was submitted (%s)", async (_kind, arrange, error) => {
    arrange();

    const failure = await diagnoseSubmitFailure(error);

    expect(failure.title).toMatch(/not submitted/i);
    expect(failure.description).toMatch(/saved/i);
  });
});
