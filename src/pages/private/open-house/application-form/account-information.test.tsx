/**
 * Phase 17 — Open House, Account Info tab (`registrationSchema`). Unique to this flow — no
 * old/current counterpart.
 *
 * Security fix: `password`/`confirmPassword` used to be written into `useOpenHouseStore`, which
 * is persisted to sessionStorage in plaintext (`zustand-store.ts`, `persist` + `createJSONStorage`
 * with no `partialize`), and that store is read at final submission (`open-house-layout.tsx`) to
 * call `supabase.auth.signUp`. Fixed by keeping the password fields only in a separate,
 * non-persisted `useOpenHouseCredentialsStore`.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import AccountInformation from "./account-information";
import { renderForm, resetEnrolmentStores, seedFormState } from "@/test/render-form";
import { useOpenHouseCredentialsStore, useOpenHouseStore } from "@/zustand-store";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return { ...actual, checkEmailExists: vi.fn().mockResolvedValue({ exists: false, emailConfirmed: false }) };
});

beforeEach(() => {
  resetEnrolmentStores();
  vi.clearAllMocks();
});

describe("account-information.tsx", () => {
  it("renders seeded values on initial mount", () => {
    seedFormState("open-house", {
      accountInfo: { firstName: "Jane", lastName: "Doe", email: "jane@example.com", relationship: "mother" },
    });

    renderForm(<AccountInformation />, { flow: "open-house" });

    expect(screen.getByPlaceholderText("John")).toHaveValue("Jane");
  });

  it("does not write to the store on mount (wasDirty gate)", async () => {
    seedFormState("open-house", {
      accountInfo: { firstName: "Jane", lastName: "Doe", email: "jane@example.com", relationship: "mother" },
    });
    const setFormStateSpy = vi.spyOn(useOpenHouseStore.getState(), "setFormState");

    renderForm(<AccountInformation />, { flow: "open-house" });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(setFormStateSpy).not.toHaveBeenCalled();
  });

  it("never writes the password to the persisted (sessionStorage-backed) store while typing (fixed: plaintext password exposure)", async () => {
    seedFormState("open-house", {});

    const user = userEvent.setup();
    renderForm(<AccountInformation />, { flow: "open-house" });

    const [passwordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "SuperSecret123");

    // Wait for the actual side effect the debounce is expected to produce (password landing in
    // the credentials store) instead of a fixed sleep — deterministic regardless of system load,
    // and doesn't eat a flat 250ms when the debounce settles sooner.
    await waitFor(() => {
      expect(useOpenHouseCredentialsStore.getState().password).toBe("SuperSecret123");
    });

    expect(useOpenHouseStore.getState().formState.accountInfo).not.toHaveProperty("password");
    expect(JSON.stringify(useOpenHouseStore.getState().formState)).not.toContain("SuperSecret123");
  });

  it("keeps the password in the separate, non-persisted credentials store while typing", async () => {
    seedFormState("open-house", {});

    const user = userEvent.setup();
    renderForm(<AccountInformation />, { flow: "open-house" });

    const [passwordInput, confirmPasswordInput] = screen.getAllByPlaceholderText("••••••••");
    await user.type(passwordInput, "SuperSecret123");
    // Wait for the debounced sync to actually land before typing into the next field — its
    // `form.reset()` call (part of the wasDirty gate) can otherwise interrupt fast typing across
    // fields. Polling the real condition instead of a fixed sleep removes the race entirely.
    await waitFor(() => {
      expect(useOpenHouseCredentialsStore.getState().password).toBe("SuperSecret123");
    });
    await user.type(confirmPasswordInput, "SuperSecret123");

    await waitFor(() => {
      expect(useOpenHouseCredentialsStore.getState().confirmPassword).toBe("SuperSecret123");
    });
  });

  it(
    "does not persist the password to the store after a successful submit either",
    async () => {
      seedFormState("open-house", {});

      const user = userEvent.setup();
      renderForm(<AccountInformation />, { flow: "open-house" });

      await user.type(screen.getByPlaceholderText("John"), "Jane");
      await user.type(screen.getByPlaceholderText("Doe"), "Doe");
      await user.type(screen.getByPlaceholderText("john.doe@example.com"), "jane@example.com");
      const [passwordInput, confirmPasswordInput] = screen.getAllByPlaceholderText("••••••••");
      await user.type(passwordInput, "SuperSecret123");
      // Wait for the debounced sync to actually land before typing into the next field — see the
      // "keeps the password in the separate store" test above for why this must be
      // condition-based rather than a fixed sleep.
      await waitFor(() => {
        expect(useOpenHouseCredentialsStore.getState().password).toBe("SuperSecret123");
      });
      await user.type(confirmPasswordInput, "SuperSecret123");
      await waitFor(() => {
        expect(useOpenHouseCredentialsStore.getState().confirmPassword).toBe("SuperSecret123");
      });

      await user.click(screen.getByRole("combobox", { name: /relationship to student/i }));
      await user.click(await screen.findByRole("option", { name: "Mother" }));

      const [submitButton] = screen.getAllByRole("button", { name: /save & proceed to next step/i });
      await user.click(submitButton);

      // Wait for the submit handler's own async chain (checkEmailExists → setFormState →
      // setCredentials → navigate → toast) to actually finish instead of guessing a fixed delay.
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });

      expect(JSON.stringify(useOpenHouseStore.getState().formState)).not.toContain("SuperSecret123");
      expect(useOpenHouseCredentialsStore.getState().password).toBe("SuperSecret123");
    },
    // This test drives 51 keystrokes across 5 fields plus a Radix Select interaction and a full
    // submit — under this repo's heavy parallel test-file execution that occasionally exceeds
    // Vitest's default 5000ms budget purely from CPU contention, not from any logic issue (the
    // waitFor()s above already make it resolve as fast as the system allows). Give it headroom.
    15000,
  );
});
