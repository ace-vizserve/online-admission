import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeLocalStorage, safeSessionStorage } from "@/lib/safe-storage";
import {
  EnrolNewStudentFormState,
  EnrolOldStudentFormState,
  OpenHouseFormState,
  VizSchoolEnrolNewStudentFormState,
  VizSchoolEnrolOldStudentFormState,
} from "./types";

export type EnrolNewStudentDraftStore = {
  lastSavedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  draftId: string;
  formState: Partial<EnrolNewStudentFormState | Record<string, unknown>>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
  currentTab: string;
  activeTab: string;
  completedTabs: string[];
  academicYear: string;
  type: "viz-school" | "hfse-is";
  clearState: () => void;
};

type ApplicationDraftsDialogStore = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
};

type AcademicYearStore = {
  academicYear: string;
  setAcademicYear: (academicYear: string) => void;
  clearState: () => void;
};

type OpenHouseInstitutionStore = {
  institution: string;
  setInstitution: (institution: string) => void;
  clearState: () => void;
};

type SchoolFeeStore = {
  schoolFee: string;
  setSchoolFee: (schoolFee: string) => void;
  clearState: () => void;
};

type PassTypeStore = {
  passType: string;
  stpApplicationType: string;
  setStpApplicationType: (state: string) => void;
  setPassType: (state: string) => void;
  clearState: () => void;
};

type PreCourseAcknowledgementStore = {
  preCourseAnswer: "Yes" | "No" | null;
  preCourseDate: Date | undefined;
  setPreCourseAnswer: (state: "Yes" | "No" | null) => void;
  setPreCourseDate: (state: Date | undefined) => void;
  clearState: () => void;
};

type PasswordResetStore = {
  passwordResetState: boolean;
  setPasswordResetState: (state: boolean) => void;
};

export type EnrolNewStudentTabStateStore = {
  currentTab: string;
  activeTab: string;
  completedTabs: string[];
  setActiveTab: (tab: string) => void;
  setCurrentTab: (tab: string) => void;
  setCompletedTabs: (tab: string | string[]) => void;
  clearState: () => void;
};

export type EnrolNewStudentStore = {
  formState: Partial<EnrolNewStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolNewStudentFormState>) => void;
  clearState: () => void;
};

export type OpenHouseStore = {
  formState: Partial<OpenHouseFormState> | Record<string, null>;
  setFormState: (data: Partial<OpenHouseFormState>) => void;
  clearState: () => void;
};

