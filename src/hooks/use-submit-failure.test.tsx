import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSubmitFailure } from "./use-submit-failure";

describe("useSubmitFailure", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts with nothing to report", () => {
    const { result } = renderHook(() => useSubmitFailure());

    expect(result.current.failure).toBeNull();
  });

  it("diagnoses a reported error and holds it for the dialog to show", async () => {
    // Our own origin answers while the submit didn't: the selective-block shape.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    const { result } = renderHook(() => useSubmitFailure());

    await act(async () => {
      await result.current.reportFailure(new TypeError("Failed to fetch"));
    });

    await waitFor(() => expect(result.current.failure?.kind).toBe("blocked"));
    expect(result.current.failure?.title).toMatch(/not submitted/i);
  });

  it("clears the failure once the parent acknowledges it, so a retry starts clean", async () => {
    const { result } = renderHook(() => useSubmitFailure());

    await act(async () => {
      await result.current.reportFailure(new Error("constraint violation"));
    });
    await waitFor(() => expect(result.current.failure).not.toBeNull());

    act(() => result.current.dismissFailure());

    expect(result.current.failure).toBeNull();
  });
});
