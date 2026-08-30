/**
 * Behaviour tests for the filing wizard.
 *
 * The branching and the payload shaping are proved as pure units in declaration-steps.test.ts
 * and declaration-payload.test.ts. What is tested here is what only the assembled form can show:
 * that a parent can get through it, that the review reads back what they said, and that the
 * three outcomes easiest to get wrong — a duplicate submit, a field error, a rejected child —
 * each land somewhere the parent can act on.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useEnrolledStudents, fileDeclaration, uploadEvidence, toastError, toastWarning } = vi.hoisted(() => ({
  useEnrolledStudents: vi.fn(),
  fileDeclaration: vi.fn(),
  uploadEvidence: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("@/hooks/use-enrolled-students", () => ({ useEnrolledStudents }));
vi.mock("sonner", () => ({ toast: { error: toastError, warning: toastWarning, success: vi.fn(), info: vi.fn() } }));
vi.mock("@/actions/declarations", () => ({
  fileDeclaration,
  uploadEvidence,
  EVIDENCE_ACCEPT: { "application/pdf": [".pdf"] },
  MAX_EVIDENCE_BYTES: 10 * 1024 * 1024,
}));

// This wizard drives many steps per test, each re-rendering a form and a calendar. Under a full
// parallel run with coverage instrumentation that exceeds the 5s default — the same reason
// sidebar.test.tsx raises its own timeout.
vi.setConfig({ testTimeout: 30000 });

const { SisError } = await import("@/lib/sis");
const { default: FileDeclaration } = await import("./file-declaration");

const ANA = {
  studentNumber: "H250123",
  name: "Ana Reyes",
  levelCode: "P4",
  sectionName: "Diligence",
  className: "P4 Diligence",
};
const LEO = {
  studentNumber: "H250124",
  name: "Leo Reyes",
  levelCode: "P2",
  sectionName: "Grace",
  className: "P2 Grace",
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={["/admission/services/declarations/new"]}>
      <Routes>
        <Route path="/admission/services/declarations/new" element={<FileDeclaration />} />
        <Route path="/admission/services/declarations" element={<p>Status list</p>} />
        <Route path="/login" element={<p>Sign in</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper },
  );
}

const next = () => userEvent.click(screen.getByRole("button", { name: /continue/i }));
const back = () => userEvent.click(screen.getByRole("button", { name: /back/i }));

// Driven off the real clock rather than a pinned date: the calendar opens on the current month,
// and a hardcoded month would fall off the visible grid the moment real time moved past it.
const TODAY = new Date();
const IN_TWO_DAYS = addDays(TODAY, 2);

/**
 * Matches the aria-label react-day-picker gives a day button, e.g. "Thursday, August 27th, 2026".
 * A substring match, because the current date is labelled "Today, Thursday, August 27th, 2026".
 */
const dayLabel = (date: Date) => new RegExp(format(date, "EEEE, MMMM do, yyyy"));
const isoDate = (date: Date) => format(date, "yyyy-MM-dd");

/** Clicks one day. A single click is a one-day declaration, the common case. */
async function pickDay(date: Date) {
  await userEvent.click(screen.getByRole("button", { name: dayLabel(date) }));
}

/** Opens the country picker, searches, and chooses a country. */
async function pickCountry(search: string, option: RegExp) {
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.type(screen.getByPlaceholderText(/search country/i), search, { delay: null });
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

/** Clicks a start and then an end day to make a range. */
async function pickRange(from: Date, to: Date) {
  await pickDay(from);
  await pickDay(to);
}

beforeEach(() => {
  useEnrolledStudents.mockReset().mockReturnValue({ data: [ANA], isPending: false, error: null });
  fileDeclaration.mockReset().mockResolvedValue({ filingGroupId: "9e7c", declarations: [] });
  uploadEvidence.mockReset();
  toastError.mockReset();
  toastWarning.mockReset();
});

describe("FileDeclaration — who", () => {
  it("preselects an only child, so most parents just continue", async () => {
    renderWizard();

    expect(await screen.findByRole("checkbox", { name: /Ana Reyes/ })).toBeChecked();
  });

  it("offers each child with their class, so siblings can be told apart", async () => {
    useEnrolledStudents.mockReturnValue({ data: [ANA, LEO], isPending: false, error: null });

    renderWizard();

    expect(await screen.findByRole("checkbox", { name: /Ana Reyes.*P4 Diligence/ })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Leo Reyes.*P2 Grace/ })).toBeInTheDocument();
  });

  it("does not preselect when there is more than one child to choose between", async () => {
    useEnrolledStudents.mockReturnValue({ data: [ANA, LEO], isPending: false, error: null });

    renderWizard();

    expect(await screen.findByRole("checkbox", { name: /Ana Reyes/ })).not.toBeChecked();
  });

  it("will not advance with no child chosen", async () => {
    useEnrolledStudents.mockReturnValue({ data: [ANA, LEO], isPending: false, error: null });
    renderWizard();

    await next();

    expect(await screen.findByText(/choose at least one child/i)).toBeInTheDocument();
  });
});

