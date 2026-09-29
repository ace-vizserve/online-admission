import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { resetEnrolmentStores } from "@/test/render-form";
import { usePassTypeStore } from "@/zustand-store";

import ResidencyStatusPopover from "./residency-status-popover";

beforeEach(() => {
  resetEnrolmentStores();
});

describe("ResidencyStatusPopover", () => {
  it("shows 'Not set' when the store matches no choice", () => {
    render(<ResidencyStatusPopover />);
    expect(screen.getByRole("button", { name: /Not set/ })).toBeInTheDocument();
  });

  it("shows the current choice and marks it selected", async () => {
    const user = userEvent.setup();
    usePassTypeStore.getState().setPassType("Dependent Pass");
    render(<ResidencyStatusPopover />);

    await user.click(screen.getByRole("button", { name: /Dependent Pass/ }));
    expect(screen.getByRole("option", { name: /Dependent Pass/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Singaporean/ })).toHaveAttribute("aria-selected", "false");
  });

  it("switching from a pass to a new STP application updates both store fields and closes", async () => {
    const user = userEvent.setup();
    usePassTypeStore.getState().setPassType("Long Term Visit Pass");
    render(<ResidencyStatusPopover />);

    await user.click(screen.getByRole("button", { name: /Long Term Visit Pass/ }));
    await user.click(screen.getByRole("option", { name: /Needs a new Student's Pass/ }));

    expect(usePassTypeStore.getState()).toMatchObject({
      stpApplicationType: "New Student Pass Application",
      passType: "",
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Needs a new Student's Pass/ })).toBeInTheDocument();
  });

  it("switching from an STP application to a pass clears the STP type", async () => {
    const user = userEvent.setup();
    usePassTypeStore.getState().setStpApplicationType("Student Pass Transfer Application");
    render(<ResidencyStatusPopover />);

    await user.click(screen.getByRole("button", { name: /Student's Pass transfer/ }));
    await user.click(screen.getByRole("option", { name: /Singapore PR/ }));

    expect(usePassTypeStore.getState()).toMatchObject({ stpApplicationType: "", passType: "Singapore PR" });
  });
});
