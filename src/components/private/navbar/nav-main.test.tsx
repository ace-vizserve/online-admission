/**
 * Behaviour tests for NavMain's collapsible groups.
 *
 * Services is a section rather than a single destination, so its group folds. The rule that
 * matters is the auto-open one: a parent who deep-links to a Services page must not land with
 * their own location hidden inside a closed drawer.
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
  it("hides a collapsible group's items until it is opened", () => {
    renderNav([SERVICES]);

    expect(screen.getByRole("button", { name: /Services/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Absence & Travel/ })).not.toBeInTheDocument();
  });

  it("reveals the items when the group is clicked", async () => {
    renderNav([SERVICES]);

    await userEvent.click(screen.getByRole("button", { name: /Services/ }));

    expect(screen.getByRole("link", { name: /Absence & Travel/ })).toHaveAttribute(
      "href",
      "/admission/services/declarations",
    );
  });

  it("folds the group again on a second click", async () => {
    renderNav([SERVICES]);
    const toggle = screen.getByRole("button", { name: /Services/ });

    await userEvent.click(toggle);
    await userEvent.click(toggle);

    expect(screen.queryByRole("link", { name: /Absence & Travel/ })).not.toBeInTheDocument();
  });

  it("starts open when the current route is inside the group", () => {
    renderNav([SERVICES], "/admission/services/declarations");

    expect(screen.getByRole("link", { name: /Absence & Travel/ })).toBeInTheDocument();
  });

  it("leaves non-collapsible groups expanded with no toggle, as before", () => {
    renderNav([ENROLMENT]);

    expect(screen.getByRole("link", { name: /Saved Drafts/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enrolment/ })).not.toBeInTheDocument();
  });
});
