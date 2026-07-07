import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEnrolOldStudentStore } from "@/zustand-store";

vi.mock("@/actions/get-reenrollment-data", () => ({
  getReEnrollmentData: vi.fn(),
}));

const { useHydrateReEnrollment } = await import("./use-hydrate-reenrollment");
const { getReEnrollmentData } = await import("@/actions/get-reenrollment-data");

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

beforeEach(() => {
  useEnrolOldStudentStore.getState().clearState();
  vi.clearAllMocks();
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
});
