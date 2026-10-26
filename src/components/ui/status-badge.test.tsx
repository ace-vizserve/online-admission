/**
 * The declaration statuses carry meaning in their colour: a parent scanning the list should see
 * at a glance which filings are settled and which are not. Without these cases they all fall
 * through to the neutral blue default, so "Not approved" would look the same as "Approved".
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusBadge, { type StatusProps } from "./status-badge";

function classesFor(status: StatusProps) {
  render(<StatusBadge status={status} />);
  return screen.getByText(status).className;
}

describe("StatusBadge — declaration statuses", () => {
  it("shows an approved declaration in the same green as other settled-good states", () => {
    expect(classesFor("Approved")).toMatch(/emerald/);
  });

  it("shows a declaration that was not approved in red, not the neutral default", () => {
    expect(classesFor("Not approved")).toMatch(/red/);
  });

  it("shows a declaration still with the school in amber, matching other in-progress states", () => {
    expect(classesFor("With the school")).toMatch(/amber/);
  });

  it("mutes a withdrawn declaration rather than colouring it like a decision", () => {
    expect(classesFor("Withdrawn")).toMatch(/muted|slate|gray/);
  });
});
