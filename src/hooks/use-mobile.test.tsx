/**
 * Safari < 14 only implements the legacy `addListener`/`removeListener` pair on MediaQueryList,
 * not `addEventListener`/`removeEventListener` — without a fallback, `useIsMobile` would silently
 * stop receiving resize/orientation updates on those engines. Each test builds a fake
 * MediaQueryList exposing only the API under test so the hook's feature-detection branch is
 * actually exercised (jsdom's own matchMedia stub, from src/test/setup.ts, only offers the
 * modern methods).
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

function setInnerWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
}

const originalMatchMedia = window.matchMedia;
const originalInnerWidth = window.innerWidth;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  setInnerWidth(originalInnerWidth);
  vi.restoreAllMocks();
});

describe("useIsMobile — modern addEventListener/removeEventListener", () => {
  it("subscribes via addEventListener and updates isMobile on a change event", () => {
    setInnerWidth(1024);
    let changeHandler: (() => void) | undefined;
    const addEventListener = vi.fn((_: string, handler: () => void) => {
      changeHandler = handler;
    });
    const removeEventListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ addEventListener, removeEventListener });

    const { result, unmount } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    setInnerWidth(500);
    act(() => changeHandler?.());
    expect(result.current).toBe(true);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});

describe("useIsMobile — legacy addListener/removeListener fallback", () => {
  it("subscribes via addListener when addEventListener is unavailable, and updates on change", () => {
    setInnerWidth(1024);
    let changeHandler: (() => void) | undefined;
    const addListener = vi.fn((handler: () => void) => {
      changeHandler = handler;
    });
    const removeListener = vi.fn();
    // No addEventListener/removeEventListener on this fake MQL — mirrors Safari < 14.
    window.matchMedia = vi.fn().mockReturnValue({ addListener, removeListener });

    const { result, unmount } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
    expect(addListener).toHaveBeenCalledWith(expect.any(Function));

    setInnerWidth(320);
    act(() => changeHandler?.());
    expect(result.current).toBe(true);

    unmount();
    expect(removeListener).toHaveBeenCalledWith(expect.any(Function));
  });
});
