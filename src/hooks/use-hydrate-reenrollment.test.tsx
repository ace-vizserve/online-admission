import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEnrolOldStudentStore } from "@/zustand-store";

vi.mock("@/actions/get-reenrollment-data", () => ({
  getReEnrollmentData: vi.fn(),
}));

vi.mock("@/actions/drafts", () => ({
  loadReenrolDraftRemote: vi.fn(),
}));

const { useHydrateReEnrollment } = await import("./use-hydrate-reenrollment");
const { getReEnrollmentData } = await import("@/actions/get-reenrollment-data");
const { loadReenrolDraftRemote } = await import("@/actions/drafts");

const FIXTURE = {
  studentInfo: { studentDetails: { firstName: "Juan" } },
  familyInfo: { motherInfo: { motherFirstName: "Maria" } },
  studentUploadRequirements: { birthCert: "https://files.example.com/birth-cert.pdf" },
  parentGuardianUploadRequirements: { motherPassport: "https://files.example.com/mother-passport.pdf" },
  levelApplied: "Primary One",
  fatherEmail: "jose@example.com",
  guardianEmail: null,
};

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Mirrors src/test/render-form.tsx's `seedFormState` — a loosely-typed direct `setState`
// (full replace), since these tests intentionally seed partial/incomplete slices that don't
// structurally satisfy the strict `EnrolOldStudentFormState` schema types.
function seedStore(formState: Record<string, unknown>) {
  const setState = useEnrolOldStudentStore.setState as (partial: { formState: Record<string, unknown> }) => void;
  setState({ formState });
}

// Seeds the store's top-level draft metadata directly (bypassing setEnroleeNumber/setFormState)
// so a test can simulate "this is what was already in localStorage before the hook ran",
// independent of whatever the hook itself would stamp.
function seedDraftMeta(meta: { enroleeNumber?: string; expiresAt?: string }) {
  const setState = useEnrolOldStudentStore.setState as (partial: typeof meta) => void;
  setState(meta);
}

beforeEach(() => {
  useEnrolOldStudentStore.getState().clearState();
  vi.clearAllMocks();
  // Most tests aren't exercising the remote-draft fallback — default to "no remote draft" so
  // they don't have to opt out of it individually.
  vi.mocked(loadReenrolDraftRemote).mockResolvedValue(null);
});

