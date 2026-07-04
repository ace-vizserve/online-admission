import { UserSessionContext } from "@/context/user-session-context";
import EnrolNewStudentContextProvider from "@/context/enrol-new-student-context";
import EnrolOldStudentContextProvider from "@/context/enrol-old-student-context";
import OpenHouseContextProvider from "@/context/open-house/open-house-student-context";
import EnrolCurrentLearnerContextProvider from "@/context/vizschool/enrol-current-learner-context";
import EnrolNewLearnerContextProvider from "@/context/vizschool/enrol-new-learner-context";
import {
  useEnrolNewStudentStore,
  useEnrolNewStudentTabStateStore,
  useEnrolOldStudentStore,
  useOpenHouseCredentialsStore,
  useOpenHouseStore,
  usePassTypeStore,
  usePreCourseAcknowledgementStore,
  useSelectAcademicYear,
  useVizSchoolEnrolNewStudentStore,
  useVizSchoolEnrolOldStudentStore,
} from "@/zustand-store";
import { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { MemoryRouter } from "react-router";

/**
 * Reusable component-render harness for mounting real application-form components (form-step
 * panels under src/components/private/**), built once here and shared across every audit
 * phase. No test in this repo previously mounted a real form-step component — every one of
 * these providers is genuinely required for a step component to render without throwing
 * ("Must be inside the context provider!"), since each flow's context is a plain
 * `useContext` that requires its own `<XContextProvider>` ancestor.
 *
 * Each flow's context Provider (src/context/**) is a *default* export (only the paired hook
 * is named-exported), reads directly from its own Zustand store singleton, and takes no
 * props — so tests seed state via the store's own `setState`/`clearState`, then render inside
 * the real provider, rather than faking a context value.
 */

export const FLOW_PROVIDERS = {
  "hfse-new": EnrolNewStudentContextProvider,
  "hfse-old": EnrolOldStudentContextProvider,
  "vizschool-new": EnrolNewLearnerContextProvider,
  "vizschool-current": EnrolCurrentLearnerContextProvider,
  "open-house": OpenHouseContextProvider,
} as const;

export type FlowKey = keyof typeof FLOW_PROVIDERS;

const FLOW_STORES = {
  "hfse-new": useEnrolNewStudentStore,
  "hfse-old": useEnrolOldStudentStore,
  "vizschool-new": useVizSchoolEnrolNewStudentStore,
  "vizschool-current": useVizSchoolEnrolOldStudentStore,
  "open-house": useOpenHouseStore,
} as const;

/**
 * Resets every enrolment store (all 5 flows) + the shared tab-state/passType/academic-year/
 * pre-course stores to their initial state. These are module-level singletons (Zustand), so
 * without this, state seeded/written by one test would leak into the next. Call in
 * `beforeEach`.
 */
export function resetEnrolmentStores() {
  Object.values(FLOW_STORES).forEach((store) => store.getState().clearState());
  useEnrolNewStudentTabStateStore.getState().clearState();
  usePassTypeStore.getState().clearState();
  useSelectAcademicYear.getState().clearState();
  usePreCourseAcknowledgementStore.getState().clearState();
  useOpenHouseCredentialsStore.getState().clearState();
}

/**
 * Seeds a flow's Zustand store with initial `formState` before rendering — a direct
 * `setState` (full replace), not the store's own `setFormState` action (which shallow-merges
 * and is what the component under test will call as the user interacts).
 */
export function seedFormState(flow: FlowKey, formState: Record<string, unknown>) {
  // The union of all 5 stores' `setState` overloads doesn't collapse to a single callable
  // signature under TS — each store's `formState` is a distinct FormState type. This helper's
  // whole job is to accept a loosely-typed formState for any flow, so the cast is intentional.
  const setState = FLOW_STORES[flow].setState as (partial: { formState: Record<string, unknown> }) => void;
  setState({ formState });
}

/**
 * Renders a real form-step component wrapped in everything it needs to run: MemoryRouter
 * (components use `useNavigate`/`useBeforeUnload`/`useParams`), a fresh QueryClientProvider
 * (retries disabled — tests shouldn't wait out real retry backoff), a session context (most
 * step components call `useSession()`; defaults to logged-out), and the flow's real context
 * provider.
 */
export function renderForm(
  ui: ReactElement,
  {
    flow,
    route = "/",
    session = null,
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  }: { flow: FlowKey; route?: string; session?: Session | null; queryClient?: QueryClient },
) {
  const Provider = FLOW_PROVIDERS[flow];

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <UserSessionContext.Provider value={{ session, isLoading: false, passwordResetState: false }}>
          <Provider>{ui}</Provider>
        </UserSessionContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}
