import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

const OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

/**
 * A consent question answered with an explicit Yes/No. Replaces the old checkbox, where
 * "unticked" couldn't tell "No" apart from "never answered". Nothing is selected until the
 * parent picks one, and the schema rejects an unanswered consent.
 */
export function ConsentField<T extends FieldValues>({
  control,
  name,
  icon: Icon,
  title,
  children,
  note,
  className,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value === true ? "yes" : field.value === false ? "no" : "";

        return (
          <FormItem
            data-slot="consent-field"
            className={cn(
              "gap-4 rounded-xl border-2 p-6 transition-colors",
              value ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30",
              className,
            )}>
            <div className="space-y-1">
              <FormLabel className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Icon className="size-4 text-primary" />
                {title}
              </FormLabel>
              <p className="text-sm leading-relaxed text-foreground/80">{children}</p>
              {note && (
                <FormDescription className="text-xs font-semibold text-muted-foreground">{note}</FormDescription>
              )}
            </div>

            <FormControl>
              <RadioGroup
                aria-label={title}
                value={value}
                onValueChange={(next) => field.onChange(next === "yes")}
                onBlur={field.onBlur}
                className="grid grid-cols-2 gap-3">
                {OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm font-semibold transition-colors",
                      value === option.value ? "border-primary text-primary" : "border-border hover:bg-muted/50",
                    )}>
                    <RadioGroupItem value={option.value} aria-label={option.label} />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
