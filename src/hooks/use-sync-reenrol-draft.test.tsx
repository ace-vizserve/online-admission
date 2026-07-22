import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEnrolOldStudentStore } from "@/zustand-store";

vi.mock("@/actions/drafts", () => ({ saveReenrolDraftRemote: vi.fn() }));

const { useSyncReenrolDraft } = await import("./use-sync-reenrol-draft");
const { saveReenrolDraftRemote } = await import("@/actions/drafts");

// Mirrors zustand-store.test.ts's setFormState — a loosely-typed call into the *real*
// setFormState action (not a direct setState bypass), since this hook's whole job is reacting
// to the lastSavedAt stamp that only the real action produces.
function saveTab(formState: Record<string, unknown>) {
  const setFormStateLoose = useEnrolOldStudentStore.getState().setFormState as (data: Record<string, unknown>) => void;
  setFormStateLoose(formState);
}

beforeEach(() => {
  useEnrolOldStudentStore.getState().clearState();
  vi.clearAllMocks();
  vi.mocked(saveReenrolDraftRemote).mockResolvedValue(undefined);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSyncReenrolDraft", () => {
  it("does not sync on mount, even when the store already has a lastSavedAt (the initial hydrate write)", async () => {
    saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });

    renderHook(() => useSyncReenrolDraft("E260050", "2026-2027"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(saveReenrolDraftRemote).not.toHaveBeenCalled();
  });

  it("syncs a subsequent local save (a real per-tab edit) after the debounce delay", async () => {
    renderHook(() => useSyncReenrolDraft("E260050", "2026-2027"));

    act(() => {
      // The store's own setFormState is what stamps lastSavedAt — this simulates a tab's
      // "Save details" button, not a direct/loose store write.
      saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(saveReenrolDraftRemote).toHaveBeenCalledTimes(1);
    expect(saveReenrolDraftRemote).toHaveBeenCalledWith(
      expect.objectContaining({
        enroleeNumber: "E260050",
        academicYear: "2026-2027",
        formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
      }),
    );
  });

  it("does not sync before the debounce delay elapses", async () => {
    renderHook(() => useSyncReenrolDraft("E260050", "2026-2027"));

    act(() => {
      saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(saveReenrolDraftRemote).not.toHaveBeenCalled();
  });

  it("coalesces rapid successive tab saves into a single remote write", async () => {
    renderHook(() => useSyncReenrolDraft("E260050", "2026-2027"));

    act(() => {
      saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000); // less than the debounce delay
    });
    act(() => {
      saveTab({ familyInfo: { motherInfo: { motherFirstName: "Maria" } } }); // resets the pending timer
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(saveReenrolDraftRemote).toHaveBeenCalledTimes(1);
    expect(saveReenrolDraftRemote).toHaveBeenCalledWith(
      expect.objectContaining({
        formState: {
          studentInfo: { studentDetails: { firstName: "Juan" } },
          familyInfo: { motherInfo: { motherFirstName: "Maria" } },
        },
      }),
    );
  });

  it("does not schedule a sync when enroleeNumber is undefined", async () => {
    renderHook(() => useSyncReenrolDraft(undefined, "2026-2027"));

    act(() => {
      saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(saveReenrolDraftRemote).not.toHaveBeenCalled();
  });

  it("silently swallows a saveReenrolDraftRemote failure (best-effort; the next save retries)", async () => {
    vi.mocked(saveReenrolDraftRemote).mockRejectedValueOnce(new Error("network down"));

    renderHook(() => useSyncReenrolDraft("E260050", "2026-2027"));

    act(() => {
      saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    });

    await expect(
      act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      }),
    ).resolves.not.toThrow();

    expect(saveReenrolDraftRemote).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending debounced sync on unmount", async () => {
    const { unmount } = renderHook(() => useSyncReenrolDraft("E260050", "2026-2027"));

    act(() => {
      saveTab({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    });

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(saveReenrolDraftRemote).not.toHaveBeenCalled();
  });
});
