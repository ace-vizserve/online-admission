import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  EnrolNewStudentFormState,
  EnrolOldStudentFormState,
  VizSchoolEnrolNewStudentFormState,
  VizSchoolEnrolOldStudentFormState,
} from "./types";

export type SecuritySettingsSheetStore = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
};

export type AcademicYearStore = {
  academicYear: string;
  setAcademicYear: (academicYear: string) => void;
  clearState: () => void;
};

export type SchoolFeeStore = {
  schoolFee: string;
  setSchoolFee: (schoolFee: string) => void;
  clearState: () => void;
};

export type PasswordResetStore = {
  passwordResetState: boolean;
  setPasswordResetState: (state: boolean) => void;
};

export type EnrolNewStudentTabStateStore = {
  currentTab: string;
  activeTab: string;
  completedTabs: string[];
  setActiveTab: (tab: string) => void;
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

export type VizSchoolEnrolNewStudentStore = {
  formState: Partial<VizSchoolEnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<VizSchoolEnrolNewStudentFormState>) => void;
  clearState: () => void;
};

export type VizSchoolEnrolOldStudentStore = {
  formState: Partial<VizSchoolEnrolOldStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<VizSchoolEnrolOldStudentFormState>) => void;
  clearState: () => void;
};

export const useEnrolNewStudentTabStateStore = create<EnrolNewStudentTabStateStore>()(
  persist(
    (set, _, store) => ({
      currentTab: "",
      activeTab: "",
      clearState: () => {
        set(store.getInitialState());
      },
      completedTabs: [],
      setActiveTab: (tab: string) =>
        set((state) => ({
          ...state,
          activeTab: tab,
        })),
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
    (set, _, store) => ({
      formState: {},
      clearState: () => {
        set(store.getInitialState());
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
    (set, _, store) => ({
      formState: {},
      clearState: () => {
        set(store.getInitialState());
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

export const useVizSchoolEnrolNewStudentStore = create<VizSchoolEnrolNewStudentStore>()(
  persist(
    (set, _, store) => ({
      formState: {},
      clearState: () => {
        set(store.getInitialState());
      },
      setFormState: (data: Partial<VizSchoolEnrolNewStudentFormState>) =>
        set((state) => ({
          formState: {
            ...state.formState,
            ...data,
          },
        })),
    }),
    {
      name: "vizSchoolEnrolNewStudentFormState",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useVizSchoolEnrolOldStudentStore = create<VizSchoolEnrolOldStudentStore>()(
  persist(
    (set, _, store) => ({
      formState: {},
      clearState: () => {
        set(store.getInitialState());
      },
      setFormState: (data: Partial<VizSchoolEnrolOldStudentFormState>) =>
        set((state) => ({
          formState: {
            ...state.formState,
            ...data,
          },
        })),
    }),
    {
      name: "vizSchoolEnrolOldStudentFormState",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useSelectAcademicYear = create<AcademicYearStore>()(
  persist(
    (set, _, store) => ({
      academicYear: "",
      clearState: () => {
        set(store.getInitialState());
      },
      setAcademicYear: (academicYear: string) => set({ academicYear }),
    }),
    {
      name: "academicYear",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const useSelectSchoolFee = create<SchoolFeeStore>()(
  persist(
    (set, _, store) => ({
      schoolFee: "",
      clearState: () => {
        set(store.getInitialState());
      },
      setSchoolFee: (schoolFee: string) => set({ schoolFee }),
    }),
    {
      name: "schoolFee",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
