import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePassTypeStore } from "@/zustand-store";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

// The same store outputs residency-status.tsx writes for a New enrolee, flattened so each pass is
// one choice. Only the pass store changes — the draft (and anything already uploaded) is untouched.
export const RESIDENCY_CHOICES = [
  { label: "Needs a new Student's Pass", stpApplicationType: "New Student Pass Application", passType: "" },
  { label: "Student's Pass transfer", stpApplicationType: "Student Pass Transfer Application", passType: "" },
  { label: "Long Term Visit Pass", stpApplicationType: "", passType: "Long Term Visit Pass" },
  { label: "Dependent Pass", stpApplicationType: "", passType: "Dependent Pass" },
  { label: "Singaporean", stpApplicationType: "", passType: "Singaporean" },
  { label: "Singapore PR", stpApplicationType: "", passType: "Singapore PR" },
] as const;

export default function ResidencyStatusPopover() {
  const [open, setOpen] = useState(false);
  const passType = usePassTypeStore((state) => state.passType);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const setPassType = usePassTypeStore((state) => state.setPassType);
  const setStpApplicationType = usePassTypeStore((state) => state.setStpApplicationType);

  const current = RESIDENCY_CHOICES.find(
    (choice) => choice.passType === passType && choice.stpApplicationType === stpApplicationType,
  );

  function select(choice: (typeof RESIDENCY_CHOICES)[number]) {
    setStpApplicationType(choice.stpApplicationType);
    setPassType(choice.passType);
    setOpen(false);
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <span className="text-muted-foreground">Residency status:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1 font-semibold">
            {current?.label ?? "Not set"}
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-64 p-1">
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Changing this keeps everything you've filled in so far.
          </p>
          <div role="listbox" aria-label="Residency status">
            {RESIDENCY_CHOICES.map((choice) => {
              const selected = choice === current;
              return (
                <button
                  key={choice.label}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => select(choice)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    selected && "font-semibold text-primary",
                  )}>
                  {choice.label}
                  {selected && <Check className="size-4" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
