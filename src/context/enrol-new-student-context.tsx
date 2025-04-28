import { EnrolNewStudentStore, useEnrolNewStudentStore } from "@/zustand-store";
import { createContext, ReactNode, useContext } from "react";

type EnrolNewStudentContextProps = EnrolNewStudentStore;

const EnrolNewStudentContext = createContext<EnrolNewStudentContextProps | null>(null);

export function useEnrolNewStudentContext() {
  const context = useContext(EnrolNewStudentContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

function EnrolNewStudentContextProvider({ children }: { children: ReactNode }) {
  const enrolNewStudentFormState = useEnrolNewStudentStore((state) => state.formState);
  const setEnrolNewStudentFormState = useEnrolNewStudentStore((state) => state.setFormState);

  return (
    <EnrolNewStudentContext.Provider
      value={{ formState: enrolNewStudentFormState, setFormState: setEnrolNewStudentFormState }}>
      {children}
    </EnrolNewStudentContext.Provider>
  );
}

export default EnrolNewStudentContextProvider;
