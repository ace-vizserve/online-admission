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

const { useEnrolledStudents, fileDeclaration, uploadEvidence } = vi.hoisted(() => ({
  useEnrolledStudents: vi.fn(),
  fileDeclaration: vi.fn(),
  uploadEvidence: vi.fn(),
}));

vi.mock("@/hooks/use-enrolled-students", () => ({ useEnrolledStudents }));
vi.mock("@/actions/declarations", () => ({
  fileDeclaration,
  uploadEvidence,
  EVIDENCE_MIME_TYPES: ["application/pdf"],
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

    await userEvent.upload(screen.getByLabelText(/upload/i), certificate);

    expect(await screen.findByText(/certificate attached/i)).toBeInTheDocument();
    await next();
    await next();
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => expect(fileDeclaration).toHaveBeenCalledTimes(1));
    expect(fileDeclaration.mock.calls[0][0]).toMatchObject({
      withMedical: true,
      evidencePath: "declarations/8f2a/c41b.pdf",
    });
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
