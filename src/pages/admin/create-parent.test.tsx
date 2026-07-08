/**
 * Page-level coverage for /admin/create-parent. The important behavior is the idempotency UX:
 * a duplicate email must NOT toast a bare error — it renders the existing account's details
 * (name, email, relationship, verified state, sign-in dates) so the admin can act on them.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExistingParentAccountError, adminCreateParentAccount } from "@/actions/admin";

import CreateParent from "./create-parent";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/components/page-metadata", () => ({ default: () => null }));
vi.mock("@/hooks/use-session", () => ({
  default: () => ({ session: { access_token: "admin-token", user: { email: "admin@example.com" } } }),
}));
vi.mock("@/actions/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/actions/admin")>();
  return { ...actual, adminCreateParentAccount: vi.fn() };
});

const mockCreate = vi.mocked(adminCreateParentAccount);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateParent />
    </QueryClientProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("John"), "jane");
  await user.type(screen.getByPlaceholderText("Doe"), "doe");
  await user.click(screen.getByRole("combobox", { name: /relationship to student/i }));
  await user.click(await screen.findByRole("option", { name: "Mother" }));
  await user.type(screen.getByPlaceholderText("john.doe@example.com"), "Jane.Doe@Example.com");
  const [password, confirmPassword] = screen.getAllByPlaceholderText("••••••••");
  await user.type(password, "SuperSecret123");
  await user.type(confirmPassword, "SuperSecret123");
}

beforeEach(() => {
  // resetAllMocks (not clearAllMocks) so a leftover implementation — e.g. the pending test's
  // never-resolving promise — can't leak into the next test.
  vi.resetAllMocks();
});

describe("create-parent.tsx", () => {
  it("renders the form", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /create parent account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("blocks an empty submit with validation errors and never calls the action", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it(
    "submits capitalized values and shows the created-account confirmation",
    async () => {
      mockCreate.mockResolvedValue({ email: "jane.doe@example.com", fullName: "Doe, Jane", relationship: "mother" });
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({ access_token: "admin-token" }),
          expect.objectContaining({
            firstName: "Jane",
            lastName: "Doe",
            relationship: "mother",
            email: "Jane.Doe@Example.com",
            password: "SuperSecret123",
          }),
        );
      });

      expect(await screen.findByText("Account created")).toBeInTheDocument();
      expect(screen.getByText("Doe, Jane")).toBeInTheDocument();
      expect(screen.getByText("jane.doe@example.com")).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalled();
    },
    15000,
  );

  it(
    "renders the existing-account details card on a duplicate email instead of a toast",
    async () => {
      mockCreate.mockRejectedValue(
        new ExistingParentAccountError("An account with this email already exists", {
          email: "jane.doe@example.com",
          fullName: "Doe, Jane",
          relationship: "father",
          emailConfirmed: false,
          lastSignInAt: null,
          createdAt: "2026-01-15T00:00:00.000Z",
        }),
      );
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      const heading = await screen.findByText("An account with this email already exists");
      // Scope to the card — the Radix Select also renders a "Father" option elsewhere in the DOM
      const card = heading.closest(".rounded-xl") as HTMLElement;
      expect(within(card).getByText("Doe, Jane")).toBeInTheDocument();
      expect(within(card).getByText("jane.doe@example.com")).toBeInTheDocument();
      expect(within(card).getByText("Father")).toBeInTheDocument();
      expect(within(card).getByText("Unverified")).toBeInTheDocument();
      expect(within(card).getByText("Never")).toBeInTheDocument();
      expect(toast.error).not.toHaveBeenCalled();
    },
    15000,
  );

  it(
    "renders sensible fallbacks when the existing account has sparse metadata",
    async () => {
      mockCreate.mockRejectedValue(
        new ExistingParentAccountError("An account with this email already exists", {
          email: "jane.doe@example.com",
          fullName: "",
          relationship: "",
          emailConfirmed: true,
          lastSignInAt: "2026-07-01T00:00:00.000Z",
          createdAt: null,
        }),
      );
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      const heading = await screen.findByText("An account with this email already exists");
      const card = heading.closest(".rounded-xl") as HTMLElement;
      expect(within(card).getAllByText("—")).toHaveLength(2); // fullName + created-date fallbacks
      expect(within(card).queryByText("Unverified")).not.toBeInTheDocument();
      expect(within(card).queryByText("Never")).not.toBeInTheDocument();
    },
    15000,
  );

  it(
    "shows the pending label while the request is in flight",
    async () => {
      mockCreate.mockReturnValue(new Promise(() => {})); // never resolves
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      expect(await screen.findByText("Creating…")).toBeInTheDocument();
    },
    15000,
  );

  it(
    "renders an unrecognized relationship verbatim in the created card",
    async () => {
      // Server metadata is not guaranteed to be mother/father (e.g. legacy rows)
      mockCreate.mockResolvedValue({ email: "a@example.com", fullName: "Doe, Jane", relationship: "parent" });
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      const createdHeading = await screen.findByText("Account created");
      expect(within(createdHeading.closest(".rounded-xl") as HTMLElement).getByText("parent")).toBeInTheDocument();
    },
    15000,
  );

  it(
    "renders an unrecognized relationship verbatim in the existing-account card",
    async () => {
      mockCreate.mockRejectedValue(
        new ExistingParentAccountError("An account with this email already exists", {
          email: "a@example.com",
          fullName: "Doe, Jane",
          relationship: "aunt",
          emailConfirmed: true,
          lastSignInAt: null,
          createdAt: null,
        }),
      );
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      const existingHeading = await screen.findByText("An account with this email already exists");
      expect(within(existingHeading.closest(".rounded-xl") as HTMLElement).getByText("aunt")).toBeInTheDocument();
    },
    15000,
  );

  it(
    "toasts other errors without rendering any card",
    async () => {
      mockCreate.mockRejectedValue(new Error("Forbidden"));
      const user = userEvent.setup();
      renderPage();

      await fillValidForm(user);
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Forbidden");
      });
      expect(screen.queryByText("Account created")).not.toBeInTheDocument();
      expect(screen.queryByText("An account with this email already exists")).not.toBeInTheDocument();
    },
    15000,
  );
});
