/**
 * Coverage for the 3 new shared presentational components extracted from `single-documents.tsx`
 * and `old-family-info.tsx` in the Phase 3 consolidation — the underlying form/mutation logic in
 * those two files is unchanged (already covered by `reupload-portal.test.ts`'s
 * `updateEnrollmentApplicationDetails` re-throw tests), so this file's job is proving the NEW
 * shared chrome itself round-trips correctly.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cake } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { DataField } from "./data-field";
import { EditModeToggle } from "./edit-mode-toggle";
import { SectionHeader } from "./section-header";

vi.mock("sonner", () => ({ toast: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

describe("EditModeToggle", () => {
  it("shows Viewing Mode copy when editMode is false", () => {
    render(<EditModeToggle editMode={false} onEditModeChange={vi.fn()} />);
    expect(screen.getByText("Viewing Mode")).toBeInTheDocument();
    expect(screen.getByText("Switch to edit to update information.")).toBeInTheDocument();
  });

  it("shows Editing Mode copy when editMode is true", () => {
    render(<EditModeToggle editMode={true} onEditModeChange={vi.fn()} />);
    expect(screen.getByText("Editing Mode")).toBeInTheDocument();
    expect(screen.getByText("You can now modify student details.")).toBeInTheDocument();
  });

  it("calls onEditModeChange with the new value when toggled", async () => {
    const user = userEvent.setup();
    const onEditModeChange = vi.fn();
    render(<EditModeToggle editMode={false} onEditModeChange={onEditModeChange} />);

    await user.click(screen.getByRole("switch"));

    expect(onEditModeChange).toHaveBeenCalledWith(true);
  });
});

describe("SectionHeader", () => {
  it("renders the title and works without a color prop", () => {
    render(<SectionHeader title="Contact & Household" icon={<Cake />} />);
    expect(screen.getByText("Contact & Household")).toBeInTheDocument();
  });

  it("renders with a color prop", () => {
    render(<SectionHeader title="Father's Details" icon={<Cake />} color="text-blue-600" />);
    expect(screen.getByText("Father's Details")).toBeInTheDocument();
  });
});

describe("DataField", () => {
  it("renders the label and value", () => {
    render(<DataField label="Nationality" value="Singaporean" icon={<Cake className="" />} />);
    expect(screen.getByText("Nationality")).toBeInTheDocument();
    expect(screen.getByText("Singaporean")).toBeInTheDocument();
  });

  it("renders blank rather than throwing when value is null/undefined", () => {
    expect(() => render(<DataField label="Middle Name" value={null} icon={<Cake className="" />} />)).not.toThrow();
    expect(() =>
      render(<DataField label="Middle Name" value={undefined} icon={<Cake className="" />} />),
    ).not.toThrow();
  });
});
