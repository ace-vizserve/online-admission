import {
  EnrolNewStudentTabStateStore,
  OpenHouseStore,
  useEnrolNewStudentTabStateStore,
  useOpenHouseStore,
} from "@/zustand-store";
import { createContext, ReactNode, useContext, useEffect } from "react";

type OpenHouseContextProps = OpenHouseStore & EnrolNewStudentTabStateStore;

const OpenHouseContext = createContext<OpenHouseContextProps | null>(null);

export function useOpenHouseContext() {
  const context = useContext(OpenHouseContext);

  if (!context) {
    throw new Error("Must be inside the context provider!");
  }

  return context;
}

function OpenHouseContextProvider({ children }: { children: ReactNode }) {
  const currentTab = useEnrolNewStudentTabStateStore((state) => state.currentTab);
  const activeTab = useEnrolNewStudentTabStateStore((state) => state.activeTab);
  const completedTabs = useEnrolNewStudentTabStateStore((state) => state.completedTabs);
  const setCompletedTabs = useEnrolNewStudentTabStateStore((state) => state.setCompletedTabs);
  const setCurrentTab = useEnrolNewStudentTabStateStore((state) => state.setCurrentTab);
  const setActiveTab = useEnrolNewStudentTabStateStore((state) => state.setActiveTab);
  const OpenHouseFormState = useOpenHouseStore((state) => state.formState);
  const setOpenHouseFormState = useOpenHouseStore((state) => state.setFormState);
  const clearState = useOpenHouseStore((state) => state.clearState);

  useEffect(() => {
    if (useEnrolNewStudentTabStateStore.getState().currentTab !== "") return;

    setCurrentTab("/open-house/account-info");
    setActiveTab("/open-house/account-info");
  }, []);

  return (
    <OpenHouseContext.Provider
      value={{
        clearState,
        formState: OpenHouseFormState,
        setFormState: setOpenHouseFormState,
        completedTabs,
        currentTab,
        activeTab,
        setActiveTab,
        setCompletedTabs,
        setCurrentTab,
      }}>
      {children}
    </OpenHouseContext.Provider>
  );
}

export default OpenHouseContextProvider;
