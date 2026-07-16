/**
 * Page-level coverage for /admin/recovery-link. Focused on the recipient-email behavior added
 * for auto-sending the recovery link: prefill from `knownEmails`, validation gating the
 * "Generate & send" button, and the success/failure email-status rendering — the rest of the
 * page (table badges, section checkboxes) was already covered when originally built.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminCheckRecovery, adminGenerateRecoveryLink, adminListRecoveryLinks } from "@/actions/admin";

import RecoveryLink from "./recovery-link";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/components/page-metadata", () => ({ default: () => null }));
vi.mock("@/hooks/use-session", () => ({
  default: () => ({ session: { access_token: "admin-token", user: { email: "admin@example.com" } } }),
}));
vi.mock("@/actions/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/actions/admin")>();
  return {
    ...actual,
    adminCheckRecovery: vi.fn(),
    adminGenerateRecoveryLink: vi.fn(),
    adminListRecoveryLinks: vi.fn(),
  };
});

const mockCheck = vi.mocked(adminCheckRecovery);
const mockGenerate = vi.mocked(adminGenerateRecoveryLink);
const mockList = vi.mocked(adminListRecoveryLinks);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecoveryLink />
    </QueryClientProvider>,
  );
}

const incompleteResult = {
  academicYear: "ay2027",
  enroleeNumber: "E270003",
  studentNumber: "H270003",
  category: "New",
  studentName: "DOE, JANE",
  present: { applications: false, documents: true, status: true },
  applicationsIncomplete: false,
  missing: ["applications"],
  suggestedSections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"] as (
    | "studentInfo"
    | "familyInfo"
    | "enrollmentInfo"
    | "uploads"
  )[],
  knownEmails: null,
};

async function runCheck(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("E270003"), "E270003");
  await user.click(screen.getByRole("button", { name: /check record/i }));
  await waitFor(() => expect(screen.getByText("Incomplete record")).toBeInTheDocument());
}

beforeEach(() => {
  vi.resetAllMocks();
  mockList.mockResolvedValue([]);
});

describe("recovery-link.tsx", () => {
  it("disables Generate & send until a valid recipient email is entered", async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(incompleteResult);
    renderPage();

    await runCheck(user);

    expect(screen.getByRole("button", { name: /generate & send/i })).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/mother@example.com/i), "not-an-email");
    expect(screen.getByRole("button", { name: /generate & send/i })).toBeDisabled();
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText(/mother@example.com/i));
    await user.type(screen.getByPlaceholderText(/mother@example.com/i), "parent@example.com");
    expect(screen.getByRole("button", { name: /generate & send/i })).not.toBeDisabled();
  });

  it("prefills the recipient field from knownEmails when present on the applications row", async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue({ ...incompleteResult, knownEmails: "mother@example.com, father@example.com" });
    renderPage();

    await runCheck(user);

    expect(screen.getByDisplayValue("mother@example.com, father@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate & send/i })).not.toBeDisabled();
  });

  it("sends recipientEmails and shows the emailed confirmation on success", async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(incompleteResult);
    mockGenerate.mockResolvedValue({
      token: "t",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/t",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: true,
    });
    renderPage();

    await runCheck(user);
    await user.type(screen.getByPlaceholderText(/mother@example.com/i), "parent@example.com");
    await user.click(screen.getByRole("button", { name: /generate & send/i }));

    await waitFor(() => expect(screen.getByText(/link ready and emailed/i)).toBeInTheDocument());
    expect(screen.getByText(/emailed to parent@example.com/i)).toBeInTheDocument();
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enroleeNumber: "E270003", recipientEmails: "parent@example.com" }),
    );
  });

  it("shows the link was created but the email failed to send, without blocking the link", async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(incompleteResult);
    mockGenerate.mockResolvedValue({
      token: "t",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/t",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: false,
      emailError: "Resend API returned 422: invalid recipient",
    });
    renderPage();

    await runCheck(user);
    await user.type(screen.getByPlaceholderText(/mother@example.com/i), "parent@example.com");
    await user.click(screen.getByRole("button", { name: /generate & send/i }));

    await waitFor(() => expect(screen.getByText(/email not sent/i)).toBeInTheDocument());
    expect(screen.getByText(/Resend API returned 422/i)).toBeInTheDocument();
    expect(screen.getByText("https://enrol.hfse.edu.sg/complete-enrolment/t")).toBeInTheDocument();
  });

  it("shows the correct status for completed, pending, and expired links", async () => {
    const now = Date.now();
    mockList.mockResolvedValue([
      {
        token: "completed",
        url: "https://enrol.hfse.edu.sg/complete-enrolment/completed",
        academic_year: "ay2027",
        enrolee_number: "E270001",
        student_name: "DOE, JANE",
        category: "New",
        created_by: "admin@example.com",
        created_at: new Date(now - 1000).toISOString(),
        expires_at: new Date(now + 7 * 86400000).toISOString(),
        used_at: new Date(now).toISOString(),
        notified_email: "jane.parent@example.com",
        notified_at: new Date(now - 1000).toISOString(),
      },
      {
        token: "pending",
        url: "https://enrol.hfse.edu.sg/complete-enrolment/pending",
        academic_year: "ay2027",
        enrolee_number: "E270002",
        student_name: null,
        category: "New",
        created_by: "admin@example.com",
        created_at: new Date(now - 1000).toISOString(),
        expires_at: new Date(now + 7 * 86400000).toISOString(),
        used_at: null,
        notified_email: null,
        notified_at: null,
      },
      {
        token: "expired",
        url: "https://enrol.hfse.edu.sg/complete-enrolment/expired",
        academic_year: "ay2026",
        enrolee_number: "E260099",
        student_name: "SMITH, JOHN",
        category: "Current",
        created_by: "admin@example.com",
        created_at: new Date(now - 10 * 86400000).toISOString(),
        expires_at: new Date(now - 3 * 86400000).toISOString(),
        used_at: null,
        notified_email: "john.parent@example.com",
        notified_at: new Date(now - 10 * 86400000).toISOString(),
      },
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByText("Recent links")).toBeInTheDocument());
    expect(screen.getByText("DOE, JANE")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    // No student_name on the pending row — falls back to the enrolee number.
    expect(screen.getByText("E270002")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("SMITH, JOHN")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Not emailed")).toBeInTheDocument();
    expect(screen.getByText(/Sent to jane\.parent@example\.com/)).toBeInTheDocument();
  });

  it("refetches the recent links list after a successful generate", async () => {
    const user = userEvent.setup();
    mockCheck.mockResolvedValue(incompleteResult);
    mockGenerate.mockResolvedValue({
      token: "t",
      url: "https://enrol.hfse.edu.sg/complete-enrolment/t",
      missing: ["applications"],
      sections: ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"],
      studentName: "DOE, JANE",
      category: "New",
      emailSent: true,
    });
    renderPage();

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));

    await runCheck(user);
    await user.type(screen.getByPlaceholderText(/mother@example.com/i), "parent@example.com");
    await user.click(screen.getByRole("button", { name: /generate & send/i }));

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });
});
