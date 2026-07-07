import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNewStudentDraftStore } from "@/zustand-store";

vi.mock("@/actions/drafts", () => ({ saveDraftRemote: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn(), warning: vi.fn() } }));

const { useSaveApplication } = await import("./use-save-application");
const { saveDraftRemote } = await import("@/actions/drafts");
const { toast } = await import("sonner");

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/enrol-student/new/student-info"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function baseProps(overrides: Partial<Parameters<typeof useSaveApplication>[0]> = {}) {
  return {
    setFormState: vi.fn(),
    formState: {},
    currentTab: "/enrol-student/new/student-info",
    completedTabs: ["/enrol-student/new/student-info"],
    activeTab: "/enrol-student/new/student-info",
    type: "hfse-is" as const,
    academicYear: "2024-2025",
    ...overrides,
  };
}

function renderSaveApplication(overrides: Partial<Parameters<typeof useSaveApplication>[0]> = {}) {
  return renderHook(
    (props: Partial<Parameters<typeof useSaveApplication>[0]>) => ({
      ...useSaveApplication(baseProps({ ...overrides, ...props })),
      location: useLocation(),
    }),
    { wrapper },
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.mocked(saveDraftRemote).mockResolvedValue(undefined);
});

afterEach(() => {
  localStorage.clear();
});