describe("FileDeclaration — branching", () => {
  it("never asks a travelling family about a medical certificate", async () => {
    renderWizard();
    await next();

    await userEvent.click(await screen.findByRole("radio", { name: /travel/i }));
    await next();
    await pickRange(TODAY, IN_TWO_DAYS);
    await next();

    expect(screen.getByText(/where are they going/i)).toBeInTheDocument();
    expect(screen.queryByText(/medical certificate/i)).not.toBeInTheDocument();
  });

  it("lets the parent go back and change their mind", async () => {
    renderWizard();
    await next();

    await userEvent.click(await screen.findByRole("radio", { name: /travel/i }));
    await back();

    expect(screen.getByRole("checkbox", { name: /Ana Reyes/ })).toBeInTheDocument();
  });
});

describe("FileDeclaration — submitting", () => {
  /** Drives a one-day absence with no certificate through to the review step. */
  async function reachReview() {
    renderWizard();
    await next(); // who
    await next(); // type — absence is the default
    await pickDay(TODAY);
    await next(); // when
    await next(); // certificate — without, the default
    await next(); // note
  }

  it("reads the answers back before sending them", async () => {
    await reachReview();

    expect(screen.getByText("Ana Reyes")).toBeInTheDocument();
    expect(screen.getByText(format(TODAY, "d MMM yyyy"))).toBeInTheDocument();
  });

  it("sends an absence payload carrying no travel fields", async () => {
    await reachReview();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fileDeclaration).toHaveBeenCalledTimes(1));
    const payload = fileDeclaration.mock.calls[0][0];
    expect(payload).toMatchObject({
      declarationType: "absence",
      studentNumbers: ["H250123"],
      startDate: isoDate(TODAY),
      endDate: isoDate(TODAY),
      withMedical: false,
    });
    expect(payload).not.toHaveProperty("destinationCountry");
  });

  it("treats a duplicate submit as success, not as an error", async () => {
    fileDeclaration.mockResolvedValue({ filingGroupId: "9e7c", declarations: [], alreadyFiled: true });
    await reachReview();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByRole("heading", { name: /already sent/i })).toBeInTheDocument();
    expect(screen.queryByText(/went wrong/i)).not.toBeInTheDocument();
  });

  it("puts a field error from the SIS under the field it names, worded as the SIS wrote it", async () => {
    fileDeclaration.mockRejectedValue(
      new SisError("Please check the form.", 400, [
        { path: "endDate", message: "The last day cannot be before the first day." },
      ]),
    );
    await reachReview();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("The last day cannot be before the first day.")).toBeInTheDocument();
  });

  it("shows a rejected child as the SIS explained it, rather than a generic failure", async () => {
    fileDeclaration.mockRejectedValue(new SisError("One of the children selected is not on your account.", 403));
    await reachReview();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("One of the children selected is not on your account.")).toBeInTheDocument();
  });
});

describe("FileDeclaration — travel", () => {
  /** Drives a travel declaration through to the review step. */
  async function reachTravelReview() {
    renderWizard();
    await next();
    await userEvent.click(await screen.findByRole("radio", { name: /travel/i }));
    await next();
    await pickRange(TODAY, IN_TWO_DAYS);
    await next();
    await pickCountry("Malay", /Malaysia/);
    await userEvent.type(screen.getByLabelText(/city/i), "Penang", { delay: null });
    await next();
    await next();
  }

  it("will not advance without a destination country", async () => {
    renderWizard();
    await next();
    await userEvent.click(await screen.findByRole("radio", { name: /travel/i }));
    await next();
    await pickRange(TODAY, IN_TWO_DAYS);
    await next();

    await next();

    expect(await screen.findByText(/please tell us which country/i)).toBeInTheDocument();
    expect(fileDeclaration).not.toHaveBeenCalled();
  });

  it("sends a travel payload carrying no certificate fields", async () => {
    await reachTravelReview();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fileDeclaration).toHaveBeenCalledTimes(1));
    const payload = fileDeclaration.mock.calls[0][0];
    expect(payload).toMatchObject({
      declarationType: "travel",
      destinationCountry: "Malaysia",
      destinationCity: "Penang",
    });
    expect(payload).not.toHaveProperty("withMedical");
    expect(payload).not.toHaveProperty("evidencePath");
  });

  it("quotes the wait when the parent is rate limited", async () => {
    fileDeclaration.mockRejectedValue(new SisError("Too many requests.", 429, undefined, 30));
    await reachTravelReview();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/30 seconds/)).toBeInTheDocument();
  });
});

