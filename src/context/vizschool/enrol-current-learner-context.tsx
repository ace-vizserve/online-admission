import { useVizSchoolEnrolOldStudentStore, VizSchoolEnrolOldStudentStore } from "@/zustand-store";
import { createContext, ReactNode, useContext } from "react";

type EnrolCurrentLearnerContextProps = VizSchoolEnrolOldStudentStore;

const EnrolCurrentLearnerContext = createContext<EnrolCurrentLearnerContextProps | null>(null);

export function useEnrolCurrentLearnerContext() {
  const context = useContext(EnrolCurrentLearnerContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

function EnrolCurrentLearnerContextProvider({ children }: { children: ReactNode }) {
  const enrolOldStudentFormState = useVizSchoolEnrolOldStudentStore((state) => state.formState);
  const setEnrolOldStudentFormState = useVizSchoolEnrolOldStudentStore((state) => state.setFormState);
  const clearState = useVizSchoolEnrolOldStudentStore((state) => state.clearState);

  return (
    <EnrolCurrentLearnerContext.Provider
      value={{ clearState, formState: enrolOldStudentFormState, setFormState: setEnrolOldStudentFormState }}>
      {children}
    </EnrolCurrentLearnerContext.Provider>
  );
}

export default EnrolCurrentLearnerContextProvider;
