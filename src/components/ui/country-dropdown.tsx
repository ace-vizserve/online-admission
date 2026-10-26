import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import countriesData from "@/data/countries.json";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown, Globe } from "lucide-react";
import { useMemo, useState } from "react";

export type Country = {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  emoji: string;
};

/**
 * Sourced from the repo's own `src/data/countries.json` — the same list the enrolment forms use —
 * rather than a country package, and rendered with the emoji flag each entry already carries. That
 * keeps one country list in the app and adds no dependency for flag images.
 */
const COUNTRIES: Country[] = (countriesData as Country[])
  .filter((country) => country.name && country.emoji)
  .sort((a, b) => a.name.localeCompare(b.name));

type CountryDropdownProps = {
  /** The selected country's name — the value the SIS stores. */
  value?: string;
  onChange: (country: Country) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

/**
 * A searchable country picker.
 *
 * 250 countries is too many for a plain select, and a free-text box lets a parent type a spelling
 * the SIS will not match — so the list is the input, and `onChange` reports the canonical entry.
 */
export function CountryDropdown({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a country",
  id,
}: CountryDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => COUNTRIES.find((country) => country.name === value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        )}>
        {selected ? (
          <span className="flex w-0 flex-grow items-center gap-2 overflow-hidden">
            <span aria-hidden="true" className="text-base leading-none">
              {selected.emoji}
            </span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{selected.name}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Globe className="size-4" />
            {placeholder}
          </span>
        )}
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent collisionPadding={10} side="bottom" align="start" className="w-[--radix-popper-anchor-width] p-0">
        <Command className="max-h-[280px] w-full">
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => (
                <CommandItem
                  key={country.iso2}
                  // cmdk filters on this rather than on rendered children, so the flag emoji
                  // cannot pollute the search text.
                  value={country.name}
                  className="flex w-full items-center gap-2"
                  onSelect={() => {
                    onChange(country);
                    setOpen(false);
                  }}>
                  <span aria-hidden="true" className="text-base leading-none">
                    {country.emoji}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{country.name}</span>
                  <CheckIcon
                    className={cn("ml-auto size-4 shrink-0", country.name === selected?.name ? "opacity-100" : "opacity-0")}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