describe("FileDeclaration — the certificate", () => {
  const certificate = new File(["x"], "mc.pdf", { type: "application/pdf" });

  /** Drives an absence with a medical certificate as far as the attach step. */
  async function reachAttach() {
    renderWizard();
    await next();
    await next();
    await pickDay(TODAY);
    await next();
    await userEvent.click(screen.getByRole("radio", { name: /with medical certificate/i }));
    await next();
  }

  it("attaches the uploaded certificate by the path the SIS returned", async () => {
    uploadEvidence.mockResolvedValue("declarations/8f2a/c41b.pdf");
    await reachAttach();

    // FileUploader keeps its input hidden behind the drop zone, so it is reached the same way
    // file-input.test.tsx reaches it.
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, certificate);

    // Picking only stages the file — nothing has left the browser yet.
    expect(uploadEvidence).not.toHaveBeenCalled();
    expect(screen.queryByText(/certificate attached/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /upload file/i }));

    expect(await screen.findByText(/certificate attached/i)).toBeInTheDocument();
    expect(uploadEvidence).toHaveBeenCalledWith(certificate);
    await next();
    await next();
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fileDeclaration).toHaveBeenCalledTimes(1));
    expect(fileDeclaration.mock.calls[0][0]).toMatchObject({
      withMedical: true,
      evidencePath: "declarations/8f2a/c41b.pdf",
    });
  });

  it("removing the file after uploading re-locks it, so the old path can't be filed", async () => {
    uploadEvidence.mockResolvedValue("declarations/8f2a/first.pdf");
    await reachAttach();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, certificate);
    await userEvent.click(screen.getByRole("button", { name: /upload file/i }));
    expect(await screen.findByText(/certificate attached/i)).toBeInTheDocument();

    // Taking the file back out has to invalidate the upload — otherwise the declaration would
    // still be filed against a path pointing at a certificate the parent has removed.
    await userEvent.click(screen.getByRole("button", { name: /remove item 0/i }));

    expect(screen.queryByText(/certificate attached/i)).not.toBeInTheDocument();
  });

  it("accepts a digital MC link with no upload at all", async () => {
    await reachAttach();

    await userEvent.type(screen.getByLabelText(/paste a link/i), "https://mc.gov.sg/abcd", { delay: null });
    await next();
    await next();
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fileDeclaration).toHaveBeenCalledTimes(1));
    expect(fileDeclaration.mock.calls[0][0]).toMatchObject({ evidenceUrl: "https://mc.gov.sg/abcd" });
  });

  it("will not advance with a certificate declared but nothing attached", async () => {
    await reachAttach();

    await next();

    expect(await screen.findByText(/attach the certificate, or paste its link/i)).toBeInTheDocument();
  });

  it("rejects an insecure link before it is ever sent", async () => {
    await reachAttach();

    await userEvent.type(screen.getByLabelText(/paste a link/i), "http://mc.gov.sg/abcd", { delay: null });
    await next();

    expect(await screen.findByText(/must start with https/i)).toBeInTheDocument();
    expect(fileDeclaration).not.toHaveBeenCalled();
  });
});

describe("FileDeclaration — declaring a past absence", () => {
  it("lets a parent pick a day that has already passed, which is the usual case for illness", async () => {
    const FIVE_DAYS_AGO = addDays(TODAY, -5);
    renderWizard();
    await next();
    await next();

    await pickDay(FIVE_DAYS_AGO);
    await next();
    await next();
    await next();

    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fileDeclaration).toHaveBeenCalledTimes(1));
    expect(fileDeclaration.mock.calls[0][0]).toMatchObject({
      startDate: isoDate(FIVE_DAYS_AGO),
      endDate: isoDate(FIVE_DAYS_AGO),
    });
  });
});