describe("useHydrateReEnrollment", () => {
  it("reports isPending while the fetch is in flight and does not seed yet", async () => {
    let resolveFetch!: (value: unknown) => void;
    vi.mocked(getReEnrollmentData).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }) as never,
    );

    const { result } = renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.isNotFound).toBe(false);
    expect(useEnrolOldStudentStore.getState().formState.studentInfo).toBeUndefined();

    resolveFetch(FIXTURE);
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isNotFound).toBe(false);
  });

  it("reports isNotFound when the fetch resolves to null (no application owned by this user)", async () => {
    vi.mocked(getReEnrollmentData).mockResolvedValue(null as never);

    const { result } = renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => expect(result.current.isNotFound).toBe(true));

    // Nothing to seed — the store must stay untouched.
    expect(useEnrolOldStudentStore.getState().formState.studentInfo).toBeUndefined();
  });

  it("seeds every empty slice once the fetch succeeds", async () => {
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      const { formState } = useEnrolOldStudentStore.getState();
      expect(formState.studentInfo).toEqual(FIXTURE.studentInfo);
      expect(formState.familyInfo).toEqual(FIXTURE.familyInfo);
      expect(formState.uploadRequirements?.studentUploadRequirements).toEqual(FIXTURE.studentUploadRequirements);
      expect(formState.uploadRequirements?.parentGuardianUploadRequirements).toEqual(
        FIXTURE.parentGuardianUploadRequirements,
      );
      // FIXTURE.levelApplied is the student's *current* level ("Primary One") — the seeded
      // value must be the next grade level in the progression, not that same value.
      expect(formState.enrollmentInfo?.levelApplied).toEqual("Primary Two");
    });
  });

  it("seeds an empty levelApplied when the current level has no mapped next grade", async () => {
    vi.mocked(getReEnrollmentData).mockResolvedValue({ ...FIXTURE, levelApplied: "Unmapped Legacy Level" } as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      const { formState } = useEnrolOldStudentStore.getState();
      // No progression entry → getNextGradeLevels returns [] → the seed falls back to "" so
      // the enrollment-information step forces an explicit choice instead of a stale level.
      expect(formState.enrollmentInfo?.levelApplied).toEqual("");
    });
  });

  it("does not clobber an already-saved levelApplied, but still seeds its siblings", async () => {
    seedStore({
      enrollmentInfo: { levelApplied: "HFSE Global Education Programme - Primary 2", classType: "Enrichment Class" },
    });
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      const { formState } = useEnrolOldStudentStore.getState();
      expect(formState.studentInfo).toEqual(FIXTURE.studentInfo);
    });

    expect(useEnrolOldStudentStore.getState().formState.enrollmentInfo).toEqual({
      levelApplied: "HFSE Global Education Programme - Primary 2",
      classType: "Enrichment Class",
    });
  });

  it("does not clobber a slice the user already saved locally, but still seeds the others", async () => {
    seedStore({
      studentInfo: { studentDetails: { firstName: "LocalEdit", isValid: true } },
    });
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      const { formState } = useEnrolOldStudentStore.getState();
      expect(formState.familyInfo).toEqual(FIXTURE.familyInfo);
    });

    expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual({
      studentDetails: { firstName: "LocalEdit", isValid: true },
    });
  });

  it("preserves an already-populated upload-requirements sub-slice while seeding its sibling", async () => {
    seedStore({
      uploadRequirements: {
        studentUploadRequirements: { birthCert: "already-saved-url", isValid: true },
      },
    });
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      const { formState } = useEnrolOldStudentStore.getState();
      expect(formState.uploadRequirements?.parentGuardianUploadRequirements).toEqual(
        FIXTURE.parentGuardianUploadRequirements,
      );
    });

    expect(useEnrolOldStudentStore.getState().formState.uploadRequirements?.studentUploadRequirements).toEqual({
      birthCert: "already-saved-url",
      isValid: true,
    });
  });

  it("preserves an already-populated parentGuardianUploadRequirements while seeding its sibling", async () => {
    seedStore({
      uploadRequirements: {
        parentGuardianUploadRequirements: { motherPassport: "already-saved-url", isValid: true },
      },
    });
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      const { formState } = useEnrolOldStudentStore.getState();
      expect(formState.uploadRequirements?.studentUploadRequirements).toEqual(FIXTURE.studentUploadRequirements);
    });

    expect(useEnrolOldStudentStore.getState().formState.uploadRequirements?.parentGuardianUploadRequirements).toEqual(
      { motherPassport: "already-saved-url", isValid: true },
    );
  });

  it("does not write to the store at all when every slice is already populated", async () => {
    const fullyPopulatedFormState = {
      studentInfo: { studentDetails: { firstName: "LocalEdit", isValid: true } },
      familyInfo: { motherInfo: { motherFirstName: "LocalMother" } },
      enrollmentInfo: { levelApplied: "Primary Two" },
      uploadRequirements: {
        studentUploadRequirements: { birthCert: "already-saved-url", isValid: true },
        parentGuardianUploadRequirements: { motherPassport: "already-saved-url", isValid: true },
      },
    };
    seedStore(fullyPopulatedFormState);
    const setFormStateSpy = vi.spyOn(useEnrolOldStudentStore.getState(), "setFormState");
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    const { result } = renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    // Give the seeding effect a tick to (not) run after the query resolves.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(setFormStateSpy).not.toHaveBeenCalled();
    expect(useEnrolOldStudentStore.getState().formState).toEqual(fullyPopulatedFormState);
  });

  it("does not fetch and reports isPending/isNotFound false when enroleeNumber is undefined", () => {
    const { result } = renderHook(() => useHydrateReEnrollment(undefined), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isNotFound).toBe(false);
    expect(getReEnrollmentData).not.toHaveBeenCalled();
  });

  it("stamps the store's enroleeNumber after seeding a fresh draft", async () => {
    vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

    renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

    await waitFor(() => {
      expect(useEnrolOldStudentStore.getState().enroleeNumber).toBe("E260050");
    });
  });

  describe("draft reconciliation (localStorage persistence means a stale draft can outlive its tab)", () => {
    it("discards a draft left over from a different enrolee before seeding, instead of showing their data", async () => {
      // Simulates: the parent previously edited (and saved-per-tab) student E999999's
      // re-enrollment in this browser, then — without exiting — opened E260050's link.
      seedStore({ studentInfo: { studentDetails: { firstName: "StaleOtherStudent" } } });
      seedDraftMeta({ enroleeNumber: "E999999" });
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        const { formState, enroleeNumber } = useEnrolOldStudentStore.getState();
        // Re-seeded from the server for the *current* enrolee, not left as E999999's stale data.
        expect(formState.studentInfo).toEqual(FIXTURE.studentInfo);
        expect(enroleeNumber).toBe("E260050");
      });
    });

    it("keeps a saved draft for the same enrolee (does not treat it as stale)", async () => {
      seedStore({ studentInfo: { studentDetails: { firstName: "LocalEdit", isValid: true } } });
      seedDraftMeta({ enroleeNumber: "E260050", expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString() });
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.familyInfo).toEqual(FIXTURE.familyInfo);
      });

      // The parent's saved edit survives — this is the fix: it must NOT revert to the server
      // original just because the page was reopened.
      expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual({
        studentDetails: { firstName: "LocalEdit", isValid: true },
      });
    });

    it("discards an expired draft (past the 30-day window) and reseeds from the server", async () => {
      seedStore({ studentInfo: { studentDetails: { firstName: "AncientEdit" } } });
      seedDraftMeta({
        enroleeNumber: "E260050",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour in the past
      });
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual(FIXTURE.studentInfo);
      });
    });

    it("does not discard a draft with no recorded expiresAt (pre-fix / freshly seeded drafts)", async () => {
      seedStore({ studentInfo: { studentDetails: { firstName: "LocalEdit", isValid: true } } });
      seedDraftMeta({ enroleeNumber: "E260050" });
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.familyInfo).toEqual(FIXTURE.familyInfo);
      });

      expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual({
        studentDetails: { firstName: "LocalEdit", isValid: true },
      });
    });
  });

  describe("remote-draft fallback (Phase 2: cache cleared / new device / in-app browser lost the local draft)", () => {
    const REMOTE_DRAFT = {
      state: {
        enroleeNumber: "E260050",
        academicYear: "2026-2027",
        formState: { studentInfo: { studentDetails: { firstName: "RemoteEdit", isValid: true } } },
        createdAt: "2026-07-01T00:00:00.000Z",
        lastSavedAt: "2026-07-10T00:00:00.000Z",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      },
    };

    it("adopts a valid remote draft when there is no local one, instead of falling straight to server data", async () => {
      vi.mocked(loadReenrolDraftRemote).mockResolvedValue(REMOTE_DRAFT);
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.familyInfo).toEqual(FIXTURE.familyInfo);
      });

      // The remote draft's edit survives — not the server original.
      expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual(
        REMOTE_DRAFT.state.formState.studentInfo,
      );
      expect(useEnrolOldStudentStore.getState().enroleeNumber).toBe("E260050");
    });

    it("prefers a valid local draft over a remote one (local is always at least as fresh, see the hook's doc comment)", async () => {
      seedStore({ studentInfo: { studentDetails: { firstName: "LocalEdit", isValid: true } } });
      seedDraftMeta({ enroleeNumber: "E260050", expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString() });
      vi.mocked(loadReenrolDraftRemote).mockResolvedValue(REMOTE_DRAFT);
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.familyInfo).toEqual(FIXTURE.familyInfo);
      });

      expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual({
        studentDetails: { firstName: "LocalEdit", isValid: true },
      });
    });

    it("ignores an expired remote draft and falls back to server data", async () => {
      vi.mocked(loadReenrolDraftRemote).mockResolvedValue({
        state: { ...REMOTE_DRAFT.state, expiresAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      });
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual(FIXTURE.studentInfo);
      });
    });

    it("adopts the remote draft after a different-enrolee local draft is discarded", async () => {
      seedStore({ studentInfo: { studentDetails: { firstName: "StaleOtherStudent" } } });
      seedDraftMeta({ enroleeNumber: "E999999" });
      vi.mocked(loadReenrolDraftRemote).mockResolvedValue(REMOTE_DRAFT);
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual(
          REMOTE_DRAFT.state.formState.studentInfo,
        );
      });
      expect(useEnrolOldStudentStore.getState().enroleeNumber).toBe("E260050");
    });

    it("falls back to server data when there is neither a local nor a remote draft", async () => {
      vi.mocked(loadReenrolDraftRemote).mockResolvedValue(null);
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual(FIXTURE.studentInfo);
      });
    });

    it("waits for the remote-draft lookup to resolve before seeding, so a slow request can't lose to server data", async () => {
      let resolveRemoteDraft!: (value: unknown) => void;
      vi.mocked(loadReenrolDraftRemote).mockReturnValue(
        new Promise((resolve) => {
          resolveRemoteDraft = resolve;
        }) as never,
      );
      vi.mocked(getReEnrollmentData).mockResolvedValue(FIXTURE as never);

      renderHook(() => useHydrateReEnrollment("E260050"), { wrapper });

      // The server query has already resolved, but the store must stay untouched until the
      // remote-draft query resolves too.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(useEnrolOldStudentStore.getState().formState.studentInfo).toBeUndefined();

      resolveRemoteDraft(REMOTE_DRAFT);

      await waitFor(() => {
        expect(useEnrolOldStudentStore.getState().formState.studentInfo).toEqual(
          REMOTE_DRAFT.state.formState.studentInfo,
        );
      });
    });
  });
});
