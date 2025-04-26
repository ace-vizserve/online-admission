import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EnrolNewStudentFormState, EnrolOldStudentFormState } from "./types";

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

export type EnrolOldStudentStore = {
  formState: Partial<EnrolOldStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolOldStudentFormState>) => void;
};

export const useEnrolOldStudentStore = create<EnrolOldStudentStore>()((set) => ({
  formState: {},
  setFormState: (data: Partial<EnrolOldStudentFormState>) =>
    set((state) => ({
      formState: {
        ...state.formState,
        ...data,
      },
    })),
}));
