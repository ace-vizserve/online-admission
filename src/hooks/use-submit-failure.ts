import { useCallback, useState } from "react";

import { diagnoseSubmitFailure, type SubmitFailure } from "@/lib/submit-failure";

/**
 * Holds the "your application was not submitted" state for one submit flow.
 *
 * Kept as page state rather than a toast on purpose. A failed submit is terminal and
 * high-stakes: the parent has just finished a long form and is about to walk away believing
 * they're done. A toast auto-dismisses after a few seconds and leaves nothing on screen, so a
 * parent who looked away has no way to find out it failed - which is exactly how an unsubmitted
 * application gets reported to the school as a submitted one.
 */
export function useSubmitFailure() {
  const [failure, setFailure] = useState<SubmitFailure | null>(null);

  const reportFailure = useCallback(async (error: unknown) => {
    setFailure(await diagnoseSubmitFailure(error));
  }, []);

  const dismissFailure = useCallback(() => setFailure(null), []);

  return { failure, reportFailure, dismissFailure };
}
