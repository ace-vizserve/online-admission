import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EnrolNewStudentFormState } from "./types";

export type EnrolNewStudentStore = {
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
};

export const useEnrolNewStudentStore = create<EnrolNewStudentStore>()(
  persist(
    (set) => ({
      formState: {},
      setFormState: (data: Partial<EnrolNewStudentFormState>) =>
        set((state) => ({
          formState: {
            ...state.formState,
            ...data,
          },
        })),
    }),
    {
      name: "enrolNewStudentFormState",
    }
  )
);
