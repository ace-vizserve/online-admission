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
  const completedTabs = useEnrolNewStudentTabStateStore((state) => state.completedTabs);
  const setCompletedTabs = useEnrolNewStudentTabStateStore((state) => state.setCompletedTabs);
  const setCurrentTab = useEnrolNewStudentTabStateStore((state) => state.setCurrentTab);
  const enrolNewStudentFormState = useEnrolNewStudentStore((state) => state.formState);
  const setEnrolNewStudentFormState = useEnrolNewStudentStore((state) => state.setFormState);

  useEffect(() => {
    if (currentTab != "") return;

    setCurrentTab("/enrol-student/new/student-info");
  }, [currentTab, setCurrentTab]);

  return (
    <EnrolNewStudentContext.Provider
      value={{
        formState: enrolNewStudentFormState,
        setFormState: setEnrolNewStudentFormState,
        completedTabs,
        currentTab,
        setCompletedTabs,
        setCurrentTab,
      }}>
      {children}
    </EnrolNewStudentContext.Provider>
  );
}

export default EnrolNewStudentContextProvider;
