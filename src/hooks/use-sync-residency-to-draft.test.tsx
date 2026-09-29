import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import EnrolNewStudentContextProvider from "@/context/enrol-new-student-context";
import { resetEnrolmentStores } from "@/test/render-form";
import { useEnrolNewStudentStore, usePassTypeStore } from "@/zustand-store";

import { useSyncResidencyToDraft } from "./use-sync-residency-to-draft";

const wrapper = ({ children }: { children: ReactNode }) => (
  <EnrolNewStudentContextProvider>{children}</EnrolNewStudentContextProvider>
);

const draft = () => useEnrolNewStudentStore.getState().formState;
const pass = () => usePassTypeStore.getState();

beforeEach(() => {
  resetEnrolmentStores();
});

describe("useSyncResidencyToDraft", () => {
  it("writes the residency choice into the draft so it is saved with it", () => {
    usePassTypeStore.getState().setPassType("Dependent Pass");
    renderHook(useSyncResidencyToDraft, { wrapper });

    expect(draft()).toMatchObject({ passType: "Dependent Pass", stpApplicationType: "" });
  });

  it("restores the choice from a resumed draft when the session store is empty (new tab)", () => {
    renderHook(useSyncResidencyToDraft, { wrapper });

    act(() => useEnrolNewStudentStore.getState().setFormState({ passType: "Dependent Pass", stpApplicationType: "" }));

    expect(pass()).toMatchObject({ passType: "Dependent Pass", stpApplicationType: "" });
  });

  it("restores an STP application type from the draft", () => {
    useEnrolNewStudentStore.getState().setFormState({ stpApplicationType: "New Student Pass Application" });
    renderHook(useSyncResidencyToDraft, { wrapper });

    expect(pass()).toMatchObject({ passType: "", stpApplicationType: "New Student Pass Application" });
  });

  it("a choice in the session store wins over a stale one in the draft", () => {
    useEnrolNewStudentStore.getState().setFormState({ passType: "Student Pass" });
    renderHook(useSyncResidencyToDraft, { wrapper });

    act(() => usePassTypeStore.getState().setPassType("Dependent Pass"));

    expect(draft().passType).toBe("Dependent Pass");
    expect(pass().passType).toBe("Dependent Pass");
  });

  it("does nothing when neither side has a choice", () => {
    renderHook(useSyncResidencyToDraft, { wrapper });

    expect(draft().passType).toBeUndefined();
    expect(pass()).toMatchObject({ passType: "", stpApplicationType: "" });
  });

  it("does not rewrite the draft when it already matches", () => {
    useEnrolNewStudentStore.getState().setFormState({ passType: "Singaporean", stpApplicationType: "" });
    usePassTypeStore.getState().setPassType("Singaporean");
    const before = draft();

    renderHook(useSyncResidencyToDraft, { wrapper });

    expect(draft()).toBe(before);
  });
});
