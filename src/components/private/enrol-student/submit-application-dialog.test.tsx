/**
 * Coverage for SubmitApplicationDialog (HFSE-IS re-enrollment "submit" step).
 *
 * Two things are under test:
 *  1. Every pre-existing validation branch in `verifyEnrollmentDetails` — each guards a distinct
 *     toast + "go fix this" navigation, and the happy path that finally calls `mutate()`.
 *  2. The new hard re-entrancy guard (`submitInFlight` ref) added to make submit idempotent: a
 *     same-tick double click on "Continue" must only invoke `submitExistingEnrollment` once, and
 *     the guard must reset on settle so a legitimate retry after an error still works.
 */
import { UserSessionContext } from "@/context/user-session-context";
import EnrolOldStudentContextProvider from "@/context/enrol-old-student-context";
import {
  resetEnrolmentStores,
  seedFormState,
} from "@/test/render-form";
import { usePassTypeStore, useSelectAcademicYear } from "@/zustand-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: { warning: vi.fn(), info: vi.fn(), error: vi.fn(), success: vi.fn() },
}));
vi.mock("@/actions/private", () => ({ submitExistingEnrollment: vi.fn() }));

const SubmitApplicationDialog = (await import("./submit-application-dialog")).default;
const { submitExistingEnrollment } = await import("@/actions/private");
const { toast } = await import("sonner");

function buildValidFormState(overrides: Record<string, unknown> = {}) {
  return {
    studentInfo: {
      addressContact: {
        isValid: true,
        contactPersonNumber: "91234567",
        homePhone: "61234567",
        postalCode: "123456",
      },
    },
    familyInfo: {
      motherInfo: { motherMobile: "92222222" },
    },
    enrollmentInfo: { isValid: true },
    uploadRequirements: {
      studentUploadRequirements: { isValid: true },
      parentGuardianUploadRequirements: { isValid: true },
    },
    preCourseAnswer: "yes",
    preCourseDate: new Date("2024-01-01"),
    ...overrides,
  };
}

function LocationDisplay() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}|{JSON.stringify(location.state)}
    </div>
  );
}

function renderDialog({
  formState,
  academicYear = "2024-2025",
  stpApplicationType = "",
}: {
  formState: Record<string, unknown>;
  academicYear?: string;
  stpApplicationType?: string;
}) {
  seedFormState("hfse-old", formState);
  useSelectAcademicYear.setState({ academicYear });
  usePassTypeStore.setState({ stpApplicationType });

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/enrol-student/enrolee-1"]}>
        <UserSessionContext.Provider
          value={{ session: { user: { email: "parent@example.com" } } as never, isLoading: false, passwordResetState: false }}>
          <EnrolOldStudentContextProvider>
            <Routes>
              <Route path="/enrol-student/:id" element={<SubmitApplicationDialog />} />
            </Routes>
          </EnrolOldStudentContextProvider>
        </UserSessionContext.Provider>
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /Send Application/i }));
  return screen.findByRole("button", { name: "Continue" });
}

function locationText() {
  return screen.getByTestId("location").textContent ?? "";
}

