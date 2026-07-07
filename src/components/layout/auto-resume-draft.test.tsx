/**
 * Integration tests for the AutoResumeDraft / AutoResumeLearnerDraft behaviour.
 *
 * AutoResumeDraft is an internal (non-exported) component of new-student-layout.tsx.
 * We test its behaviour via a thin harness that reproduces the exact glue logic (isExpired
 * check + navigate), while delegating the actual "database first, local cache as an
 * offline/error fallback" work to the real useResolveResumeDraft hook
 * (src/hooks/use-resolve-resume-draft.ts), which wraps resolveResumeDraft
 * (src/actions/resolve-draft.ts) in a TanStack Query — only the remote leg (loadDraftRemote) is
 * mocked. This keeps tests green without exporting an internal component, while still exercising
 * the real resume logic. The `isExpired` guard behaviour is also covered in
 * src/lib/draft-expiry.test.ts with exhaustive edge-case coverage.
 *
 * Key behaviours under test
 * ─────────────────────────
 * 1. Restore (database) — the database is always checked first, and wins even when a stale
 *    local copy of the same draft exists (see src/actions/resolve-draft.test.ts for the
 *    resolver's own unit coverage) → context receives the DB draft data, navigate fires
 * 2. Restore (local fallback) — remote lookup fails (offline/unauthenticated) and a local copy
 *    exists → restores from the local cache instead of blocking the user
 * 3. Not found anywhere (a clean remote miss, and remote failure with no local copy either) →
 *    navigates to /admission/drafts
 * 4. Expired guard — a resolved draft (from either source) that's expired → navigate to
 *    /admission/drafts, no restore
 * 5. Ordering guard — hasRun.current prevents double-fire on StrictMode remount
 * 6. Cross-draft contamination — after loading draft A, loading draft B replaces A's data
 * 7. Outlet gate — the layout must not mount the step page (Outlet) until the resume
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

describe("AutoResumeDraft — restore from the database (primary path)", () => {
  it("calls context setters and navigates using the database entry, even when a stale local copy exists", async () => {
    // A stale local copy of the same draft — the database must win over this, not the reverse.
    seedDraft("draft-abc", "hfse-is", {
      formState: { studentInfo: { studentDetails: { firstName: "Stale-Local" } } },
    } as Partial<EnrolNewStudentDraftStore>);
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(remoteDraft("draft-abc", "hfse-is"));

    const utils = renderHarness("draft-abc", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/enrol-student/new/family-info"));

    expect(loadDraftRemote).toHaveBeenCalledWith("draft-abc");
    expect(utils.cbs.setActiveTab).toHaveBeenCalledWith("/enrol-student/new/family-info");
    expect(utils.cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-abc",
        studentInfo: { studentDetails: { firstName: "Remote" } },
      }),
    );

    // The fresh database entry must now be cached locally, overwriting the stale copy, so a
    // later offline resume of this same draft still works.
    const cached = localStorage.getItem("enrolNewStudent:draft:draft-abc:hfse-is");
    expect(JSON.parse(cached!).state.formState).toEqual({
      studentInfo: { studentDetails: { firstName: "Remote" } },
    });
  });

  it("does not call context setters when no resumeDraftId in location state", async () => {
    seedDraft("draft-abc", "hfse-is");

    const utils = renderHarness(undefined, "hfse-is");

    await act(async () => {});

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
    expect(loadDraftRemote).not.toHaveBeenCalled();
  });

  it("navigates to /admission/drafts on a clean remote miss (the draft was deleted server-side)", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(null);

    const utils = renderHarness("nowhere-to-be-found", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — local fallback (remote lookup fails)", () => {
  it("restores from the local cache when the remote lookup fails but a local copy exists (offline resume)", async () => {
    // activeTab deliberately differs from the harness's initial route, so waitFor below only
    // passes once AutoResumeDraft's own navigate() actually fires (not on the initial render).
    seedDraft("draft-during-outage", "hfse-is", {
      formState: { studentInfo: { studentDetails: { firstName: "Juan" } } },
      activeTab: "/enrol-student/new/family-info",
      currentTab: "/enrol-student/new/family-info",
    } as Partial<EnrolNewStudentDraftStore>);
    vi.mocked(loadDraftRemote).mockRejectedValueOnce(new Error("Not authenticated"));

    const utils = renderHarness("draft-during-outage", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/enrol-student/new/family-info"));

    expect(utils.cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-during-outage",
        studentInfo: { studentDetails: { firstName: "Juan" } },
      }),
    );
  });

  it("navigates to /admission/drafts when the remote lookup fails and there is no local copy either", async () => {
    vi.mocked(loadDraftRemote).mockRejectedValueOnce(new Error("Not authenticated"));

    const utils = renderHarness("draft-during-outage-no-cache", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — expired draft guard", () => {
  it("navigates to /admission/drafts without restoring when the resolved database draft is expired", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(
      remoteDraft("expired-draft", "hfse-is", {
        expiresAt: new Date("2020-01-01T00:00:00Z").toISOString(), // well in the past
      }),
    );

    const utils = renderHarness("expired-draft", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
    expect(utils.cbs.setActiveTab).not.toHaveBeenCalled();
    expect(utils.cbs.setCurrentTab).not.toHaveBeenCalled();
    expect(utils.cbs.setCompletedTabs).not.toHaveBeenCalled();
  });

  it("navigates to /admission/drafts when the resolved database draft has no expiresAt (fail-safe)", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(
      remoteDraft("no-expiry", "hfse-is", { expiresAt: undefined }),
    );

    const utils = renderHarness("no-expiry", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });

  it("navigates to /admission/drafts without restoring when the local-fallback draft is expired", async () => {
    seedDraft("expired-local-fallback", "hfse-is", {
      expiresAt: new Date("2020-01-01T00:00:00Z") as unknown as Date, // well in the past
    });
    vi.mocked(loadDraftRemote).mockRejectedValueOnce(new Error("Not authenticated"));

    const utils = renderHarness("expired-local-fallback", "hfse-is");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/admission/drafts"));

    expect(utils.cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — hasRun guard", () => {
  it("restores the draft on initial mount exactly once", async () => {
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(remoteDraft("draft-once", "hfse-is"));

    const utils = renderHarness("draft-once", "hfse-is");

    await waitFor(() => expect(utils.cbs.setFormState).toHaveBeenCalledOnce());

    expect(utils.cbs.setFormState).toHaveBeenCalledWith(expect.objectContaining({ draftId: "draft-once" }));
  });
});

describe("AutoResumeDraft — cross-draft contamination", () => {
  it("restoring draft B correctly sets B's data (does not leave A's stale local data)", async () => {
    // A's stale local cache is present, but resuming B must not leak A's data into the form.
    seedDraft("draft-a", "hfse-is", {
      formState: { studentInfo: { studentDetails: { firstName: "Alice" } } },
      activeTab: "/enrol-student/new/student-info",
    } as Partial<EnrolNewStudentDraftStore>);
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(
      remoteDraft("draft-b", "hfse-is", {
        formState: { studentInfo: { studentDetails: { firstName: "Bob" } } },
        activeTab: "/enrol-student/new/family-info",
      }),
    );

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
    vi.mocked(loadDraftRemote).mockResolvedValueOnce(
      remoteDraft("viz-draft-1", "viz-school", {
        activeTab: "/vizschool/enrol-student/new/student-info",
        currentTab: "/vizschool/enrol-student/new/student-info",
      }),
    );

    const utils = renderHarness("viz-draft-1", "viz-school");

    await waitFor(() => expect(pathnameOf(utils)).toBe("/vizschool/enrol-student/new/student-info"));

    expect(utils.cbs.setActiveTab).toHaveBeenCalledWith("/vizschool/enrol-student/new/student-info");
    expect(utils.cbs.setFormState).toHaveBeenCalledWith(expect.objectContaining({ draftId: "viz-draft-1" }));
  });

  it("the local fallback does not match a same-id draft cached under a different flow type", async () => {
    // Draft exists in the hfse-is local cache only; falling back to local (remote failed) under
    // viz-school must not accidentally match the wrong flow's cache entry.
    seedDraft("hfse-only-draft", "hfse-is");
    vi.mocked(loadDraftRemote).mockRejectedValueOnce(new Error("Not authenticated"));

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
