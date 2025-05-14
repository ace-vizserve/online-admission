import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EnrolNewStudentFormState, EnrolOldStudentFormState } from "./types";

export type SecuritySettingsSheetStore = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
};

export const useSecuritySettingsSheetStore = create<SecuritySettingsSheetStore>()((set) => ({
  isOpen: false,
  setIsOpen: (state) => set(() => ({ isOpen: state })),
}));

export type PasswordResetStore = {
  passwordResetState: boolean;
  setPasswordResetState: (state: boolean) => void;
};

export const usePasswordResetStore = create<PasswordResetStore>()(
  persist(
    (set) => ({
      passwordResetState: false,
      setPasswordResetState: (state) => set(() => ({ passwordResetState: state })),
    }),
    {
      name: "password-recovery",
    }
  )
);

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
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export type EnrolOldStudentStore = {
  formState: Partial<EnrolOldStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolOldStudentFormState>) => void;
};

export const useEnrolOldStudentStore = create<EnrolOldStudentStore>()(
  persist(
    (set) => ({
      formState: {},
      setFormState: (data: Partial<EnrolOldStudentFormState>) =>
        set((state) => ({
          formState: {
            ...state.formState,
            ...data,
          },
        })),
    }),
    {
      name: "enrolOldStudentFormState",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
