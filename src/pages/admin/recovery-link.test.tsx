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

import { adminCheckRecovery, adminGenerateRecoveryLink } from "@/actions/admin";

import RecoveryLink from "./recovery-link";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/components/page-metadata", () => ({ default: () => null }));
vi.mock("@/hooks/use-session", () => ({
  default: () => ({ session: { access_token: "admin-token", user: { email: "admin@example.com" } } }),
}));
vi.mock("@/actions/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/actions/admin")>();
  return { ...actual, adminCheckRecovery: vi.fn(), adminGenerateRecoveryLink: vi.fn() };
});

const mockCheck = vi.mocked(adminCheckRecovery);
const mockGenerate = vi.mocked(adminGenerateRecoveryLink);

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
});
