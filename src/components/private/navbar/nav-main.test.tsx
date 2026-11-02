/**
 * Behaviour tests for NavMain's collapsible groups.
 *
 * Services is a section rather than a single destination, so its group folds. It starts open.
 */
import { SidebarProvider } from "@/components/ui/sidebar";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { NavMain } from "./nav-main";

const SERVICES = {
  label: "Services",
  collapsible: true,
  items: [{ title: "Absence & Travel", url: "/admission/services/declarations" }],
};

const ENROLMENT = {
  label: "Enrolment",
  items: [{ title: "Saved Drafts", url: "/admission/drafts" }],
};

function renderNav(groups: Array<Record<string, unknown>>, at = "/admission/dashboard") {
  return render(
    <MemoryRouter initialEntries={[at]}>
      <SidebarProvider>
        <NavMain groups={groups as never} />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("NavMain — collapsible groups", () => {
  it("shows a collapsible group's items from the start", () => {
    renderNav([SERVICES]);

    expect(screen.getByRole("button", { name: /Services/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Absence & Travel/ })).toHaveAttribute(
      "href",
      "/admission/services/declarations",
    );
  });

  it("folds the group when clicked", async () => {
    renderNav([SERVICES]);

    await userEvent.click(screen.getByRole("button", { name: /Services/ }));

    expect(screen.queryByRole("link", { name: /Absence & Travel/ })).not.toBeInTheDocument();
  });

  it("opens the group again on a second click", async () => {
    renderNav([SERVICES]);
    const toggle = screen.getByRole("button", { name: /Services/ });

    await userEvent.click(toggle);
    await userEvent.click(toggle);

    expect(screen.getByRole("link", { name: /Absence & Travel/ })).toBeInTheDocument();
  });

  it("leaves non-collapsible groups expanded with no toggle, as before", () => {
    renderNav([ENROLMENT]);

    expect(screen.getByRole("link", { name: /Saved Drafts/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enrolment/ })).not.toBeInTheDocument();
  });
});
