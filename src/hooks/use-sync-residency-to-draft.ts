import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { usePassTypeStore } from "@/zustand-store";
import { useEffect } from "react";

/**
 * The residency choice (`usePassTypeStore`) lives in sessionStorage, so it is gone in a new tab,
 * after "Save & exit", or when a draft is resumed from the dashboard — which skips the residency
 * page. With an empty pass on file, every non-STP pass upload failed the pass-type mismatch check.
 *
 * This mirrors the choice into the draft's form state (which is saved and resumed) and restores
 * it from there whenever the session store is empty. A choice in the store always wins, since it
 * is the one the parent made most recently.
 */
export function useSyncResidencyToDraft() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const passType = usePassTypeStore((state) => state.passType);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const setPassType = usePassTypeStore((state) => state.setPassType);
  const setStpApplicationType = usePassTypeStore((state) => state.setStpApplicationType);

  const draftPassType = formState.passType ?? "";
  const draftStpApplicationType = formState.stpApplicationType ?? "";

  useEffect(() => {
    if (passType || stpApplicationType) {
      if (passType !== draftPassType || stpApplicationType !== draftStpApplicationType) {
        setFormState({ passType, stpApplicationType });
      }
      return;
    }

    if (draftPassType || draftStpApplicationType) {
      setPassType(draftPassType);
      setStpApplicationType(draftStpApplicationType);
    }
  }, [
    passType,
    stpApplicationType,
    draftPassType,
    draftStpApplicationType,
    setFormState,
    setPassType,
    setStpApplicationType,
  ]);
}
