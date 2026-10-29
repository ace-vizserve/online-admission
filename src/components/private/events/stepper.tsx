import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Fragment } from "react";

export type StepperItem = { key: string; label: string; hint: string };

/**
 * Where the parent is in the form. Finished steps can be clicked to go back to them; steps ahead
 * cannot, because Continue is what checks each step. On a phone only the current step keeps its words.
 */
export default function EventStepper({
  items,
  current,
  onSelect,
}: {
  items: StepperItem[];
  current: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol aria-label="Steps" className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 shadow-sm">
      {items.map((item, i) => {
        const done = i < current;
        const active = i === current;
        const content = (
          <>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs",
                done && "bg-emerald-500 text-white",
                active && "bg-primary font-black text-white shadow-md shadow-primary/20",
                !done && !active && "border bg-white font-bold text-muted-foreground",
              )}>
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("min-w-0 text-left leading-tight", !active && "hidden sm:block")}>
              <span className={cn("block truncate text-[13px] font-bold", done || active ? "text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
              <span className="block truncate text-[11px] text-muted-foreground">{item.hint}</span>
            </span>
          </>
        );

        return (
          <Fragment key={item.key}>
            {i > 0 && <li aria-hidden="true" className="h-px min-w-3 flex-1 bg-slate-200" />}
            <li aria-current={active ? "step" : undefined} className="flex min-w-0 items-center">
              {done ? (
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {content}
                </button>
              ) : (
                <span className="flex min-w-0 items-center gap-2.5">{content}</span>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
