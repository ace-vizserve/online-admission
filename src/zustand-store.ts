import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { EnrolNewStudentFormState, EnrolOldStudentFormState } from "./types";

export type SecuritySettingsSheetStore = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
};

export type AcademicYearStore = {
  academicYear: string;
  setAcademicYear: (academicYear: string) => void;
  clearState: () => void;
};

export type PasswordResetStore = {
  passwordResetState: boolean;
  setPasswordResetState: (state: boolean) => void;
};

export type EnrolNewStudentTabStateStore = {
  currentTab: string;
  completedTabs: string[];
  setCurrentTab: (tab: string) => void;
  setCompletedTabs: (tab: string) => void;
  clearState: () => void;
};

export type EnrolNewStudentStore = {
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
  clearState: () => void;
};

export type EnrolOldStudentStore = {
  formState: Partial<EnrolOldStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolOldStudentFormState>) => void;
  clearState: () => void;
};

export const useEnrolNewStudentTabStateStore = create<EnrolNewStudentTabStateStore>()(
  persist(
    (set) => ({
      currentTab: "",
      clearState: () => {
        set({ currentTab: "", completedTabs: [] });
      },
      completedTabs: [],
      setCurrentTab: (tab: string) =>
        set((state) => ({
          ...state,
          currentTab: tab,
        })),
      setCompletedTabs: (tab: string) =>
        set((state) => ({
          ...state,
          completedTabs: [...state.completedTabs, tab],
        })),
    }),
    {
      name: "enrolNewStudentTabState",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useSecuritySettingsSheetStore = create<SecuritySettingsSheetStore>()((set) => ({
  isOpen: false,
  setIsOpen: (state) => set(() => ({ isOpen: state })),
}));

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

export const useEnrolNewStudentStore = create<EnrolNewStudentStore>()(
  persist(
    (set) => ({
      formState: {},
      clearState: () => {
        set({ formState: {} });
      },
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

export const useEnrolOldStudentStore = create<EnrolOldStudentStore>()(
  persist(
    (set) => ({
      formState: {},
      clearState: () => {
        set({ formState: {} });
      },
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

export const useSelectAcademicYear = create<AcademicYearStore>()(
  persist(
    (set) => ({
      academicYear: "",
      clearState: () => {
        set({ academicYear: "" });
      },
      setAcademicYear: (academicYear: string) => set({ academicYear }),
    }),
    {
      name: "academicYear",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
