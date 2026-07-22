import { EnrolOldStudentStore, useEnrolOldStudentStore } from "@/zustand-store";
import { createContext, ReactNode, useContext } from "react";

// Deliberately narrower than the full EnrolOldStudentStore: `enroleeNumber`/`setEnroleeNumber`
// (added for the localStorage draft-reconciliation fix, see use-hydrate-reenrollment.ts) are
// stamped directly on the store by that hook and aren't needed by anything consuming this
// context — form/tab components only ever read/write `formState` or `clearState()`.
type EnrolOldStudentContextProps = Pick<EnrolOldStudentStore, "formState" | "setFormState" | "clearState">;

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
  const clearState = useEnrolOldStudentStore((state) => state.clearState);

  return (
    <EnrolOldStudentContext.Provider
      value={{ clearState, formState: enrolOldStudentFormState, setFormState: setEnrolOldStudentFormState }}>
      {children}
    </EnrolOldStudentContext.Provider>
  );
}

export default EnrolOldStudentContextProvider;
