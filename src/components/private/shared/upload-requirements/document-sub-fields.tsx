import AdvancedCalendarSelection from "@/components/ui/advanced-calendar-selection";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PassportInput } from "@/components/ui/passport-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { DocumentConfig, siblingFields } from "./document-config";
import { SetUploadRequirementsFn, SharedUploadFormState } from "./types";
import { updateUploadRequirementsSlice } from "./use-document-upload-dialog";

type SubFieldsProps<TFieldValues extends FieldValues> = {
  cfg: DocumentConfig;
  form: UseFormReturn<TFieldValues>;
  formState: SharedUploadFormState;
  setUploadRequirements: SetUploadRequirementsFn;
};

/** "Pass Type" select + "Pass Expiry" date picker, config-driven — replaces the 6 hand-written
 * `{name === "motherPass" && (...)}`-style blocks (×2 for desktop/mobile) that used to exist for
 * this exact shape, one per document. */
export function PassFields<TFieldValues extends FieldValues>({
  cfg,
  form,
  formState,
  setUploadRequirements,
}: SubFieldsProps<TFieldValues>) {
  const { type, expiry } = siblingFields(cfg);
  if (!type || !expiry) return null;

  const disabled = (form.getValues("toFollowDocs" as Path<TFieldValues>) as string[] | undefined)?.includes(cfg.name);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 w-full">
      <FormField
        control={form.control}
        name={type as Path<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pass Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger disabled={disabled} className="w-full">
                  <SelectValue placeholder="Select a pass type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {cfg.passTypeOptions?.map((passType) => (
                  <SelectItem key={passType.value} value={passType.value}>
                    {passType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{cfg.passDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={expiry as Path<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pass Expiry</FormLabel>
            <Popover modal>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    disabled={disabled}
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <AdvancedCalendarSelection
                  setDate={(date) => {
                    if (date) {
                      const fixedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                      field.onChange(fixedDate);
                      updateUploadRequirementsSlice(formState, setUploadRequirements, cfg.group, {
                        [expiry]: fixedDate,
                      });
                    } else {
                      field.onChange(date);
                    }
                    form.trigger();
                  }}
                  date={field.value}
                  disablePastDates
                />
              </PopoverContent>
            </Popover>
            <FormDescription>Pass expiration date.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/** "Passport Number" input + "Passport Expiry" date picker, config-driven — replaces the 6
 * hand-written `{name === "motherPassport" && (...)}`-style blocks (×2 for desktop/mobile). */
export function PassportFields<TFieldValues extends FieldValues>({
  cfg,
  form,
  formState,
  setUploadRequirements,
}: SubFieldsProps<TFieldValues>) {
  const { number, expiry } = siblingFields(cfg);
  if (!number || !expiry) return null;

  const disabled = (form.getValues("toFollowDocs" as Path<TFieldValues>) as string[] | undefined)?.includes(cfg.name);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 w-full">
      <FormField
        control={form.control}
        name={number as Path<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Passport Number</FormLabel>
            <FormControl>
              <PassportInput disabled={disabled} {...field} placeholder={cfg.numberPlaceholder} />
            </FormControl>
            <FormDescription>{cfg.passportNumberDescription}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={expiry as Path<TFieldValues>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Passport Expiry</FormLabel>
            <Popover modal>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    disabled={disabled}
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <AdvancedCalendarSelection
                  setDate={(date) => {
                    if (date) {
                      const fixedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                      field.onChange(fixedDate);
                      updateUploadRequirementsSlice(formState, setUploadRequirements, cfg.group, {
                        [expiry]: fixedDate,
                      });
                    } else {
                      field.onChange(date);
                    }
                    form.trigger();
                  }}
                  date={field.value}
                  disablePastDates
                />
              </PopoverContent>
            </Popover>
            <FormDescription>Passport expiration date.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/** Picks the right sub-field pair for a document's `fieldKind` — the single call site that
 * replaces every hand-written per-document-type conditional block. */
export function DocumentSubFields<TFieldValues extends FieldValues>(props: SubFieldsProps<TFieldValues>) {
  if (props.cfg.fieldKind === "passType+expiry") return <PassFields {...props} />;
  if (props.cfg.fieldKind === "passportNumber+expiry") return <PassportFields {...props} />;
  return null;
}
