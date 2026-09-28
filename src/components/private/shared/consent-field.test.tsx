import { Form } from "@/components/ui/form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { ConsentField } from "./consent-field";

type Values = { consent?: boolean };

function Harness({ initial, onChange }: { initial?: boolean; onChange?: (value: boolean | undefined) => void }) {
  const form = useForm<Values>({ defaultValues: { consent: initial } });
  const value = form.watch("consent");
  onChange?.(value);

  return (
    <Form {...form}>
      <ConsentField control={form.control} name="consent" icon={MessageCircle} title="Communication Consent" note="A note">
        Include this number.
      </ConsentField>
    </Form>
  );
}

describe("ConsentField", () => {
  it("renders the title, text and note, with nothing selected when unanswered", () => {
    render(<Harness />);

    expect(screen.getByRole("radiogroup", { name: "Communication Consent" })).toBeInTheDocument();
    expect(screen.getByText("Include this number.")).toBeInTheDocument();
    expect(screen.getByText("A note")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yes" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).not.toBeChecked();
  });

  it.each([
    [true, "Yes"],
    [false, "No"],
  ])("shows a stored %s as %s", (initial, label) => {
    render(<Harness initial={initial} />);

    expect(screen.getByRole("radio", { name: label })).toBeChecked();
  });

  it("writes a boolean back to the form", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "No" }));
    expect(onChange).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole("radio", { name: "Yes" }));
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});