export type EnrolOldStudentStore = {
  formState: Partial<EnrolOldStudentFormState> | Record<string, null>;
  setFormState: (data: Partial<EnrolOldStudentFormState>) => void;
  clearState: () => void;
  // Scopes the persisted draft to one enrolee and lets a returning parent's local edits
  // outlive the tab (see use-hydrate-reenrollment.ts, which stamps enroleeNumber on seed
  // and clears this store when it detects a different enrolee or an expired draft).
  enroleeNumber?: string;
  lastSavedAt?: string;
  expiresAt?: string;
  setEnroleeNumber: (enroleeNumber: string) => void;
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
      clearState: () => {
        set(store.getInitialState());
      },
      currentTab: "",
      activeTab: "",
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
      setCompletedTabs: (tab: string | string[]) =>
        set((state) => {
          const nextTabs = Array.isArray(tab) ? [...state.completedTabs, ...tab] : [...state.completedTabs, tab];

          return {
            ...state,
            completedTabs: Array.from(new Set(nextTabs)),
          };
        }),
    }),
    {
      name: "enrolNewStudentTabState",
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

export const useApplicationDraftsDialogStore = create<ApplicationDraftsDialogStore>()((set) => ({
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
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

export const useOpenHouseStore = create<OpenHouseStore>()(
  persist(
    (set, _, store) => ({
      formState: {},
      clearState: () => {
        set(store.getInitialState());
      },
      setFormState: (data: Partial<OpenHouseFormState>) =>
        set((state) => ({
          formState: {
            ...state.formState,
            ...data,
          },
        })),
    }),
    {
      name: "openHouseFormState",
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

type OpenHouseCredentialsStore = {
  password: string;
  confirmPassword: string;
  setCredentials: (password: string, confirmPassword: string) => void;
  clearState: () => void;
};

// Deliberately NOT persisted (no `persist` middleware) — the account registration password must
// never be written to sessionStorage in plaintext. Lives only in memory for the current page
// session; a reload requires the user to re-enter it, which is the correct trade-off.
export const useOpenHouseCredentialsStore = create<OpenHouseCredentialsStore>()((set) => ({
  password: "",
  confirmPassword: "",
  setCredentials: (password, confirmPassword) => set({ password, confirmPassword }),
  clearState: () => set({ password: "", confirmPassword: "" }),
}));

export const useEnrolNewStudentStore = create<EnrolNewStudentStore>()(
  persist(
    (set, _, store) => ({
      createdAt: new Date(),
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
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

// Kept in sync by hand with DRAFT_EXPIRY_DAYS (src/lib/draft-storage.ts) — not imported
// directly, since that module imports EnrolNewStudentDraftStore from this file and importing
// back would create a cycle.
const REENROL_DRAFT_EXPIRY_DAYS = 30;

export const useEnrolOldStudentStore = create<EnrolOldStudentStore>()(
  persist(
    (set, _, store) => ({
      formState: {},
      enroleeNumber: undefined,
      lastSavedAt: undefined,
      expiresAt: undefined,
      clearState: () => {
        set(store.getInitialState());
      },
      setFormState: (data: Partial<EnrolOldStudentFormState>) =>
        set((state) => ({
          formState: {
            ...state.formState,
            ...data,
          },
          lastSavedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + REENROL_DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        })),
      setEnroleeNumber: (enroleeNumber: string) => set({ enroleeNumber }),
    }),
    {
      // Renamed from "enrolOldStudentFormState": that key lived in sessionStorage and is
      // intentionally abandoned rather than migrated, so a stale sessionStorage entry never
      // gets read as if it were a durable draft.
      name: "enrolOldStudentDraft",
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);

export const useVizSchoolEnrolNewStudentStore = create<VizSchoolEnrolNewStudentStore>()(
  persist(
    (set, _, store) => ({
      createdAt: new Date(),
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
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
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
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
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
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

export const useSelectOpenHouseInstitution = create<OpenHouseInstitutionStore>()(
  persist(
    (set, _, store) => ({
      institution: "",
      clearState: () => {
        set(store.getInitialState());
      },
      setInstitution: (institution: string) => set({ institution }),
    }),
    {
      name: "openHouseInstitution",
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
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
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

export const usePassTypeStore = create<PassTypeStore>()(
  persist(
    (set, _, store) => ({
      passType: "",
      stpApplicationType: "",
      setPassType: (passType: string) => set({ passType }),
      setStpApplicationType: (stpApplicationType: string) => set({ stpApplicationType }),
      clearState: () => {
        set(store.getInitialState());
      },
    }),
    {
      name: "pass-type",
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

export const usePreCourseAcknowledgementStore = create<PreCourseAcknowledgementStore>()(
  persist(
    (set, _, store) => ({
      preCourseAnswer: null,
      preCourseDate: undefined,
      setPreCourseAnswer: (preCourseAnswer) => set({ preCourseAnswer }),
      setPreCourseDate: (preCourseDate) => set({ preCourseDate }),
      clearState: () => {
        set(store.getInitialState());
      },
    }),
    {
      name: "pre-course-acknowledgement",
      storage: createJSONStorage(() => safeSessionStorage),
    },
  ),
);

export const createNewStudentDraftStore = (type: "viz-school" | "hfse-is", draftId: string) =>
  create<EnrolNewStudentDraftStore>()(
    persist(
      (set, _, store) => ({
        type,
        academicYear: "",
        draftId: draftId,
        lastSavedAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activeTab: "",
        completedTabs: [],
        currentTab: "",
        formState: {},
        clearState: () => {
          set(store.getInitialState());
        },
        setFormState: (data: Partial<EnrolNewStudentFormState>) =>
          set((state) => ({
            formState: { ...state.formState, ...data },
          })),
      }),
      {
        name:
          type == "hfse-is"
            ? `enrolNewStudent:draft:${draftId}:hfse-is`
            : `enrolNewStudent:draft:${draftId}:viz-school`,
        storage: createJSONStorage(() => safeLocalStorage),
      },
    ),
  );
