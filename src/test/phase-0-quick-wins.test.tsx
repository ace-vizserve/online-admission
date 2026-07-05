/**
 * Phase 0 regression tests for the form/schema audit ("Audit form ⇄ schema alignment and
 * component state-correctness, phased per tab"). Each block proves one already-diagnosed bug
 * is closed, using the shared render harness (src/test/render-form.tsx) built for this effort
 * — the first tests in the repo to mount a real form-step component end-to-end.
 */
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HfseNewStudentDetails from "@/components/private/enrol-student/steps/student-information/student-details";
import HfseOldStudentDetails from "@/components/private/enrol-student/tabs/student-information/student-details";
import HfseNewFatherInformation from "@/components/private/enrol-student/steps/family-information/father-information";
import HfseOldMotherInformation from "@/components/private/enrol-student/tabs/family-information/mother-information";
import VizSchoolNewStudentDetails from "@/components/private/enrol-student/vizschool/steps/learner-information/student-details";
import VizSchoolCurrentLearnerDetails from "@/components/private/enrol-student/vizschool/tabs/learner-information/learner-details";
import VizSchoolNewFatherInformation from "@/components/private/enrol-student/vizschool/steps/family-information/father-information";
import OpenHouseStudentDetails from "@/components/private/open-house/steps/student-information/student-details";

import { renderForm, resetEnrolmentStores, seedFormState, type FlowKey } from "./render-form";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  resetEnrolmentStores();
});

// ---------------------------------------------------------------------------------------------
// Fix 1 — VizSchool new-learner father form was validated with the wrong (HFSE) schema,
// wrongly requiring fatherNric even though VizSchool's own schema makes it optional.
// ---------------------------------------------------------------------------------------------

