import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useDebounce } from "./use-debounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("returns the initial value synchronously without waiting for the timer", () => {
    const { result } = renderHook(() => useDebounce("hello", 200));
    expect(result.current).toBe("hello");
  });

  it("does NOT update the debounced value before the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: "initial" },
    });

    rerender({ value: "updated" });
    act(() => { vi.advanceTimersByTime(100); }); // only half the delay

    expect(result.current).toBe("initial");
  });

  it("updates the debounced value after the delay has elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: "initial" },
    });

    rerender({ value: "updated" });

    act(() => { vi.advanceTimersByTime(201); });

    expect(result.current).toBe("updated");
  });

  it("collapses rapid changes — only the final value arrives", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    act(() => { vi.advanceTimersByTime(50); });

    rerender({ value: "c" });
    act(() => { vi.advanceTimersByTime(50); });

    rerender({ value: "final" });
    act(() => { vi.advanceTimersByTime(201); });

    expect(result.current).toBe("final");
  });

  it("does NOT fire when a stringify-equal value is provided", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: { name: "original" } },
    });

    // Capture the initial debounced reference
    const initialRef = result.current;

    // New object reference but identical JSON content → no setTimeout is set
    rerender({ value: { name: "original" } });
    act(() => { vi.advanceTimersByTime(300); });

    // The internal state was never updated — the reference is unchanged
    expect(result.current).toBe(initialRef);
    expect(result.current).toEqual({ name: "original" });
  });

  it("fires when the content differs (not just the reference)", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: { name: "original" } },
    });

    rerender({ value: { name: "changed" } });
    act(() => { vi.advanceTimersByTime(201); });

    expect(result.current).toEqual({ name: "changed" });
  });

  // File-equality limitation — important for upload components
  // JSON.stringify(new File(...)) === "{}" for any File instance,
  // so two different Files look identical to the debounce and no update fires.
  it("LIMITATION: does not propagate a file swap (File serialises to '{}')", () => {
    const file1 = new File(["content1"], "a.pdf", { type: "application/pdf" });
    const file2 = new File(["content2"], "b.pdf", { type: "application/pdf" });

    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: file1 },
    });

    rerender({ value: file2 });
    act(() => { vi.advanceTimersByTime(201); });

    // file1 and file2 both stringify to "{}" — they appear equal, so no update.
    // If file-swap detection ever becomes critical, replace JSON.stringify equality
    // with a custom comparator that handles File objects.
    expect(result.current).toBe(file1); // still the original
  });
});
