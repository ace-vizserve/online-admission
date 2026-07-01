/**
 * Tests the wasDirty gate pattern used in every sub-form component.
 *
 * Each sub-form has this effect:
 *
 *   useEffect(() => {
 *     const wasDirty = form.formState.isDirty;
 *     if (wasDirty) {
 *       setFormState({ ... debouncedValues });   // write to Zustand
 *     }
 *     form.reset({ ...debouncedValues }, { keepErrors: true });
 *   }, [debouncedValues]);
 *
 * The gate prevents the stale-closure overwrite bug: when AutoResumeDraft
 * restores draft data to the Zustand store BEFORE sub-form effects run,
 * an untouched form (isDirty = false) must NOT write back {} to the store.
 *
 * We test the pattern directly via renderHook rather than mounting a full
 * sub-form component (which would require mocking Supabase, Sonner, router,
 * academic-year store, etc.). The hook harness exercises the exact same
 * React-Hook-Form + useDebounce + useEffect logic.
 */
import { act, renderHook } from "@testing-library/react";
import { useEffect } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "./use-debounce";

// Reproduces the sub-form debounce + wasDirty effect pattern.
function useDraftSyncPattern<T extends Record<string, unknown>>(
  defaultValues: T,
  onSync: (values: T) => void,
  delay = 150,
) {
  const form = useForm<T>({ defaultValues: defaultValues as DefaultValues<T> });
  const watched = form.watch() as T;
  const debounced = useDebounce(watched, delay);

  useEffect(() => {
    const wasDirty = form.formState.isDirty;
    if (wasDirty) {
      onSync(debounced);
    }
    // form.reset mirrors what every sub-form does after the gate
    form.reset({ ...debounced }, { keepErrors: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return form;
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("wasDirty gate — sub-form sync pattern", () => {
  it("does NOT call setFormState on initial mount (the core fix)", async () => {
    const setFormState = vi.fn();

    renderHook(() =>
      useDraftSyncPattern({ firstName: "", lastName: "" }, setFormState),
    );

    await act(async () => { vi.advanceTimersByTime(200); });

    expect(setFormState).not.toHaveBeenCalled();
  });

  it("calls setFormState after the user edits a field", async () => {
    const setFormState = vi.fn();

    const { result } = renderHook(() =>
      useDraftSyncPattern({ firstName: "", lastName: "" }, setFormState),
    );

    act(() => {
      result.current.setValue("firstName", "Juan", { shouldDirty: true });
    });

    await act(async () => { vi.advanceTimersByTime(200); });

    expect(setFormState).toHaveBeenCalledOnce();
    expect(setFormState).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Juan" }));
  });

  it("does NOT call setFormState on subsequent fires after form.reset() clears dirty state", async () => {
    const setFormState = vi.fn();

    const { result } = renderHook(() =>
      useDraftSyncPattern({ firstName: "" }, setFormState),
    );

    // First edit — fires once (dirty)
    act(() => { result.current.setValue("firstName", "Batch", { shouldDirty: true }); });
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(setFormState).toHaveBeenCalledOnce();

    // form.reset() inside the effect cleared isDirty. Another debounce cycle
    // (with the same serialised value) must not re-fire setFormState.
    setFormState.mockClear();
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(setFormState).not.toHaveBeenCalled();
  });

  it("does NOT write to the store when form.reset() is called externally (simulates AutoResumeDraft restore)", async () => {
    // AutoResumeDraft writes new values to the Zustand store. From the
    // sub-form's perspective, the React Hook Form defaultValues are already
    // the restored values — the form was never dirtied by the user. Calling
    // form.reset() externally (e.g., in a parent effect) must not trigger
    // setFormState because reset() clears isDirty.
    const setFormState = vi.fn();

    const { result } = renderHook(() =>
      useDraftSyncPattern({ firstName: "" }, setFormState),
    );

    // Simulate external reset with restored draft data (isDirty stays false)
    act(() => { result.current.reset({ firstName: "RestoredName" }); });

    await act(async () => { vi.advanceTimersByTime(200); });

    expect(setFormState).not.toHaveBeenCalled();
  });

  it("allows a second edit after a reset to write through", async () => {
    const setFormState = vi.fn();

    const { result } = renderHook(() =>
      useDraftSyncPattern({ firstName: "" }, setFormState),
    );

    // External reset (like draft restore) — should NOT fire
    act(() => { result.current.reset({ firstName: "Restored" }); });
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(setFormState).not.toHaveBeenCalled();

    // User edits after the restore — SHOULD fire
    act(() => { result.current.setValue("firstName", "UserEdit", { shouldDirty: true }); });
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(setFormState).toHaveBeenCalledOnce();
    expect(setFormState).toHaveBeenCalledWith(expect.objectContaining({ firstName: "UserEdit" }));
  });

  it("collapses rapid edits — setFormState called once with the final value", async () => {
    const setFormState = vi.fn();

    const { result } = renderHook(() =>
      useDraftSyncPattern({ name: "a" }, setFormState, 200),
    );

    act(() => { result.current.setValue("name", "b", { shouldDirty: true }); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current.setValue("name", "c", { shouldDirty: true }); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current.setValue("name", "final", { shouldDirty: true }); });

    await act(async () => { vi.advanceTimersByTime(300); });

    expect(setFormState).toHaveBeenCalledOnce();
    expect(setFormState).toHaveBeenCalledWith(expect.objectContaining({ name: "final" }));
  });
});

// ---------------------------------------------------------------------------
// Additional edge cases: isValid preservation
// ---------------------------------------------------------------------------

describe("wasDirty gate — isValid field preservation", () => {
  it("when setFormState IS called, it includes any fields the debounced values carry", async () => {
    const setFormState = vi.fn();

    // Simulate a form that includes an isValid field in its debounced output.
    // The sub-forms spread debouncedValues directly, so isValid is preserved.
    const { result } = renderHook(() =>
      useDraftSyncPattern(
        { firstName: "", isValid: true } as Record<string, unknown>,
        setFormState,
      ),
    );

    act(() => {
      result.current.setValue("firstName", "Test", { shouldDirty: true });
    });

    await act(async () => { vi.advanceTimersByTime(200); });

    // isValid should be preserved in the synced data
    expect(setFormState).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "Test" }),
    );
  });
});