/** Grabs the most recent call to a mocked toast function and invokes its action's onClick. */
function runLastToastAction(toastFn: (typeof toast)["warning"] | (typeof toast)["info"]) {
  const lastCall = vi.mocked(toastFn).mock.calls.at(-1)!;
  const options = lastCall[1] as unknown as { action: { onClick: () => void } };
  act(() => {
    options.action.onClick();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetEnrolmentStores();
});

describe("SubmitApplicationDialog — validation branches (no submission)", () => {
  it("blocks and warns when address & contact info is invalid for an STP application type", async () => {
    const continueButton = await (async () => {
      renderDialog({
        formState: buildValidFormState({
          studentInfo: { addressContact: { isValid: false } },
        }),
        stpApplicationType: "New STP Application (Current HFSE Student)",
      });
      return openDialog();
    })();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Review Address & Contact Information!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();

    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/student-info?academicYear=2024-2025");
    expect(locationText()).toContain(`"activeTab":"address-contact"`);
  });

  it("blocks and warns on an invalid contact person number", async () => {
    renderDialog({
      formState: buildValidFormState({
        studentInfo: { addressContact: { isValid: true, contactPersonNumber: "abc", homePhone: "61234567", postalCode: "123456" } },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Invalid Contact Person Number!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();

    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/student-info?academicYear=2024-2025");
  });

  it("blocks and warns on an invalid home phone number", async () => {
    renderDialog({
      formState: buildValidFormState({
        studentInfo: { addressContact: { isValid: true, contactPersonNumber: "91234567", homePhone: "abc", postalCode: "123456" } },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Invalid Home Phone Number!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/student-info?academicYear=2024-2025");
  });

  it("blocks and warns on an invalid postal code", async () => {
    renderDialog({
      formState: buildValidFormState({
        studentInfo: { addressContact: { isValid: true, contactPersonNumber: "91234567", homePhone: "61234567", postalCode: "abc" } },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Invalid Postal Code!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/student-info?academicYear=2024-2025");
  });

  it("blocks and informs when family info is missing", async () => {
    renderDialog({ formState: buildValidFormState({ familyInfo: null }) });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.info).toHaveBeenCalledWith(
      "Review Family Information!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.info);
    expect(locationText()).toContain("/enrol-student/enrolee-1/family-info?academicYear=2024-2025");
  });

  it("blocks and warns when enrollment info is missing", async () => {
    renderDialog({ formState: buildValidFormState({ enrollmentInfo: null }) });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Fill up the enrollment information tab!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/enrollment-info?academicYear=2024-2025");
    expect(locationText()).toContain(`"triggerForm":true`);
  });

  it("blocks and warns when enrollment info is not valid", async () => {
    renderDialog({ formState: buildValidFormState({ enrollmentInfo: { isValid: false } }) });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Please save your enrollment information!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/enrollment-info?academicYear=2024-2025");
  });

  it("blocks and warns when student documents are missing", async () => {
    renderDialog({
      formState: buildValidFormState({ uploadRequirements: { studentUploadRequirements: null } }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Please upload the required student documents",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/documents?academicYear=2024-2025");
  });

  it("blocks and warns when student documents are not valid", async () => {
    renderDialog({
      formState: buildValidFormState({
        uploadRequirements: {
          studentUploadRequirements: { isValid: false },
          parentGuardianUploadRequirements: { isValid: true },
        },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Please review and save your student documents!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/documents?academicYear=2024-2025");
  });

  it("blocks and warns when parent/guardian documents are missing", async () => {
    renderDialog({
      formState: buildValidFormState({
        uploadRequirements: {
          studentUploadRequirements: { isValid: true },
          parentGuardianUploadRequirements: null,
        },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Please upload the required parent/guardian documents",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/documents?academicYear=2024-2025");
  });

  it("blocks and warns when parent/guardian documents are not valid", async () => {
    renderDialog({
      formState: buildValidFormState({
        uploadRequirements: {
          studentUploadRequirements: { isValid: true },
          parentGuardianUploadRequirements: { isValid: false },
        },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Please review and save your parent/guardian documents!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/documents?academicYear=2024-2025");
  });

  it("blocks and warns on an invalid mother mobile number", async () => {
    renderDialog({
      formState: buildValidFormState({ familyInfo: { motherInfo: { motherMobile: "abc" } } }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Invalid Mother Mobile!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/family-info?academicYear=2024-2025");
  });

  it("blocks and warns on an invalid guardian mobile number when guardian info is present", async () => {
    renderDialog({
      formState: buildValidFormState({
        familyInfo: {
          motherInfo: { motherMobile: "92222222" },
          guardianInfo: { noGuardianInfo: false, guardianMobile: "abc" },
        },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Invalid Guardian Mobile!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/family-info?academicYear=2024-2025");
  });

  it("blocks and warns on an invalid father mobile number when father info is present", async () => {
    renderDialog({
      formState: buildValidFormState({
        familyInfo: {
          motherInfo: { motherMobile: "92222222" },
          fatherInfo: { noFatherInfo: false, fatherMobile: "abc" },
        },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.warning).toHaveBeenCalledWith(
      "Invalid Father Mobile!",
      expect.objectContaining({ description: expect.any(String) }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
    runLastToastAction(toast.warning);
    expect(locationText()).toContain("/enrol-student/enrolee-1/family-info?academicYear=2024-2025");
  });

  it("catches a thrown error (e.g. missing address & contact data) and toasts it instead of crashing", async () => {
    renderDialog({
      formState: buildValidFormState({ studentInfo: {} }), // addressContact is undefined
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ description: "Please upload a valid, updated document" }),
    );
    expect(submitExistingEnrollment).not.toHaveBeenCalled();
  });
});

describe("SubmitApplicationDialog — happy path & family info branch coverage", () => {
  it("submits once all validation passes (guardian & father info both absent — skip branch)", async () => {
    vi.mocked(submitExistingEnrollment).mockResolvedValueOnce("E00001");

    renderDialog({ formState: buildValidFormState() });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    await waitFor(() => expect(submitExistingEnrollment).toHaveBeenCalledTimes(1));
    expect(submitExistingEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ preCourseAnswer: "yes" }),
      "enrolee-1",
      "2024-2025",
      expect.objectContaining({ preCourseAnswer: "yes" }),
    );

    await waitFor(() => expect(locationText()).toContain("/application-submitted"));
    expect(locationText()).toContain(`"enroleeNumber":"E00001"`);
  });

  it("submits when guardian & father info are present with valid mobiles", async () => {
    vi.mocked(submitExistingEnrollment).mockResolvedValueOnce("E00002");

    renderDialog({
      formState: buildValidFormState({
        familyInfo: {
          motherInfo: { motherMobile: "92222222" },
          guardianInfo: { noGuardianInfo: false, guardianMobile: "93333333" },
          fatherInfo: { noFatherInfo: false, fatherMobile: "94444444" },
        },
      }),
    });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);

    await waitFor(() => expect(submitExistingEnrollment).toHaveBeenCalledTimes(1));
  });
});

describe("SubmitApplicationDialog — submit idempotency (hard re-entrancy guard)", () => {
  it("only calls submitExistingEnrollment once for a same-tick double click on Continue", async () => {
    let resolveSubmit!: (value: string) => void;
    vi.mocked(submitExistingEnrollment).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      }),
    );

    renderDialog({ formState: buildValidFormState() });
    const continueButton = await openDialog();

    // Both dispatches happen inside one outer `act()`, so React defers flushing (disabling the
    // button, Radix closing the dialog) until after BOTH clicks have run — reproducing a true
    // same-tick double click, where neither of those normally-protective side effects has landed
    // yet. `submitInFlight` is a ref, updated synchronously inside the click handler itself
    // (independent of React's render/commit cycle), so it's what actually closes this race.
    act(() => {
      fireEvent.click(continueButton);
      fireEvent.click(continueButton);
    });

    await waitFor(() => expect(submitExistingEnrollment).toHaveBeenCalledTimes(1));

    resolveSubmit("E00003");
    await waitFor(() => expect(locationText()).toContain("/application-submitted"));
  });

  it("resets the guard on settle, so a legitimate retry after an error can submit again", async () => {
    vi.mocked(submitExistingEnrollment).mockRejectedValueOnce(new Error("network blip"));
    vi.mocked(submitExistingEnrollment).mockResolvedValueOnce("E00004");

    renderDialog({ formState: buildValidFormState() });
    const continueButton = await openDialog();

    fireEvent.click(continueButton);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Uh oh! Something went wrong",
        expect.objectContaining({ description: expect.any(String) }),
      ),
    );

    // AlertDialogAction closes the dialog on click regardless of outcome, so the retry has to
    // reopen it — this also proves `onSettled` reset the guard for a real user's next attempt,
    // not just that a second click on the same (now-detached) button was swallowed by Radix.
    const retryContinueButton = await openDialog();
    fireEvent.click(retryContinueButton);

    await waitFor(() => expect(submitExistingEnrollment).toHaveBeenCalledTimes(2));
  });
});
