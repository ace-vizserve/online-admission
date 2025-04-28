import { EnrolOldStudentStore, useEnrolOldStudentStore } from "@/zustand-store";
import { createContext, ReactNode, useContext } from "react";

type EnrolOldStudentContextProps = EnrolOldStudentStore;

const EnrolOldStudentContext = createContext<EnrolOldStudentContextProps | null>(null);

export function useEnrolOldStudentContext() {
  const context = useContext(EnrolOldStudentContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

function EnrolOldStudentContextProvider({ children }: { children: ReactNode }) {
  const enrolOldStudentFormState = useEnrolOldStudentStore((state) => state.formState);
  const setEnrolOldStudentFormState = useEnrolOldStudentStore((state) => state.setFormState);

  return (
    <EnrolOldStudentContext.Provider
      value={{ formState: enrolOldStudentFormState, setFormState: setEnrolOldStudentFormState }}>
      {children}
    </EnrolOldStudentContext.Provider>
  );
}

export default EnrolOldStudentContextProvider;
