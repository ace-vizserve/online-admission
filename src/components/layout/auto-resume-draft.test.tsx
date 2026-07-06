/**
 * Integration tests for the AutoResumeDraft / AutoResumeLearnerDraft behaviour.
 *
 * AutoResumeDraft is an internal (non-exported) component of new-student-layout.tsx.
 * We test its behaviour via a thin harness that reproduces the exact glue logic (isExpired
 * check + navigate), while delegating the actual "find locally, else fetch from the server"
 * work to the real useResolveResumeDraft hook (src/hooks/use-resolve-resume-draft.ts), which
 * wraps resolveResumeDraft (src/actions/resolve-draft.ts) in a TanStack Query — only the
 * remote leg (loadDraftRemote) is mocked. This keeps tests green without exporting an internal
 * component, while still exercising the real cross-device resume logic. The `isExpired` guard
 * behaviour is also covered in src/lib/draft-expiry.test.ts with exhaustive edge-case coverage.
 *
 * Key behaviours under test
 * ─────────────────────────
 * 1. Restore (local) — valid local draft is found → context receives draft data, navigate fires
 * 2. Restore (remote fallback) — no local match, server has it → hydrates local cache, restores
 * 3. Not found anywhere (local nor remote) → navigates to /admission/drafts
 * 4. Remote lookup fails (offline/unauthenticated) → navigates to /admission/drafts
 * 5. Expired guard (local match) — expired draft → navigate to /admission/drafts, no restore
 * 6. Ordering guard — hasRun.current prevents double-fire on StrictMode remount
 * 7. Cross-draft contamination — after loading draft A, loading draft B replaces A's data
 * 8. Outlet gate — the layout must not mount the step page (Outlet) until the resume
 *    finishes, otherwise React Hook Form captures empty defaultValues before the store is
 *    populated (the "Continue from Saved Drafts opens a blank form" bug). Gate is driven by
 *    `isResumingFromDashboard` (location.state?.resumeDraftId), which AutoResumeDraft clears
 *    by navigating with no state once the resume completes.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isExpired } from "../../lib/draft-storage";
import type { EnrolNewStudentDraftStore } from "../../zustand-store";

vi.mock("@/actions/drafts", () => ({ loadDraftRemote: vi.fn() }));

const { useResolveResumeDraft } = await import("@/hooks/use-resolve-resume-draft");
const { loadDraftRemote } = await import("@/actions/drafts");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seeds a Zustand-persist-wrapped draft into localStorage. */
function seedDraft(
  draftId: string,
  type: "hfse-is" | "viz-school",
  overrides: Partial<EnrolNewStudentDraftStore> = {},
) {
  const key = `enrolNewStudent:draft:${draftId}:${type}`;
  const entry = {
    state: {
      draftId,
      type,
      academicYear: "2024-2025",
      activeTab: "/enrol-student/new/student-info",
      currentTab: "/enrol-student/new/student-info",
      completedTabs: ["/enrol-student/new/student-info"],
      formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
      lastSavedAt: new Date("2024-06-01").toISOString(),
      createdAt: new Date("2024-05-01").toISOString(),
      expiresAt: new Date("2099-01-01").toISOString(), // far future
      ...overrides,
    },
    version: 0,
  };
  localStorage.setItem(key, JSON.stringify(entry));
  return key;
}