describe("useSaveApplication", () => {
  it("creates a new draftId and calls setFormState when formState has none", async () => {
    const setFormState = vi.fn();
    const { result } = renderSaveApplication({ setFormState, formState: {} });

    await act(async () => {
      await result.current.saveApplication({ willExit: false });
    });

    expect(setFormState).toHaveBeenCalledWith({ draftId: expect.any(String) });
  });

  it("reuses an existing draftId and does not call setFormState with a new one", async () => {
    const setFormState = vi.fn();
    const { result } = renderSaveApplication({ setFormState, formState: { draftId: "existing-draft" } });

    await act(async () => {
      await result.current.saveApplication({ willExit: false });
    });

    expect(setFormState).not.toHaveBeenCalled();
  });

  it("always persists the draft to the local cache store, regardless of willExit", async () => {
    const { result } = renderSaveApplication({ formState: { draftId: "local-draft" }, academicYear: "2024-2025" });

    await act(async () => {
      await result.current.saveApplication({ willExit: false });
    });

    const persisted = JSON.parse(localStorage.getItem("enrolNewStudent:draft:local-draft:hfse-is")!);
    expect(persisted.state.draftId).toBe("local-draft");
    expect(persisted.state.academicYear).toBe("2024-2025");
    expect(persisted.state.currentTab).toBe("/enrol-student/new/student-info");
  });

  it("does not call saveDraftRemote, toast, or navigate when willExit is false", async () => {
    const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

    await act(async () => {
      await result.current.saveApplication({ willExit: false });
    });

    expect(saveDraftRemote).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(result.current.location.pathname).toBe("/enrol-student/new/student-info");
  });

  it("calls saveDraftRemote with the assembled draft, toasts success, and navigates when willExit is true", async () => {
    const { result } = renderSaveApplication({
      formState: { draftId: "local-draft" },
      academicYear: "2024-2025",
      type: "viz-school",
    });

    await act(async () => {
      await result.current.saveApplication({ willExit: true });
    });

    expect(saveDraftRemote).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "local-draft",
        type: "viz-school",
        academicYear: "2024-2025",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Your application has been saved!",
      expect.objectContaining({ description: expect.any(String) }),
    );

    await waitFor(() => expect(result.current.location.pathname).toBe("/admission/dashboard"));
  });

  it("invalidates the drafts query after a successful remote save, so the sidebar/dashboard counts refresh", async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries");

    const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

    await act(async () => {
      await result.current.saveApplication({ willExit: true });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["drafts"] });
  });

  it("does not invalidate the drafts query when the remote save fails", async () => {
    vi.mocked(saveDraftRemote).mockRejectedValueOnce(new Error("network down"));
    const invalidateSpy = vi.spyOn(QueryClient.prototype, "invalidateQueries");

    const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

    await act(async () => {
      await result.current.saveApplication({ willExit: true });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("swallows a saveDraftRemote failure: local save, soft toast, and navigation still occur", async () => {
    vi.mocked(saveDraftRemote).mockRejectedValueOnce(new Error("network down"));

    const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

    await act(async () => {
      await expect(result.current.saveApplication({ willExit: true })).resolves.toBeUndefined();
    });

    expect(toast.info).toHaveBeenCalledWith(
      "Saved on this device",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(toast.success).toHaveBeenCalled();

    const persisted = JSON.parse(localStorage.getItem("enrolNewStudent:draft:local-draft:hfse-is")!);
    expect(persisted.state.draftId).toBe("local-draft");

    await waitFor(() => expect(result.current.location.pathname).toBe("/admission/dashboard"));
  });

  it("toggles isLoading true during the save and false once it settles", async () => {
    let resolveSave!: () => void;
    vi.mocked(saveDraftRemote).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveSave = resolve;
      }),
    );

    const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

    expect(result.current.isLoading).toBe(false);

    let savePromise!: Promise<void>;
    act(() => {
      savePromise = result.current.saveApplication({ willExit: true });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveSave();
      await savePromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("preserves an existing createdAt from formState rather than stamping a new one", async () => {
    const existingCreatedAt = new Date("2024-01-01T00:00:00.000Z");
    const { result } = renderSaveApplication({
      formState: { draftId: "local-draft", createdAt: existingCreatedAt },
    });

    await act(async () => {
      await result.current.saveApplication({ willExit: false });
    });

    const store = createNewStudentDraftStore("hfse-is", "local-draft");
    expect(new Date(store.getState().createdAt).toISOString()).toBe(existingCreatedAt.toISOString());
  });

  describe("debounced remote sync (willExit: false)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does not call saveDraftRemote before the debounce delay elapses", async () => {
      const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

      await act(async () => {
        await result.current.saveApplication({ willExit: false });
      });

      expect(saveDraftRemote).not.toHaveBeenCalled();
    });

    it("calls saveDraftRemote with the latest snapshot once the debounce delay elapses", async () => {
      const { result } = renderSaveApplication({
        formState: { draftId: "local-draft" },
        currentTab: "/enrol-student/new/family-info",
      });

      await act(async () => {
        await result.current.saveApplication({ willExit: false });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(saveDraftRemote).toHaveBeenCalledTimes(1);
      expect(saveDraftRemote).toHaveBeenCalledWith(
        expect.objectContaining({ draftId: "local-draft", currentTab: "/enrol-student/new/family-info" }),
      );
    });

    it("coalesces rapid successive step submits into a single remote write", async () => {
      const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

      await act(async () => {
        await result.current.saveApplication({ willExit: false });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000); // less than the debounce delay
      });
      await act(async () => {
        await result.current.saveApplication({ willExit: false }); // resets the pending timer
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(saveDraftRemote).toHaveBeenCalledTimes(1);
    });

    it("a willExit: true save cancels a pending debounced sync instead of double-writing", async () => {
      const { result } = renderSaveApplication({ formState: { draftId: "local-draft" } });

      await act(async () => {
        await result.current.saveApplication({ willExit: false });
      });

      // willExit: true internally awaits real-time `wait()` calls (toast/navigate delays), so
      // kick it off without awaiting inline and drain both the debounce and those waits together.
      let exitSavePromise!: Promise<void>;
      act(() => {
        exitSavePromise = result.current.saveApplication({ willExit: true });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
        await exitSavePromise;
      });

      expect(saveDraftRemote).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(saveDraftRemote).toHaveBeenCalledTimes(1);
    });

    it("cancels a pending debounced sync on unmount", async () => {
      const { result, unmount } = renderSaveApplication({ formState: { draftId: "local-draft" } });

      await act(async () => {
        await result.current.saveApplication({ willExit: false });
      });

      unmount();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(saveDraftRemote).not.toHaveBeenCalled();
    });
  });
});
