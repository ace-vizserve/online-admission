import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { medicalConditions } from "@/data";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { MedicalChecklistFormValues, medicalChecklistSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Info, Pill, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type ConditionId = (typeof medicalConditions)[number]["id"];

export default function MedicalInformationSection() {
  const { formState, setFormState } = useEnrolOldStudentContext();

  const form = useForm<MedicalChecklistFormValues>({
    resolver: zodResolver(medicalChecklistSchema),
    defaultValues: {
      ...formState.studentInfo?.medicalInformation,
      paracetamolConsent: formState.studentInfo?.medicalInformation?.paracetamolConsent ?? false,
    },
  });

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    setFormState({
      ...formState,
      studentInfo: {
        ...formState.studentInfo!,
        medicalInformation: {
          ...debouncedValues,
        },
      },
    });
  }, [debouncedValues]);

  const watchChecklist = form.watch("medicalChecklist");
  const hasCondition = (conditionId: ConditionId) => form.watch(`medicalChecklist.${conditionId}` as any) === true;

  const handleConditionChange = (id: ConditionId, checked: boolean) => {
    const wasChecked = hasCondition(id);

    if (id === "none") {
      if (checked) {
        form.setValue("medicalChecklist", {
          allergies: false,
          asthma: false,
          heartConditions: false,
          epilepsy: false,
          diabetes: false,
          eczema: false,
          foodAllergies: false,
          foodAllergyDetails: "",
          other: false,
          none: true,
          allergyDetails: "",
          otherMedicalConditions: "",
        });
      } else {
        form.setValue("medicalChecklist.none", false);
      }
      return;
    }

    if (watchChecklist?.none) {
      form.setValue("medicalChecklist.none", false);
    }

    form.setValue(`medicalChecklist.${id}` as any, checked);

    if (wasChecked && !checked) {
      switch (id) {
        case "allergies":
          form.setValue("medicalChecklist.allergyDetails", "");
          break;
        case "foodAllergies":
          form.setValue("medicalChecklist.foodAllergyDetails", "");
          break;
        case "other":
          form.setValue("medicalChecklist.otherMedicalConditions", "");
          break;
      }
    }
  };

  function onSubmit(values: MedicalChecklistFormValues) {
    setFormState({
      studentInfo: {
        ...formState.studentInfo!,
        medicalInformation: { ...values, isValid: true },
      },
    });
    toast.success("Student Medical information saved!", {
      description: "Make sure to double check everything",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (errors.medicalChecklist?.message) {
            toast.error("Invalid Conditions Checklist!", {
              description: "Please select at least one health condition or 'None of the above'",
            });
          }

          setFormState({
            studentInfo: {
              ...formState.studentInfo!,
              medicalInformation: { ...form.watch(), isValid: false },
            },
          });

          form.setValue("isValid", false);

          form.trigger();
        })}
        className="space-y-10">
        <Alert className="bg-amber-500/10 border-none w-full md:w-max md:max-w-[400px] mx-auto">
          <Info className="h-4 w-4 !text-amber-500" />
          <div className="space-y-1 text-pretty">
            <AlertTitle className="text-xs text-amber-700 font-bold">Confidential Information</AlertTitle>
            <span className="text-xs text-amber-900">
              This data is only accessible to <span className="font-bold">authorized medical staff and teachers</span>{" "}
              to ensure immediate and correct emergency response.
            </span>
          </div>
        </Alert>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList
                className={cn(
                  "size-5 transition-colors",
                  form.formState.errors.medicalChecklist ? "text-destructive" : "text-primary",
                )}
              />
              <label
                className={cn(
                  "text-xs font-bold uppercase tracking-wider text-slate-500",
                  form.formState.errors.medicalChecklist ? "text-destructive" : "text-slate-400",
                )}>
                Conditions Checklist
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {medicalConditions.map((condition) => (
              <div key={condition.id}>
                <label
                  className={cn(
                    "flex flex-col gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer outline-none",
                    hasCondition(condition.id)
                      ? "border-primary bg-primary/[0.02] shadow-md ring-4 ring-primary/5"
                      : "border-slate-100 bg-white hover:border-slate-200",
                  )}>
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <Checkbox
                        checked={hasCondition(condition.id)}
                        onCheckedChange={(checked) => handleConditionChange(condition.id, checked === true)}
                      />
                    </FormControl>
                    <Label
                      className={cn(
                        "font-semibold text-sm transition-colors",
                        hasCondition(condition.id) ? "text-slate-900" : "text-slate-500",
                      )}>
                      {condition.label}
                    </Label>
                  </div>

                  {"requiresDetails" in condition && condition.requiresDetails && hasCondition(condition.id) && (
                    <div className="mt-2 pl-9 animate-in fade-in slide-in-from-top-2 duration-300">
                      <FormField
                        control={form.control}
                        name={
                          condition.id === "other"
                            ? "medicalChecklist.otherMedicalConditions"
                            : condition.id === "foodAllergies"
                              ? "medicalChecklist.foodAllergyDetails"
                              : "medicalChecklist.allergyDetails"
                        }
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please provide specific details *</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Details regarding severity, triggers, or management..."
                                className="min-h-[100px] border-slate-200 focus:ring-primary/10 focus:border-primary text-sm bg-white/50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Consent Section */}
        <div className="pt-6">
          <FormField
            control={form.control}
            name="paracetamolConsent"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary" />
                  <FormLabel>Medication Consent</FormLabel>
                </div>

                <div
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all duration-300",
                    field.value ? "bg-emerald-50/50 border-emerald-200 shadow-sm" : "bg-slate-50 border-slate-100",
                  )}>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1 size-5 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </FormControl>
                    <div className="flex-1">
                      <span className="text-sm font-bold leading-relaxed text-slate-800">
                        I give consent for HFSE staff to administer{" "}
                        <span className="text-emerald-700">paracetamol</span> if needed.
                      </span>
                      <FormDescription className="mt-2 text-xs font-semibold text-amber-700 leading-normal">
                        Note: Staff will always attempt to contact you first. Administration follows standard pediatric
                        dosing guidelines.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </label>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button
          size={"lg"}
          className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
          type="submit">
          Save details
          <Save />
        </Button>

        <Button
          className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
          type="submit">
          Save details
          <Save />
        </Button>
      </form>
    </Form>
  );
}