function remoteDraft(draftId: string, type: "hfse-is" | "viz-school", overrides: Record<string, unknown> = {}) {
  return {
    state: {
      draftId,
      type,
      academicYear: "2024-2025",
      activeTab: "/enrol-student/new/family-info",
      currentTab: "/enrol-student/new/family-info",
      completedTabs: ["/enrol-student/new/student-info"],
      formState: { studentInfo: { studentDetails: { firstName: "Remote" } } },
      lastSavedAt: new Date("2024-06-01").toISOString(),
      createdAt: new Date("2024-05-01").toISOString(),
      expiresAt: new Date("2099-01-01").toISOString(),
      ...overrides,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void;

/** Thin harness: reproduces AutoResumeDraft's glue logic, delegating to the real useResolveResumeDraft hook. */
function AutoResumeDraftHarness({
  type,
  callbacks,
}: {
  type: "hfse-is" | "viz-school";
  callbacks: {
    setFormState: AnyFn;
    setActiveTab: AnyFn;
    setCurrentTab: AnyFn;
    setCompletedTabs: AnyFn;
  };
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const resumeDraftId = location.state?.resumeDraftId as string | undefined;
  const hasRun = useRef(false);

  const { data: match, isSuccess } = useResolveResumeDraft(resumeDraftId, type);

  useEffect(() => {
    if (!isSuccess || hasRun.current) return;
    hasRun.current = true;

    if (!match) {
      navigate("/admission/drafts", { replace: true });
      return;
    }

    const state = match.state as unknown as EnrolNewStudentDraftStore;

    if (isExpired(state.expiresAt)) {
      navigate("/admission/drafts", { replace: true });
      return;
    }

    callbacks.setActiveTab(state.activeTab);
    callbacks.setCurrentTab(state.currentTab);
    callbacks.setCompletedTabs(state.completedTabs);
    callbacks.setFormState({ ...state.formState, draftId: state.draftId });

    navigate(`${state.activeTab}?academicYear=${state.academicYear}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, match]);

  return <div data-testid="harness" />;
}

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

/** Wraps the harness in MemoryRouter + a fresh QueryClientProvider with the given initial location state. */
function renderHarness(resumeDraftId: string | undefined, type: "hfse-is" | "viz-school") {
  const cbs = {
    setFormState: vi.fn(),
    setActiveTab: vi.fn(),
    setCurrentTab: vi.fn(),
    setCompletedTabs: vi.fn(),
  };

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/enrol-student/new/student-info",
            state: resumeDraftId ? { resumeDraftId } : undefined,
          },
        ]}>
        <AutoResumeDraftHarness type={type} callbacks={cbs} />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...utils, cbs };
}

function pathnameOf(utils: ReturnType<typeof renderHarness>) {
  return utils.getByTestId("pathname").textContent;
}

/**
 * Reproduces the layout's Outlet gate (new-student-layout.tsx / new-learner-layout.tsx):
 * `isResumingFromDashboard` is derived straight from location.state?.resumeDraftId, so it's
 * true from first render and only clears when AutoResumeDraft's navigate() drops the state —
 * independent of whether useResolveResumeDraft has resolved yet.
 */
function LayoutGateHarness({ type }: { type: "hfse-is" | "viz-school" }) {
  const location = useLocation();
  const isResumingFromDashboard = Boolean(location.state?.resumeDraftId);
  const cbs = useRef({
    setFormState: vi.fn(),
    setActiveTab: vi.fn(),
    setCurrentTab: vi.fn(),
    setCompletedTabs: vi.fn(),
  }).current;

  return (
    <>
      <AutoResumeDraftHarness type={type} callbacks={cbs} />
      {isResumingFromDashboard ? <div data-testid="loader" /> : <div data-testid="outlet" />}
    </>
  );
}

function renderGateHarness(resumeDraftId: string | undefined, type: "hfse-is" | "viz-school") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/enrol-student/new/student-info",
            state: resumeDraftId ? { resumeDraftId } : undefined,
          },
        ]}>
        <LayoutGateHarness type={type} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AutoResumeDraft — restore a local draft", () => {
  it("calls context setters and navigates when a valid local draft is found", async () => {
    seedDraft("draft-abc", "hfse-is");

    const utils = renderHarness("draft-abc", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/enrol-student/new/student-info"));

    expect(utils.cbs.setActiveTab).toHaveBeenCalledWith("/enrol-student/new/student-info");
    expect(utils.cbs.setCurrentTab).toHaveBeenCalledWith("/enrol-student/new/student-info");
    expect(utils.cbs.setCompletedTabs).toHaveBeenCalledWith(["/enrol-student/new/student-info"]);
    expect(utils.cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-abc",
        studentInfo: { studentDetails: { firstName: "Juan" } },
      }),
    );
    // Local match found — no need to hit the server.
    expect(loadDraftRemote).not.toHaveBeenCalled();
  });

  it("does not call context setters when no resumeDraftId in location state", async () => {
    seedDraft("draft-abc", "hfse-is");

    const utils = renderHarness(undefined, "hfse-is");

    await act(async () => {});

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
    expect(loadDraftRemote).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — remote fallback (cross-device resume)", () => {
  it("falls back to the server, hydrates the local cache, and restores when found remotely", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(remoteDraft("remote-draft-1", "hfse-is"));

    const utils = renderHarness("remote-draft-1", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/enrol-student/new/family-info"));

    expect(loadDraftRemote).toHaveBeenCalledWith("remote-draft-1");
    expect(utils.cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "remote-draft-1",
        studentInfo: { studentDetails: { firstName: "Remote" } },
      }),
    );

    // The remote entry must now be cached locally so it's resumable offline afterwards.
    const cached = localStorage.getItem("enrolNewStudent:draft:remote-draft-1:hfse-is");
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached!).state.draftId).toBe("remote-draft-1");
  });

  it("navigates to /admission/drafts when the draft is found neither locally nor remotely", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(null);

    const utils = renderHarness("nowhere-to-be-found", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });

  it("navigates to /admission/drafts when the remote lookup fails (offline/unauthenticated)", async () => {
    vi.mocked(loadDraftRemote).mockRejectedValueOnce(new Error("Not authenticated"));

    const utils = renderHarness("draft-during-outage", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — expired draft guard", () => {
  it("navigates to /admission/drafts without restoring when the local draft is expired", async () => {
    seedDraft("expired-draft", "hfse-is", {
      expiresAt: new Date("2020-01-01T00:00:00Z") as unknown as Date, // well in the past
    });

    const utils = renderHarness("expired-draft", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
    expect(utils.cbs.setActiveTab).not.toHaveBeenCalled();
    expect(utils.cbs.setCurrentTab).not.toHaveBeenCalled();
    expect(utils.cbs.setCompletedTabs).not.toHaveBeenCalled();
  });

  it("navigates to /admission/drafts when the local draft has no expiresAt (fail-safe)", async () => {
    const key = `enrolNewStudent:draft:no-expiry:hfse-is`;
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          draftId: "no-expiry",
          type: "hfse-is",
          academicYear: "2024-2025",
          activeTab: "/enrol-student/new/student-info",
          currentTab: "/enrol-student/new/student-info",
          completedTabs: [],
          formState: {},
          // expiresAt deliberately absent
        },
        version: 0,
      }),
    );

    const utils = renderHarness("no-expiry", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — hasRun guard", () => {
  it("restores the draft on initial mount exactly once", async () => {
    seedDraft("draft-once", "hfse-is");

    const utils = renderHarness("draft-once", "hfse-is");

    await waitFor(() => expect(utils.cbs.setFormState).toHaveBeenCalledOnce());

    expect(utils.cbs.setFormState).toHaveBeenCalledWith(expect.objectContaining({ draftId: "draft-once" }));
  });
});

describe("AutoResumeDraft — cross-draft contamination", () => {
  it("restoring draft B correctly sets B's data (does not leave A's data)", async () => {
    seedDraft("draft-a", "hfse-is", {
      formState: { studentInfo: { studentDetails: { firstName: "Alice" } } },
      activeTab: "/enrol-student/new/student-info",
    } as Partial<EnrolNewStudentDraftStore>);
    seedDraft("draft-b", "hfse-is", {
      formState: { studentInfo: { studentDetails: { firstName: "Bob" } } },
      activeTab: "/enrol-student/new/family-info",
    } as Partial<EnrolNewStudentDraftStore>);

    const utils = renderHarness("draft-b", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/enrol-student/new/family-info"));

    expect(utils.cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-b",
        studentInfo: { studentDetails: { firstName: "Bob" } },
      }),
    );
    expect(utils.cbs.setActiveTab).toHaveBeenCalledWith("/enrol-student/new/family-info");
  });
});

describe("AutoResumeDraft — viz-school flow", () => {
  it("finds viz-school drafts correctly and calls setters", async () => {
    seedDraft("viz-draft-1", "viz-school", {
      activeTab: "/vizschool/enrol-student/new/student-info",
      currentTab: "/vizschool/enrol-student/new/student-info",
    } as Partial<EnrolNewStudentDraftStore>);

    const utils = renderHarness("viz-draft-1", "viz-school");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/vizschool/enrol-student/new/student-info"));

    expect(utils.cbs.setActiveTab).toHaveBeenCalledWith("/vizschool/enrol-student/new/student-info");
    expect(utils.cbs.setFormState).toHaveBeenCalledWith(expect.objectContaining({ draftId: "viz-draft-1" }));
  });

  it("falls back to the server (not the hfse-is store) when a hfse-is draft exists under the same id but type is viz-school", async () => {
    // Draft exists in hfse-is only; looking under viz-school finds no local match, so it
    // must fall through to the remote lookup rather than accidentally matching the wrong flow.
    seedDraft("hfse-only-draft", "hfse-is");
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(null);

    const utils = renderHarness("hfse-only-draft", "viz-school");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
    expect(loadDraftRemote).toHaveBeenCalledWith("hfse-only-draft");
  });
});

describe("AutoResumeDraft — Outlet gate (mount-timing fix)", () => {
  it("keeps the loader up (Outlet not mounted) while a local draft resolve is still in flight", () => {
    seedDraft("draft-abc", "hfse-is");

    const utils = renderGateHarness("draft-abc", "hfse-is");

    // Synchronously after render, the query hasn't resolved yet (it resolves on a microtask),
    // so location.state?.resumeDraftId is still set and the gate must show the loader.
    expect(utils.queryByTestId("loader")).not.toBeNull();
    expect(utils.queryByTestId("outlet")).toBeNull();
  });

  it("swaps to the Outlet only once the resolve completes and the resume navigate clears the state", async () => {
    seedDraft("draft-abc", "hfse-is");

    const utils = renderGateHarness("draft-abc", "hfse-is");

    await waitFor(() => expect(utils.queryByTestId("outlet")).not.toBeNull());
    expect(utils.queryByTestId("loader")).toBeNull();
  });

  it("keeps the loader up for the whole remote fallback lookup, not just the local check", async () => {
    let resolveRemote!: (value: ReturnType<typeof remoteDraft> | null) => void;
    vi.mocked(loadDraftRemote).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRemote = resolve;
      }),
    );

    const utils = renderGateHarness("remote-draft-1", "hfse-is");

    expect(utils.queryByTestId("loader")).not.toBeNull();
    expect(utils.queryByTestId("outlet")).toBeNull();

    resolveRemote(remoteDraft("remote-draft-1", "hfse-is"));

    await waitFor(() => expect(utils.queryByTestId("outlet")).not.toBeNull());
  });

  it("renders the Outlet immediately when there is no resumeDraftId (normal, non-resume navigation)", () => {
    const utils = renderGateHarness(undefined, "hfse-is");

    expect(utils.queryByTestId("outlet")).not.toBeNull();
    expect(utils.queryByTestId("loader")).toBeNull();
  });

  it("applies the same gate for the viz-school flow", async () => {
    seedDraft("viz-draft-1", "viz-school", {
      activeTab: "/vizschool/enrol-student/new/student-info",
      currentTab: "/vizschool/enrol-student/new/student-info",
    } as Partial<EnrolNewStudentDraftStore>);

    const utils = renderGateHarness("viz-draft-1", "viz-school");

    expect(utils.queryByTestId("loader")).not.toBeNull();
    await waitFor(() => expect(utils.queryByTestId("outlet")).not.toBeNull());
  });
});
