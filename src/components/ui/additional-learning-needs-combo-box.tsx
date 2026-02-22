import { useId, useState } from "react";

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { EnrollmentInformationSchema } from "@/zod-schema";
import { UseFormReturn } from "react-hook-form";

const LEARNING_NEEDS = [
  {
    group: "Learning & Developmental",
    items: [
      "Dyslexia",
      "Dyscalculia",
      "Dysgraphia",
      "Autism Spectrum Disorder (ASD)",
      "Attention Deficit Hyperactivity Disorder (ADHD)",
      "Global Developmental Delay (GDD)",
      "Speech and Language Delay",
    ],
  },
  {
    group: "Behavioral",
    items: ["Behavioral Concerns (General)", "Oppositional Defiant Disorder (ODD)", "Anxiety Disorder"],
  },
  {
    group: "Other",
    items: ["Others (please specify)"],
  },
];

const OTHERS_VALUE = "Others (please specify)";

type Props = {
  form: UseFormReturn<EnrollmentInformationSchema>;
};

function AdditionalLearningNeedsComboBox({ form }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Drive selected values directly from form state — single source of truth
  const selectedValues = form.watch("additionalLearningNeeds") ?? [];

  const toggleSelection = (value: string) => {
    const current = form.getValues("additionalLearningNeeds") ?? [];
    const isSelected = current.includes(value);

    const updated = isSelected ? current.filter((v) => v !== value) : [...current, value];

    form.setValue("additionalLearningNeeds", updated, { shouldValidate: true });

    // Clear "others" text when deselecting Others
    if (value === OTHERS_VALUE && isSelected) {
      form.setValue("additionalLearningNeedsOthers", "", { shouldValidate: true });
    }
  };

  const removeSelection = (value: string) => {
    const current = form.getValues("additionalLearningNeeds") ?? [];
    const updated = current.filter((v) => v !== value);

    form.setValue("additionalLearningNeeds", updated, { shouldValidate: true });

    if (value === OTHERS_VALUE) {
      form.setValue("additionalLearningNeedsOthers", "", { shouldValidate: true });
    }
  };

  const maxShownItems = 3;
  const visibleItems = expanded ? selectedValues : selectedValues.slice(0, maxShownItems);
  const hiddenCount = selectedValues.length - visibleItems.length;

  const showOthersTextarea = selectedValues.includes(OTHERS_VALUE);

  return (
    <FormField
      control={form.control}
      name="additionalLearningNeeds"
      render={() => (
        <FormItem className="col-span-2">
          <FormLabel htmlFor={id}>
            Additional Learning or Special Needs <span className="text-xs text-muted-foreground">(optional)</span>
          </FormLabel>
          <FormControl>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={id}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="h-auto min-h-8 w-full justify-between hover:bg-transparent">
                  <div className="flex flex-wrap items-center gap-1 pr-2.5">
                    {selectedValues.length > 0 ? (
                      <>
                        {visibleItems.map((val) => (
                          <Badge key={val} className="font-bold">
                            {val}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-4"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSelection(val);
                              }}
                              asChild>
                              <span>
                                <XIcon className="size-3" />
                              </span>
                            </Button>
                          </Badge>
                        ))}
                        {hiddenCount > 0 || expanded ? (
                          <Badge
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded((prev) => !prev);
                            }}
                            className="cursor-pointer font-bold">
                            {expanded ? "Show Less" : `+${hiddenCount} more`}
                          </Badge>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Search or select a learning need...</span>
                    )}
                  </div>
                  <ChevronsUpDownIcon className="text-muted-foreground/80 shrink-0" aria-hidden="true" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-(--radix-popper-anchor-width) p-0">
                <Command>
                  <CommandInput placeholder="Search learning needs..." />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {LEARNING_NEEDS.map((group) => (
                      <CommandGroup key={group.group} heading={group.group}>
                        {group.items.map((item) => (
                          <CommandItem key={item} value={item} onSelect={() => toggleSelection(item)}>
                            <span className="truncate">{item}</span>
                            {selectedValues.includes(item) && <CheckIcon size={16} className="ml-auto" />}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormDescription>
            Indicate if the student has any learning needs or special requirements. You may select multiple.
          </FormDescription>
          <FormMessage className="text-[10px] font-bold uppercase" />

          {showOthersTextarea && (
            <FormField
              control={form.control}
              name="additionalLearningNeedsOthers"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div
                    className={cn(
                      "space-y-3 rounded-xl border-2 p-4 transition-all duration-300",
                      form.formState.errors.additionalLearningNeedsOthers
                        ? "border-destructive/20 bg-destructive/5"
                        : "border-amber-100 bg-amber-50/30",
                    )}>
                    <Label
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        form.formState.errors.additionalLearningNeedsOthers ? "text-destructive" : "text-amber-700",
                      )}>
                      Specify Learning Needs
                    </Label>

                    <FormControl>
                      <Textarea
                        autoFocus
                        {...field}
                        placeholder="Describe the student's specific learning need or special requirement..."
                        className={cn(
                          "resize-none bg-white/80 backdrop-blur-sm text-sm border-slate-200 shadow-sm transition-all focus:ring-amber-500/10 focus:border-amber-500",
                          form.formState.errors.additionalLearningNeedsOthers && "border-destructive/50",
                        )}
                        rows={3}
                      />
                    </FormControl>

                    {form.formState.errors.additionalLearningNeedsOthers && (
                      <p className="text-[10px] font-bold uppercase text-destructive tracking-wide ml-1">
                        {form.formState.errors.additionalLearningNeedsOthers.message}
                      </p>
                    )}
                  </div>
                </FormItem>
              )}
            />
          )}
        </FormItem>
      )}
    />
  );
}

export default AdditionalLearningNeedsComboBox;
