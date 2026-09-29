import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePassTypeStore } from "@/zustand-store";
import { Check, IdCard, Pencil } from "lucide-react";
import { useState } from "react";

// The same store outputs residency-status.tsx writes for a New enrolee, flattened so each pass is
// one choice. Only the pass store changes — the draft (and anything already uploaded) is untouched.
export const RESIDENCY_CHOICES = [
  { label: "Needs a new Student's Pass", stpApplicationType: "New Student Pass Application", passType: "" },
  { label: "Student's Pass transfer", stpApplicationType: "Student Pass Transfer Application", passType: "Student Pass" },
  { label: "Long Term Visit Pass", stpApplicationType: "", passType: "Long Term Visit Pass" },
  { label: "Dependent Pass", stpApplicationType: "", passType: "Dependent Pass" },
  { label: "Singaporean", stpApplicationType: "", passType: "Singaporean" },
  { label: "Singapore PR", stpApplicationType: "", passType: "Singapore PR" },
] as const;

type Props = {
  /** Optional control, so the pass-type mismatch toast can open it directly. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ResidencyStatusPopover({ open: controlledOpen, onOpenChange }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const passType = usePassTypeStore((state) => state.passType);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const setPassType = usePassTypeStore((state) => state.setPassType);
  const setStpApplicationType = usePassTypeStore((state) => state.setStpApplicationType);

  // An STP application type identifies the choice on its own: transfers saved before they carried
  // "Student Pass" have an empty pass type and must still show as a transfer.
  const current = RESIDENCY_CHOICES.find((choice) =>
    stpApplicationType
      ? choice.stpApplicationType === stpApplicationType
      : !choice.stpApplicationType && choice.passType === passType,
  );

  function select(choice: (typeof RESIDENCY_CHOICES)[number]) {
    setStpApplicationType(choice.stpApplicationType);
    setPassType(choice.passType);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "mx-auto flex w-full max-w-xl items-center gap-4 rounded-xl border-2 bg-card p-4 shadow-sm",
            current ? "border-border" : "border-destructive bg-destructive/5",
          )}>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              current ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
            )}>
            <IdCard className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Student's residency / pass
            </p>
            <p className={cn("font-semibold", current ? "text-foreground" : "text-destructive")}>
              {current?.label ?? "Not selected — please choose one"}
            </p>
            <p className="text-xs text-muted-foreground">Must match the pass you upload below.</p>
          </div>
          <PopoverTrigger asChild>
            <Button type="button" variant={current ? "outline" : "default"} size="sm" className="shrink-0 gap-1">
              <Pencil className="size-4" />
              {current ? "Change" : "Choose"}
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-64 p-1">
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
  );
}
