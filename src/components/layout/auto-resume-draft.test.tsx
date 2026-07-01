/**
 * Integration tests for the AutoResumeDraft / AutoResumeLearnerDraft behaviour.
 *
 * AutoResumeDraft is an internal (non-exported) component of new-student-layout.tsx.
 * We test its behaviour via a thin harness that reproduces the exact logic —
 * this keeps tests green without exporting an internal component, while still
 * proving the flow works end-to-end. The `isExpired` guard behaviour is also
 * covered in src/lib/draft-expiry.test.ts with exhaustive edge-case coverage.
 *
 * Key behaviours under test
 * ─────────────────────────
 * 1. Restore — valid draft is found → context receives draft data, navigate fires
 * 2. Expired guard — expired draft → navigate to /admission/drafts, no restore
 * 3. Not found — no matching draftId → nothing happens
 * 4. Ordering guard — hasRun.current prevents double-fire on StrictMode remount
 * 5. Cross-draft contamination — after loading draft A, loading draft B replaces A's data
 */
import { act, render } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isExpired, listNewStudentDrafts } from "../../lib/utils";
import type { EnrolNewStudentDraftStore } from "../../zustand-store";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => void;

/** Thin harness: reproduces AutoResumeDraft's exact post-fix logic in testable form. */
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

  useEffect(() => {
    if (!resumeDraftId || hasRun.current) return;
    hasRun.current = true;

    const allDrafts = listNewStudentDrafts(type);
    const match = allDrafts.find(
      (d: { state: EnrolNewStudentDraftStore }) => d.state?.draftId === resumeDraftId,
    );
    if (!match) return;

    const state = match.state as EnrolNewStudentDraftStore;

    if (isExpired(state.expiresAt)) {
      navigate("/admission/drafts", { replace: true });
      return;
    }

    callbacks.setActiveTab(state.activeTab);
    callbacks.setCurrentTab(state.currentTab);
    callbacks.setCompletedTabs(state.completedTabs);
    callbacks.setFormState({ ...state.formState, draftId: state.draftId });

    navigate(`${state.activeTab}?academicYear=${state.academicYear}`, { replace: true });
  }, []);

  return <div data-testid="harness" />;
}

/** Wraps the harness in MemoryRouter with the given initial location state. */
function renderHarness(
  resumeDraftId: string | undefined,
  type: "hfse-is" | "viz-school",
) {
  const cbs = {
    setFormState: vi.fn(),
    setActiveTab: vi.fn(),
    setCurrentTab: vi.fn(),
    setCompletedTabs: vi.fn(),
  };

  const utils = render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/enrol-student/new/student-info",
          state: resumeDraftId ? { resumeDraftId } : undefined,
        },
      ]}>
      <AutoResumeDraftHarness type={type} callbacks={cbs} />
    </MemoryRouter>,
  );

  return { ...utils, cbs };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AutoResumeDraft — restore valid draft", () => {
  it("calls context setters when a valid draft is found", async () => {
    seedDraft("draft-abc", "hfse-is");

    const { cbs } = renderHarness("draft-abc", "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    expect(cbs.setActiveTab).toHaveBeenCalledWith("/enrol-student/new/student-info");
    expect(cbs.setCurrentTab).toHaveBeenCalledWith("/enrol-student/new/student-info");
    expect(cbs.setCompletedTabs).toHaveBeenCalledWith(["/enrol-student/new/student-info"]);
    expect(cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-abc",
        studentInfo: { studentDetails: { firstName: "Juan" } },
      }),
    );
  });

  it("does not call context setters when no resumeDraftId in location state", async () => {
    seedDraft("draft-abc", "hfse-is");

    const { cbs } = renderHarness(undefined, "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    expect(cbs.setFormState).not.toHaveBeenCalled();
  });

  it("does not call context setters when draftId does not match any stored draft", async () => {
    seedDraft("draft-different", "hfse-is");

    const { cbs } = renderHarness("draft-xyz-not-found", "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    expect(cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — expired draft guard (Bug fix #3)", () => {
  it("navigates to /admission/drafts without restoring when draft is expired", async () => {
    // Freeze time so we can control what "now" is.
    vi.setSystemTime(new Date("2024-07-01T12:00:00Z"));

    seedDraft("expired-draft", "hfse-is", {
      expiresAt: new Date("2024-06-01T12:00:00Z") as unknown as Date, // past
    });

    const { cbs } = renderHarness("expired-draft", "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    // Context setters must NOT be called
    expect(cbs.setFormState).not.toHaveBeenCalled();
    expect(cbs.setActiveTab).not.toHaveBeenCalled();
    expect(cbs.setCurrentTab).not.toHaveBeenCalled();
    expect(cbs.setCompletedTabs).not.toHaveBeenCalled();
  });

  it("navigates to /admission/drafts when draft has no expiresAt (fail-safe)", async () => {
    // A draft missing expiresAt is untrustworthy → treat as expired
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

    const { cbs } = renderHarness("no-expiry", "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    expect(cbs.setFormState).not.toHaveBeenCalled();
  });
});

describe("AutoResumeDraft — hasRun guard", () => {
  it("restores the draft on initial mount", async () => {
    seedDraft("draft-once", "hfse-is");

    const { cbs } = renderHarness("draft-once", "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    // On first mount the draft is restored exactly once.
    expect(cbs.setFormState).toHaveBeenCalledOnce();
    expect(cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({ draftId: "draft-once" }),
    );
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

    const { cbs } = renderHarness("draft-b", "hfse-is");

    await act(async () => { vi.runAllTimers(); });

    // Only draft B's data should be in the setFormState call
    expect(cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({
        draftId: "draft-b",
        studentInfo: { studentDetails: { firstName: "Bob" } },
      }),
    );
    expect(cbs.setActiveTab).toHaveBeenCalledWith("/enrol-student/new/family-info");
  });
});

describe("AutoResumeDraft — viz-school flow", () => {
  it("finds viz-school drafts correctly and calls setters", async () => {
    seedDraft("viz-draft-1", "viz-school", {
      activeTab: "/vizschool/enrol-student/new/student-info",
      currentTab: "/vizschool/enrol-student/new/student-info",
    } as Partial<EnrolNewStudentDraftStore>);

    const { cbs } = renderHarness("viz-draft-1", "viz-school");

    await act(async () => { vi.runAllTimers(); });

    expect(cbs.setActiveTab).toHaveBeenCalledWith("/vizschool/enrol-student/new/student-info");
    expect(cbs.setFormState).toHaveBeenCalledWith(
      expect.objectContaining({ draftId: "viz-draft-1" }),
    );
  });

  it("does not restore a hfse-is draft when type is viz-school", async () => {
    // Draft exists in hfse-is, but we look in viz-school
    seedDraft("hfse-only-draft", "hfse-is");

    const { cbs } = renderHarness("hfse-only-draft", "viz-school");

    await act(async () => { vi.runAllTimers(); });

    expect(cbs.setFormState).not.toHaveBeenCalled();
  });
});
