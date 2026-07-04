/**
 * Render smoke test for the Admission Guidelines page, added alongside the design-system
 * alignment pass (colors/shadows/typography/radius restyle — see project design system memory).
 * The restyle touched every section's className but no logic; this guards that the two top-level
 * tabs, the nested document-requirements/processing-timeline tabs, and the FAQ accordion still
 * mount and respond to interaction after the rewrite.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import AdmissionGuidelines from "./admission-guidelines";

describe("AdmissionGuidelines", () => {
  it("renders the General Requirements tab by default", () => {
    render(<AdmissionGuidelines />);

    expect(screen.getByRole("heading", { name: "Admission Requirements", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/HFSE mission, vision and virtues/)).toBeInTheDocument();
    expect(screen.getByText("Education Level Requirements")).toBeInTheDocument();
  });

  it("switches to the Student Pass tab and shows its content", async () => {
    const user = userEvent.setup();
    render(<AdmissionGuidelines />);

    await user.click(screen.getByRole("tab", { name: /Student Pass/ }));

    expect(screen.getByText("Who This Applies To")).toBeInTheDocument();
    expect(screen.getByText("Vaccination Requirements")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Processing Timeline" })).toBeInTheDocument();
  });

  it("switches the nested Required Documents tabs", async () => {
    const user = userEvent.setup();
    render(<AdmissionGuidelines />);
    await user.click(screen.getByRole("tab", { name: /Student Pass/ }));

    expect(screen.getByText("Travel Documents")).toBeInTheDocument();

    // "Required Documents" and "Processing Timeline" both render New/Renewal/Transfer tabs —
    // scope to the documents section so the click lands on the right pair.
    const docsSection = screen.getByText("Required Documents").closest("section");
    expect(docsSection).not.toBeNull();
    const docsScope = within(docsSection as HTMLElement);

    await user.click(docsScope.getByRole("tab", { name: "Renewal" }));
    expect(screen.getByText("Current ID")).toBeInTheDocument();

    await user.click(docsScope.getByRole("tab", { name: "Transfer" }));
    expect(screen.getByText("Withdrawal Clearance")).toBeInTheDocument();
  });

  it("expands an FAQ accordion item", async () => {
    const user = userEvent.setup();
    render(<AdmissionGuidelines />);
    await user.click(screen.getByRole("tab", { name: /Student Pass/ }));

    const question = screen.getByText("Can the school guarantee Student’s Pass approval?");
    await user.click(question);

    const faqSection = question.closest("section");
    expect(faqSection).not.toBeNull();
    expect(within(faqSection as HTMLElement).getByText(/Immigration & Checkpoints Authority/)).toBeInTheDocument();
  });

  it("links the Contact Admissions button to the admissions phone number", async () => {
    const user = userEvent.setup();
    render(<AdmissionGuidelines />);
    await user.click(screen.getByRole("tab", { name: /Student Pass/ }));

    const link = screen.getByRole("link", { name: /Contact Admissions/ });
    expect(link).toHaveAttribute("href", "tel:+65 8200 0062");
  });
});
