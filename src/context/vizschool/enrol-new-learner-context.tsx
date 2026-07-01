import {
  EnrolNewStudentTabStateStore,
  useEnrolNewStudentTabStateStore,
  useVizSchoolEnrolNewStudentStore,
  VizSchoolEnrolNewStudentStore,
} from "@/zustand-store";
import { createContext, ReactNode, useContext, useEffect } from "react";

type EnrolNewLearnerContextProps = VizSchoolEnrolNewStudentStore & EnrolNewStudentTabStateStore;

const EnrolNewLearnerContext = createContext<EnrolNewLearnerContextProps | null>(null);

export function useEnrolNewLearnerContext() {
  const context = useContext(EnrolNewLearnerContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

function EnrolNewLearnerContextProvider({ children }: { children: ReactNode }) {
  const currentTab = useEnrolNewStudentTabStateStore((state) => state.currentTab);
  const activeTab = useEnrolNewStudentTabStateStore((state) => state.activeTab);
  const completedTabs = useEnrolNewStudentTabStateStore((state) => state.completedTabs);
  const setCompletedTabs = useEnrolNewStudentTabStateStore((state) => state.setCompletedTabs);
  const setCurrentTab = useEnrolNewStudentTabStateStore((state) => state.setCurrentTab);
  const setActiveTab = useEnrolNewStudentTabStateStore((state) => state.setActiveTab);
  const enrolNewLearnerFormState = useVizSchoolEnrolNewStudentStore((state) => state.formState);
  const setEnrolNewLearnerFormState = useVizSchoolEnrolNewStudentStore((state) => state.setFormState);
  const clearState = useVizSchoolEnrolNewStudentStore((state) => state.clearState);

  useEffect(() => {
    if (useEnrolNewStudentTabStateStore.getState().currentTab !== "") return;

    setCurrentTab("/vizschool/enrol-student/new/student-info");
    setActiveTab("/vizschool/enrol-student/new/student-info");
  }, []);

  return (
    <EnrolNewLearnerContext.Provider
      value={{
        clearState,
        formState: enrolNewLearnerFormState,
        setFormState: setEnrolNewLearnerFormState,
        completedTabs,
        currentTab,
        activeTab,
        setActiveTab,
        setCompletedTabs,
        setCurrentTab,
      }}>
      {children}
    </EnrolNewLearnerContext.Provider>
  );
}

export default EnrolNewLearnerContextProvider;
