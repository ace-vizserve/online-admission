import {
  EnrolNewStudentStore,
  EnrolNewStudentTabStateStore,
  useEnrolNewStudentStore,
  useEnrolNewStudentTabStateStore,
} from "@/zustand-store";
import { createContext, ReactNode, useContext, useEffect } from "react";

type EnrolNewStudentContextProps = EnrolNewStudentStore & EnrolNewStudentTabStateStore;

const EnrolNewStudentContext = createContext<EnrolNewStudentContextProps | null>(null);

export function useEnrolNewStudentContext() {
  const context = useContext(EnrolNewStudentContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

function EnrolNewStudentContextProvider({ children }: { children: ReactNode }) {
  const currentTab = useEnrolNewStudentTabStateStore((state) => state.currentTab);
  const activeTab = useEnrolNewStudentTabStateStore((state) => state.activeTab);
  const completedTabs = useEnrolNewStudentTabStateStore((state) => state.completedTabs);
  const setCompletedTabs = useEnrolNewStudentTabStateStore((state) => state.setCompletedTabs);
  const setCurrentTab = useEnrolNewStudentTabStateStore((state) => state.setCurrentTab);
  const setActiveTab = useEnrolNewStudentTabStateStore((state) => state.setActiveTab);
  const enrolNewStudentFormState = useEnrolNewStudentStore((state) => state.formState);
  const setEnrolNewStudentFormState = useEnrolNewStudentStore((state) => state.setFormState);
  const clearState = useEnrolNewStudentStore((state) => state.clearState);

  useEffect(() => {
    // Read live store state — not the render-time closure. AutoResumeDraft (a child
    // component) runs its effect first (React bottom-up), so by the time this fires
    // the store already has the resumed currentTab, if any.
    if (useEnrolNewStudentTabStateStore.getState().currentTab !== "") return;

    setCurrentTab("/enrol-student/new/student-info");
    setActiveTab("/enrol-student/new/student-info");
  }, []);

  return (
    <EnrolNewStudentContext.Provider
      value={{
        clearState,
        formState: enrolNewStudentFormState,
        setFormState: setEnrolNewStudentFormState,
        completedTabs,
        currentTab,
        activeTab,
        setActiveTab,
        setCompletedTabs,
        setCurrentTab,
      }}>
      {children}
    </EnrolNewStudentContext.Provider>
  );
}

export default EnrolNewStudentContextProvider;