describe("FileDeclaration — the accepted date window", () => {
  it("does not offer a day older than the school will accept", async () => {
    // Two months back, first of the month: at least 59 days ago whatever today is, so it is
    // always outside the 30-day window — unlike "one month back", which is 28 days in February.
    const LONG_AGO = startOfMonth(subMonths(TODAY, 2));
    renderWizard();
    await next();
    await next();

    const previousMonth = screen.getByRole("button", { name: /previous month/i });
    await userEvent.click(previousMonth);
    await userEvent.click(previousMonth);

    expect(screen.getByRole("button", { name: dayLabel(LONG_AGO) })).toBeDisabled();
  });
});

describe("FileDeclaration — how a failed submit is shown", () => {
  /** Drives a one-day absence to the review step and submits it. */
  async function submitOnce() {
    renderWizard();
    await next();
    await next();
    await pickDay(TODAY);
    await next();
    await next();
    await next();
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
  }

  it("does not dress an already-filed clash as a breakage", async () => {
    const sentence = "Ana Reyes has already been filed for on 2026-08-28 to 2026-08-31.";
    fileDeclaration.mockRejectedValue(new SisError(sentence, 409));

    await submitOnce();

    expect(await screen.findByText(sentence)).toBeInTheDocument();
    // A clash is not the parent's mistake, so it warns rather than erroring.
    await waitFor(() => expect(toastWarning).toHaveBeenCalled());
    expect(toastError).not.toHaveBeenCalled();
  });

  it("offers a way to the existing filing, since that is what the parent needs to see", async () => {
    fileDeclaration.mockRejectedValue(new SisError("Already filed for those days.", 409));

    await submitOnce();

    expect(await screen.findByRole("link", { name: /my declarations/i })).toHaveAttribute(
      "href",
      "/admission/services/declarations",
    );
  });

  it("offers a retry when the school's system faulted, because retrying may work", async () => {
    fileDeclaration.mockRejectedValue(new SisError("Could not save that. Please try again.", 500));

    await submitOnce();

    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it("does not offer a retry for a child the school will not accept", async () => {
    fileDeclaration.mockRejectedValue(
      new SisError("One of the children selected is not on your account.", 403),
    );

    await submitOnce();

    expect(await screen.findByText(/not on your account/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("announces a form error too, so it is obvious the submit did not go through", async () => {
    fileDeclaration.mockRejectedValue(
      new SisError("Please check the form.", 400, [
        { path: "endDate", message: "The last day cannot be before the first day." },
      ]),
    );

    await submitOnce();

    expect(await screen.findByText("The last day cannot be before the first day.")).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});

/**
 * The 29 Aug contract splits what used to be one flat refusal into three, each needing a
 * different destination. Getting these confused sends a parent somewhere that cannot help.
 */
describe("FileDeclaration — where a refusal sends the parent", () => {
  async function submitOnce() {
    renderWizard();
    await next();
    await next();
    await pickDay(TODAY);
    await next();
    await next();
    await next();
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
  }

  it("sends a shut-school refusal back to the dates, which are what must change", async () => {
    fileDeclaration.mockRejectedValue(
      new SisError("The school is closed for all of those dates. Please check the dates and try again.", 400),
    );

    await submitOnce();

    expect(await screen.findByRole("heading", { name: /when\?/i })).toBeInTheDocument();
    expect(screen.getByText(/school is closed for all of those dates/i)).toBeInTheDocument();
    // The status list holds nothing that helps here.
    expect(screen.queryByRole("link", { name: /my declarations/i })).not.toBeInTheDocument();
  });

  it("names every clashing sibling, not just the one the sentence mentions", async () => {
    fileDeclaration.mockRejectedValue(
      new SisError("Ana Reyes has already been approved as away on 2026-09-16 to 2026-09-18.", 409, undefined, undefined, {
        overlapping: [
          {
            studentName: "Ana Reyes",
            declarationType: "absence",
            startDate: "2026-09-16",
            endDate: "2026-09-18",
            status: "approved",
            isExactMatch: true,
          },
          {
            studentName: "Leo Reyes",
            declarationType: "absence",
            startDate: "2026-09-16",
            endDate: "2026-09-18",
            status: "pending",
            isExactMatch: true,
          },
        ],
      }),
    );

    await submitOnce();

    expect(await screen.findByText(/Leo Reyes/)).toBeInTheDocument();
  });

  it("sends an expired session to sign in without ever printing the token wording", async () => {
    fileDeclaration.mockRejectedValue(new SisError("invalid or expired token", 401));

    await submitOnce();

    expect(await screen.findByText("Sign in")).toBeInTheDocument();
    expect(screen.queryByText(/invalid or expired token/i)).not.toBeInTheDocument();
  });
});
