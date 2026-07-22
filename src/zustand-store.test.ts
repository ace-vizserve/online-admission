/**
 * Coverage for useEnrolOldStudentStore's durability fix: the re-enrollment draft used to live
 * in sessionStorage only (gone the moment the tab closed — the root cause of a parent losing
 * saved medical/allergy edits). It now persists to localStorage and stamps enough metadata
 * (enroleeNumber, lastSavedAt, expiresAt) for use-hydrate-reenrollment.ts to reconcile a
 * returning draft against the current enrolee and a 30-day expiry.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useEnrolOldStudentStore } from "./zustand-store";

const STORAGE_KEY = "enrolOldStudentDraft";

beforeEach(() => {
  useEnrolOldStudentStore.getState().clearState();
});

// Mirrors use-hydrate-reenrollment.test.tsx's `seedStore` — a loosely-typed call into
// setFormState, since these tests only care about a couple of fields and don't want to
// construct a fully valid EnrolOldStudentFormState for every case.
function setFormState(formState: Record<string, unknown>) {
  const setFormStateLoose = useEnrolOldStudentStore.getState().setFormState as (data: Record<string, unknown>) => void;
  setFormStateLoose(formState);
}

describe("useEnrolOldStudentStore", () => {
  it("persists under the new localStorage key, not the old sessionStorage one", () => {
    setFormState({ studentInfo: { studentDetails: { firstName: "Juan" } } });

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(sessionStorage.getItem("enrolOldStudentFormState")).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("starts with no enroleeNumber/lastSavedAt/expiresAt", () => {
    const state = useEnrolOldStudentStore.getState();

    expect(state.enroleeNumber).toBeUndefined();
    expect(state.lastSavedAt).toBeUndefined();
    expect(state.expiresAt).toBeUndefined();
  });

  it("setFormState stamps lastSavedAt and a ~30-day expiresAt", () => {
    const before = Date.now();

    setFormState({ studentInfo: { studentDetails: { firstName: "Juan" } } });

    const { lastSavedAt, expiresAt } = useEnrolOldStudentStore.getState();
    expect(lastSavedAt).toBeDefined();
    expect(expiresAt).toBeDefined();

    const lastSavedMs = new Date(lastSavedAt!).getTime();
    const expiresMs = new Date(expiresAt!).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    expect(lastSavedMs).toBeGreaterThanOrEqual(before);
    // Allow a little slack for test execution time instead of asserting exact equality.
    expect(expiresMs - lastSavedMs).toBeGreaterThan(thirtyDaysMs - 1000);
    expect(expiresMs - lastSavedMs).toBeLessThan(thirtyDaysMs + 1000);
  });

  it("setFormState merges into formState rather than replacing it", () => {
    setFormState({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    setFormState({ familyInfo: { motherInfo: { motherFirstName: "Maria" } } });

    const { formState } = useEnrolOldStudentStore.getState();
    expect(formState.studentInfo).toEqual({ studentDetails: { firstName: "Juan" } });
    expect(formState.familyInfo).toEqual({ motherInfo: { motherFirstName: "Maria" } });
  });

  it("setEnroleeNumber stamps the enrolee this draft belongs to, independent of setFormState", () => {
    useEnrolOldStudentStore.getState().setEnroleeNumber("E260050");

    expect(useEnrolOldStudentStore.getState().enroleeNumber).toBe("E260050");
    expect(useEnrolOldStudentStore.getState().formState).toEqual({});
  });

  it("clearState resets formState, enroleeNumber, lastSavedAt, and expiresAt together", () => {
    setFormState({ studentInfo: { studentDetails: { firstName: "Juan" } } });
    useEnrolOldStudentStore.getState().setEnroleeNumber("E260050");

    useEnrolOldStudentStore.getState().clearState();

    const state = useEnrolOldStudentStore.getState();
    expect(state.formState).toEqual({});
    expect(state.enroleeNumber).toBeUndefined();
    expect(state.lastSavedAt).toBeUndefined();
    expect(state.expiresAt).toBeUndefined();
  });
});
