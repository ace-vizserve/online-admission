/**
 * Coverage for the submit re-entrancy guard (`submitInFlight` ref) in the two INLINE submit
 * dialogs that live inside large, multi-purpose layout files:
 *   - `SubmitApplicationDialog` in new-student-layout.tsx (HFSE-IS new student, ~line 223)
 *   - `SubmitApplicationDialog` in vizschool/new-learner-layout.tsx (VizSchool new learner, ~line 223)
 *
 * Neither component is exported (both are internal to their layout file, alongside routing,
 * drafts-dialog, and exit-dialog logic that's out of scope for this change). Per the existing
 * `AutoResumeDraft` precedent in `auto-resume-draft.test.tsx`, this file uses a thin harness that
 * reproduces the exact guard-relevant glue logic — the `useMutation` config's `onSettled`/
 * `onError` and the `if (submitInFlight.current) return; submitInFlight.current = true;` check —
 * rather than fighting the non-export. If either real file's guard logic changes, this harness
 * must be updated to match (the full validation-branch logic in those files is unchanged by this
 * work and isn't duplicated here — see submit-application-dialog.test.tsx and
 * submit-learner-application-dialog.test.tsx for that level of exhaustive coverage on the two
 * standalone dialogs).
 */
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const { toast } = await import("sonner");

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

/** Mirrors new-student-layout.tsx SubmitApplicationDialog's guard + mutation shape. */
function NewStudentSubmitHarness({ submitFn }: { submitFn: (formState: unknown) => Promise<{ generatedEnroleeNumber: string }> }) {
  const submitInFlight = useRef(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async (formState: unknown) => submitFn(formState),
    onSettled() {
      submitInFlight.current = false;
    },
    onSuccess() {
      // navigate side effect omitted — asserted via location in the vizschool harness instead
    },
    onError() {
      toast.error("Uh oh! Something went wrong", {
        description: "An unknown error occurred. Please try again.",
      });
    },
  });

  function submitApplication() {
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    mutate({});
  }

  return (
    <button disabled={isPending} onClick={submitApplication}>
      {isPending ? "Sending" : "Send Application"}
    </button>
  );
}

/** Mirrors vizschool/new-learner-layout.tsx SubmitApplicationDialog's guard + mutation shape,
 *  additionally exercising the onSuccess navigate side effect. */
function NewLearnerSubmitHarness({ submitFn }: { submitFn: () => Promise<undefined> }) {
  const navigate = useNavigate();
  const submitInFlight = useRef(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => submitFn(),
    onSettled() {
      submitInFlight.current = false;
    },
    onSuccess() {
      navigate("/application-submitted");
    },
    onError() {
      toast.error("Uh oh! Something went wrong", {
        description: "An unknown error occurred. Please try again.",
      });
    },
  });

  function submitApplication() {
    if (submitInFlight.current) return;
    submitInFlight.current = true;
    mutate();
  }

  return (
    <button disabled={isPending} onClick={submitApplication}>
      {isPending ? "Sending" : "Send Application"}
    </button>
  );
}

function renderHarness(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/enrol-student/new/documents"]}>
        {ui}
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Inline submit dialogs — hard re-entrancy guard (new-student-layout.tsx)", () => {
  it("only calls the submit action once for a same-tick double click", async () => {
    let resolveSubmit!: (value: { generatedEnroleeNumber: string }) => void;
    const submitFn = vi.fn(
      () =>
        new Promise<{ generatedEnroleeNumber: string }>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    renderHarness(<NewStudentSubmitHarness submitFn={submitFn} />);
    const button = screen.getByRole("button", { name: /Send Application/i });

    // Both dispatches inside one outer act() so React defers flushing `isPending` until after
    // both clicks run — reproducing the same-tick race the ref guard exists to close.
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });

    await waitFor(() => expect(submitFn).toHaveBeenCalledTimes(1));

    resolveSubmit({ generatedEnroleeNumber: "E00001" });
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("Send Application"));
  });

  it("resets the guard on settle, so a legitimate retry after an error can submit again", async () => {
    const submitFn = vi.fn().mockRejectedValueOnce(new Error("network blip")).mockResolvedValueOnce({
      generatedEnroleeNumber: "E00002",
    });

    renderHarness(<NewStudentSubmitHarness submitFn={submitFn} />);
    const button = screen.getByRole("button", { name: /Send Application/i });

    fireEvent.click(button);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Uh oh! Something went wrong",
        expect.objectContaining({ description: expect.any(String) }),
      ),
    );

    fireEvent.click(button);
    await waitFor(() => expect(submitFn).toHaveBeenCalledTimes(2));
  });
});

describe("Inline submit dialogs — hard re-entrancy guard (vizschool/new-learner-layout.tsx)", () => {
  it("only calls the submit action once for a same-tick double click", async () => {
    let resolveSubmit!: (value: undefined) => void;
    const submitFn = vi.fn(
      () =>
        new Promise<undefined>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    renderHarness(<NewLearnerSubmitHarness submitFn={submitFn} />);
    const button = screen.getByRole("button", { name: /Send Application/i });

    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });

    await waitFor(() => expect(submitFn).toHaveBeenCalledTimes(1));

    resolveSubmit(undefined);
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/application-submitted"));
  });

  it("resets the guard on settle, so a legitimate retry after an error can submit again", async () => {
    const submitFn = vi.fn().mockRejectedValueOnce(new Error("network blip")).mockResolvedValueOnce(undefined);

    renderHarness(<NewLearnerSubmitHarness submitFn={submitFn} />);
    const button = screen.getByRole("button", { name: /Send Application/i });

    fireEvent.click(button);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Uh oh! Something went wrong",
        expect.objectContaining({ description: expect.any(String) }),
      ),
    );

    fireEvent.click(button);
    await waitFor(() => expect(submitFn).toHaveBeenCalledTimes(2));
  });
});