describe("VizSchool father-information — validator schema", () => {
  it("does not require fatherNric now that the form uses vizSchoolFatherInformationSchema", async () => {
    seedFormState("vizschool-new", {
      familyInfo: {
        fatherInfo: {
          fatherFirstName: "Jose",
          fatherLastName: "Dela Cruz",
          fatherPreferredName: "Jose",
          fatherBirthDay: new Date("1983-02-01"),
          fatherNationality: "Singaporean",
          fatherReligion: "Catholic",
          fatherMobile: "65222222",
          fatherEmail: "jose@example.com",
          fatherCompanyName: "Acme Pte Ltd",
          fatherPosition: "Engineer",
          // fatherNric intentionally omitted: required by fatherInformationSchema (the wrong,
          // HFSE validator this form used to use), optional in vizSchoolFatherInformationSchema
          // (the correct one).
          noFatherInfo: false,
        },
        motherInfo: { isValid: false },
      },
    });

    const user = userEvent.setup();
    renderForm(<VizSchoolNewFatherInformation />, { flow: "vizschool-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /confirm details/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/NRIC\/FIN is required/i)).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------------------------
// Fix 2 — student-details components (HFSE new/old, VizSchool new/current, Open House) used
// to mutate `formState.studentInfo.studentDetails.religionOther` directly on the live Zustand
// object, bypassing setFormState. A frozen studentDetails object throws under strict mode if
// anything still assigns to it directly — proving the fix routes exclusively through the
// normal debounced setFormState sync instead.
// ---------------------------------------------------------------------------------------------

// Each component's prop signature differs slightly (some take `setTabOpened`, some take
// nothing); this table is deliberately loosely typed since the point of the table is to
// exercise all 5 near-duplicate components with the same test body. The cast is needed because
// TS checks component props contravariantly — a component requiring `{setTabOpened}` can't
// otherwise widen to "accepts any Record".
type FormComponent = ComponentType<Record<string, unknown>>;
const asFormComponent = (Component: ComponentType<never>) => Component as unknown as FormComponent;

const RELIGION_OTHER_CASES: Array<{ name: string; flow: FlowKey; Component: FormComponent; props: Record<string, unknown> }> = [
  { name: "HFSE new student-details", flow: "hfse-new", Component: asFormComponent(HfseNewStudentDetails), props: { setTabOpened: vi.fn() } },
  { name: "HFSE old student-details", flow: "hfse-old", Component: asFormComponent(HfseOldStudentDetails), props: {} },
  { name: "VizSchool new student-details", flow: "vizschool-new", Component: asFormComponent(VizSchoolNewStudentDetails), props: { setTabOpened: vi.fn() } },
  { name: "VizSchool current learner-details", flow: "vizschool-current", Component: asFormComponent(VizSchoolCurrentLearnerDetails), props: {} },
  { name: "Open House student-details", flow: "open-house", Component: asFormComponent(OpenHouseStudentDetails), props: { setTabOpened: vi.fn() } },
];

describe.each(RELIGION_OTHER_CASES)("$name — religion 'Other' toggle", ({ flow, Component, props }) => {
  it("does not mutate the store when switching away from 'Other' religion", async () => {
    const studentDetails = Object.freeze({
      firstName: "Juan",
      lastName: "Dela Cruz",
      preferredName: "Juan",
      gender: "Male",
      primaryLanguage: "English",
      religion: "Other",
      religionOther: "Iglesia ni Cristo",
    });
    seedFormState(flow, { studentInfo: { studentDetails } });

    const user = userEvent.setup();
    renderForm(<Component {...props} />, { flow });

    const religionTrigger = screen.getByRole("combobox", { name: /religion/i });
    await user.click(religionTrigger);
    const catholicOption = await screen.findByRole("option", { name: /catholic/i });

    // The pre-fix code did `formState.studentInfo.studentDetails.religionOther = undefined`
    // here, which would throw a TypeError against the frozen `studentDetails` object above.
    // If this click resolves, no direct mutation happened.
    await user.click(catholicOption);

    // The field's visibility also depends on the *store's* religionOther (not just local
    // state), which only clears once the 150ms debounced sync effect writes it back via
    // setFormState — so this needs to wait, not assert immediately.
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/please specify religion/i)).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------------------------
// Fix 3 — gender RadioGroup used `defaultValue` (uncontrolled) instead of `value={field.value}`,
// so it wouldn't reflect a value applied via form.reset() after mount (e.g. resumed drafts).
// VizSchool new is excluded: it already correctly used `value={field.value}`.
// ---------------------------------------------------------------------------------------------

const RADIO_GROUP_CASES: Array<{ name: string; flow: FlowKey; Component: FormComponent; props: Record<string, unknown> }> = [
  { name: "HFSE new student-details", flow: "hfse-new", Component: asFormComponent(HfseNewStudentDetails), props: { setTabOpened: vi.fn() } },
  { name: "HFSE old student-details", flow: "hfse-old", Component: asFormComponent(HfseOldStudentDetails), props: {} },
  { name: "VizSchool current learner-details", flow: "vizschool-current", Component: asFormComponent(VizSchoolCurrentLearnerDetails), props: {} },
  { name: "Open House student-details", flow: "open-house", Component: asFormComponent(OpenHouseStudentDetails), props: { setTabOpened: vi.fn() } },
];

describe.each(RADIO_GROUP_CASES)("$name — gender RadioGroup is controlled", ({ flow, Component, props }) => {
  it("reflects a store-seeded value on initial render (value, not defaultValue)", () => {
    seedFormState(flow, {
      studentInfo: {
        studentDetails: {
          firstName: "Juan",
          lastName: "Dela Cruz",
          preferredName: "Juan",
          gender: "Female",
          primaryLanguage: "English",
          religion: "Catholic",
        },
      },
    });

    renderForm(<Component {...props} />, { flow });

    expect(screen.getByRole("radio", { name: "Female" })).toHaveAttribute("data-state", "checked");
    expect(screen.getByRole("radio", { name: "Male" })).toHaveAttribute("data-state", "unchecked");
  });
});

// ---------------------------------------------------------------------------------------------
// Fix 4 — father-information (HFSE new + VizSchool new) refetched family info under a cache key
// that included the session email, then read it back under a key that dropped it — so
// getQueryData always returned undefined and blanked the form when re-enabling father info.
// Proven behaviorally: seed the QueryClient under the (correct) email-qualified key, toggle
// "not available" off, and assert the field is actually repopulated from that cached data.
// ---------------------------------------------------------------------------------------------

const PARENT_EMAIL = "parent@example.com";
const MOCK_SESSION = {
  user: { email: PARENT_EMAIL, user_metadata: { relationship: "mother" } },
} as unknown as Session;

describe("father-information — React Query cache key alignment", () => {
  it("HFSE new: re-enabling father info repopulates from data cached under the refetch key", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["new-family-information", PARENT_EMAIL], {
      fatherInfo: { fatherFirstName: "Seeded", noFatherInfo: false },
    });

    seedFormState("hfse-new", {
      familyInfo: {
        motherInfo: { isValid: true },
        fatherInfo: { noFatherInfo: true },
      },
    });

    const user = userEvent.setup();
    renderForm(<HfseNewFatherInformation />, { flow: "hfse-new", session: MOCK_SESSION, queryClient });

    const toggle = screen.getByRole("switch", { name: /father's information not available/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Seeded");
    });
  });

  it("VizSchool new: re-enabling father info repopulates from data cached under the refetch key", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["new-learner-family-information", PARENT_EMAIL], {
      fatherInfo: { fatherFirstName: "Seeded", noFatherInfo: false },
    });

    seedFormState("vizschool-new", {
      familyInfo: {
        motherInfo: { isValid: true },
        fatherInfo: { noFatherInfo: true },
      },
    });

    const user = userEvent.setup();
    renderForm(<VizSchoolNewFatherInformation />, { flow: "vizschool-new", session: MOCK_SESSION, queryClient });

    const toggle = screen.getByRole("switch", { name: /father's information not available/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/^first name$/i)).toHaveValue("Seeded");
    });
  });
});

// ---------------------------------------------------------------------------------------------
// Fix 5 — mother's WhatsApp/Teams consent field (HFSE old) was gated on the FATHER's
// noFatherInfo flag, so it wrongly disappeared whenever father info was marked N/A.
// ---------------------------------------------------------------------------------------------

describe("HFSE old mother-information — consent field visibility", () => {
  it("renders the consent field even when father info is marked not applicable", () => {
    seedFormState("hfse-old", {
      familyInfo: {
        motherInfo: {
          motherFirstName: "Maria",
          motherLastName: "Dela Cruz",
          motherPreferredName: "Maria",
          motherBirthDay: new Date("1985-03-01"),
          motherNationality: "Singaporean",
          motherReligion: "Catholic",
          motherNric: "S1234567A",
          motherMobile: "65111111",
          motherEmail: "maria@example.com",
          motherCompanyName: "Acme Pte Ltd",
          motherPosition: "Manager",
        },
        fatherInfo: { noFatherInfo: true },
      },
    });

    renderForm(<HfseOldMotherInformation />, { flow: "hfse-old" });

    expect(screen.getByText(/communication consent/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------------------------
// Fix 6 — father/guardian/sibling "steps/" (new-flow) components read
// `formState.familyInfo?.motherInfo.isValid` (missing a `?.` before `.isValid`), which threw
// if a fresh draft reached that tab before motherInfo existed in the store at all. All 9
// occurrences (father/guardian/sibling × HFSE-new/VizSchool-new/Open-House) were the exact
// same one-line pattern, confirmed by the grep sweep done alongside this fix. Rendered here
// for the HFSE-new father variant as a representative behavioral proof; the other 8 aren't
// independently re-rendered since they're byte-identical fixes, not separate logic.
// ---------------------------------------------------------------------------------------------

describe("father-information 'steps/' — motherInfo may be entirely absent", () => {
  it("HFSE new: submitting valid father info does not throw when familyInfo.motherInfo is undefined", async () => {
    seedFormState("hfse-new", {
      familyInfo: {
        fatherInfo: {
          fatherFirstName: "Jose",
          fatherLastName: "Dela Cruz",
          fatherPreferredName: "Jose",
          fatherBirthDay: new Date("1983-02-01"),
          fatherNationality: "Singaporean",
          fatherReligion: "Catholic",
          fatherNric: "S1234568B",
          fatherMobile: "65222222",
          fatherEmail: "jose@example.com",
          fatherCompanyName: "Acme Pte Ltd",
          fatherPosition: "Engineer",
          noFatherInfo: false,
        },
        // motherInfo intentionally absent — the pre-fix code crashed reading `.isValid` off it.
      },
    });

    const user = userEvent.setup();
    renderForm(<HfseNewFatherInformation />, { flow: "hfse-new" });

    const [submitButton] = screen.getAllByRole("button", { name: /confirm details/i });

    // The pre-fix code threw a TypeError reading `.isValid` off undefined `motherInfo` right
    // after this click, inside proceedToNextStep — before it ever reached the toast.info call
    // below. Reaching that call (rather than an uncaught error) is the proof the crash is gone.
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        "Father's information confirmed!",
        expect.objectContaining({ description: expect.stringContaining("Mother's information") }),
      );
    });
  });
});
