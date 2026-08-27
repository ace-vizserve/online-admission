/**
 * A searchable country picker. 250 countries is far too many for a plain select, and a free-text
 * box lets a parent type something the SIS will not recognise — so the list is the input.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CountryDropdown } from "./country-dropdown";

describe("CountryDropdown", () => {
  it("prompts for a choice when nothing is selected", () => {
    render(<CountryDropdown onChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveTextContent(/select a country/i);
  });

  it("shows the chosen country, with its flag, once one is set", () => {
    render(<CountryDropdown value="Singapore" onChange={vi.fn()} />);

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Singapore");
    expect(trigger).toHaveTextContent("🇸🇬");
  });

  it("narrows the list as the parent types, so they need not scroll 250 countries", async () => {
    render(<CountryDropdown onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByPlaceholderText(/search country/i), "Malay", { delay: null });

    expect(await screen.findByRole("option", { name: /Malaysia/ })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /^Afghanistan/ })).not.toBeInTheDocument();
  });

  it("reports the country by the name the SIS stores", async () => {
    const onChange = vi.fn();
    render(<CountryDropdown onChange={onChange} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByPlaceholderText(/search country/i), "Malay", { delay: null });
    await userEvent.click(await screen.findByRole("option", { name: /Malaysia/ }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: "Malaysia", iso2: "MY" }));
  });

  it("says so when a search matches nothing, rather than showing an empty box", async () => {
    render(<CountryDropdown onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByPlaceholderText(/search country/i), "Zzzzz", { delay: null });

    expect(await screen.findByText(/no country found/i)).toBeInTheDocument();
  });
});
