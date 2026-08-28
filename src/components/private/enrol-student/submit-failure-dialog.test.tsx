import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SubmitFailure } from "@/lib/submit-failure";

import { SubmitFailureDialog } from "./submit-failure-dialog";

const BLOCKED: SubmitFailure = {
  kind: "blocked",
  title: "Your application was not submitted",
  description: "We couldn't reach our servers. This often happens on work computers.",
};

describe("SubmitFailureDialog", () => {
  it("renders nothing while there is no failure", () => {
    render(<SubmitFailureDialog failure={null} onDismiss={vi.fn()} />);

    expect(screen.queryByText(/not submitted/i)).not.toBeInTheDocument();
  });

  it("states the failure and its guidance once one is reported", () => {
    render(<SubmitFailureDialog failure={BLOCKED} onDismiss={vi.fn()} />);

    expect(screen.getByText(BLOCKED.title)).toBeInTheDocument();
    expect(screen.getByText(BLOCKED.description)).toBeInTheDocument();
  });

  it("dismisses when the parent acknowledges it", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<SubmitFailureDialog failure={BLOCKED} onDismiss={onDismiss} />);
    await user.click(screen.getByRole("button", { name: /back to my application/i }));

    expect(onDismiss).toHaveBeenCalled();
  });

  // Radix closes an AlertDialog on Escape; the parent must land back on their form either way.
  it("dismisses when closed by the escape key", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<SubmitFailureDialog failure={BLOCKED} onDismiss={onDismiss} />);
    await user.keyboard("{Escape}");

    expect(onDismiss).toHaveBeenCalled();
  });
});
