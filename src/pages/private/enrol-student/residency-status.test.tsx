/**
 * Behavior tests for StudentResidencyPage, added alongside the design-system alignment pass (see
 * project design system memory). Real logic worth locking down: `isEligible` restricting which
 * cards a `Current` enrolee may pick based on their pass on file, `needsPassChoice`/
 * `disableContinue` gating the Continue button for `New` enrolees on the pass-requiring cards,
 * and `redirect()`'s branches (open-house / Current / New).
 *
 * This page imports from `react-router` (not `react-router-dom`, unlike stp-guidelines.tsx) —
 * `useNavigate` is partial-mocked the same way. `useLocation().state` is set via `MemoryRouter`'s
 * object-form `initialEntries`. The pass-choice Select is driven via the store directly (its
 * `onValueChange` wires straight to `setPassType`, so this exercises the same reactive read the
 * component uses) rather than through the Radix Select's portal UI.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnrolmentStores } from "@/test/render-form";
import { usePassTypeStore, useSelectAcademicYear } from "@/zustand-store";

import StudentResidencyPage from "./residency-status";

const navigateMock = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage(state: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/enrol-student/residency-status", state }]}>
      <StudentResidencyPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetEnrolmentStores();
  navigateMock.mockReset();
});

describe("StudentResidencyPage", () => {
  it("restricts a Current enrolee with a valid Student Pass to the STP and New cards", () => {
    renderPage({ enroleeType: "Current", enroleeNumber: "E1", currentPass: "Student Pass" });

    expect(screen.getByRole("radio", { name: /Valid Student's Pass/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("radio", { name: /Needs NEW Student's Pass/ })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("radio", { name: /Non-Student Pass Application/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("radio", { name: /Singapore Citizen or PR/ })).toHaveAttribute("aria-disabled", "true");
    // "STP Transfer from Another PEI" only renders for New enrolees, so it isn't in the DOM at all.
    expect(screen.queryByRole("radio", { name: /STP Transfer/ })).not.toBeInTheDocument();
  });

  it("keeps Continue disabled for a New enrolee until a pass type is chosen on a pass-requiring card", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "New", enroleeNumber: "E2" });

    const continueButton = screen.getByRole("button", { name: /Continue to Application/ });
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: /Singapore Citizen or PR/ }));
    expect(continueButton).toBeDisabled();

    // Simulate the parent picking a value in the pass-type Select — its onValueChange wires
    // directly to this store action, so setting it here exercises the same reactive read.
    act(() => {
      usePassTypeStore.getState().setPassType("Singaporean");
    });
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(navigateMock).toHaveBeenCalledWith("/enrol-student/stp-guidelines", {
      state: { enroleeNumber: "E2", enroleeType: "New", isSTP: false },
    });
  });

  it("redirects a New enrolee choosing a plain card straight to STP guidelines with isSTP true", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "New", enroleeNumber: "E3" });

    await user.click(screen.getByRole("radio", { name: /Needs NEW Student's Pass/ }));
    const continueButton = screen.getByRole("button", { name: /Continue to Application/ });
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(navigateMock).toHaveBeenCalledWith("/enrol-student/stp-guidelines", {
      state: { enroleeNumber: "E3", enroleeType: "New", isSTP: true },
    });
  });

  it("redirects a Current enrolee to their own student-info path", async () => {
    useSelectAcademicYear.getState().setAcademicYear("2026-2027");
    const user = userEvent.setup();
    renderPage({ enroleeType: "Current", enroleeNumber: "E4", currentPass: "Student Pass" });

    await user.click(screen.getByRole("radio", { name: /Valid Student's Pass/ }));
    await user.click(screen.getByRole("button", { name: /Continue to Application/ }));

    expect(navigateMock).toHaveBeenCalledWith("/enrol-student/E4/student-info?academicYear=2026-2027");
  });

  it("redirects open house registrants to the open-house STP guidelines regardless of pass choice", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "New", enroleeNumber: "E5", isOpenHouseRegistration: true });

    await user.click(screen.getByRole("radio", { name: /Needs NEW Student's Pass/ }));
    await user.click(screen.getByRole("button", { name: /Continue to Application/ }));

    expect(navigateMock).toHaveBeenCalledWith("/open-house/stp-guidelines", {
      state: { enroleeType: "New", isOpenHouseRegistration: true },
    });
  });

  it("shows a read-only pass-on-file box and enables Continue immediately for a Current enrolee with a pass", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "Current", enroleeNumber: "E6", currentPass: "Student Pass" });

    await user.click(screen.getByRole("radio", { name: /Valid Student's Pass/ }));

    expect(screen.getByRole("button", { name: /Continue to Application/ })).toBeEnabled();
    // No Select is rendered for this card ("stp" has no passOptions), confirming no dropdown path.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("requires an explicit pass choice for a Current enrolee with no pass on file", async () => {
    const user = userEvent.setup();
    renderPage({ enroleeType: "Current", enroleeNumber: "E7", currentPass: "" });

    // With no pass on file, every is* check is false, so isEligible falls through to true —
    // all rendered cards remain selectable.
    await user.click(screen.getByRole("radio", { name: /Singapore Citizen or PR/ }));

    // The dropdown (not the read-only "pass on file" box) should render for this enrolee.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.queryByText(/Using the pass on file/)).not.toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: /Continue to Application/ });
    expect(continueButton).toBeDisabled();

    act(() => {
      usePassTypeStore.getState().setPassType("Singaporean");
    });
    expect(continueButton).toBeEnabled();
  });
});
