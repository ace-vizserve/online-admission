import AdvancedCalendarSelection from "@/components/ui/advanced-calendar-selection";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useSaveApplication } from "@/hooks/use-save-application";
import { cn } from "@/lib/utils";
import { siblingInformationSchema, SiblingInformationSchema } from "@/zod-schema";
import { useSelectAcademicYear } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  AlertTriangleIcon,
  ArrowRight,
  Baby,
  CalendarIcon,
  CheckCircle2,
  FilePen,
  Info,
  Loader2,
  MinusCircle,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useBeforeUnload, useNavigate } from "react-router";
import { toast } from "sonner";

function SiblingInformation() {
  const navigate = useNavigate();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const {
    formState,
    setFormState,
    setCompletedTabs,
    setCurrentTab,
    setActiveTab,
    activeTab,
    completedTabs,
    currentTab,
  } = useEnrolNewLearnerContext();
  const { isLoading, saveApplication } = useSaveApplication({
    academicYear,
    activeTab,
    completedTabs,
    currentTab,
    formState,
    setFormState,
    type: "viz-school",
  });

  const form = useForm<SiblingInformationSchema>({
    resolver: zodResolver(siblingInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.siblingsInfo,
    },
  });

  async function saveForLater() {
    await saveApplication({ willExit: true });
  }

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "siblings" as never,
  });

  function proceedToNextStep(values: SiblingInformationSchema) {
    if (!formState.familyInfo?.motherInfo.isValid) {
      toast.warning("Mother's information not confirmed!", {
        description: "Please review and confirm all required fields before proceeding",
      });
      form.setError("root", {});
      return;
    }

    if (!formState.familyInfo?.fatherInfo.isValid) {
      toast.warning("Father's information not confirmed!", {
        description: "Please review and confirm all required fields before proceeding",
      });
      form.setError("root", {});
      return;
    }

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo,
        siblingsInfo: values,
      },
    });

    setCompletedTabs("/vizschool/enrol-student/new/family-info");

    if (completedTabs.includes("/vizschool/enrol-student/new/enrollment-info")) return;

    setCurrentTab("/vizschool/enrol-student/new/enrollment-info");
    setActiveTab("/vizschool/enrol-student/new/enrollment-info");
  }

  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    const wasDirty = form.formState.isDirty;

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo!,
        siblingsInfo: {
          ...debouncedValues,
        },
      },
    });

    if (wasDirty && formState.draftId) {
      setShowDraftSaved(true);
      const timer = setTimeout(() => setShowDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [debouncedValues]);

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      (async () => {
        await saveApplication({ willExit: false });

        toast.success("Sibling information saved!", {
          description: "Make sure to double check everything",
        });

        navigate("/vizschool/enrol-student/new/enrollment-info");
      })();
    }
  }, [form.formState.isSubmitSuccessful]);

  useBeforeUnload((e) => {
    e.preventDefault();
  });

  return (
    <>
      {!fields.length ? (
        <>
          <EmptySibling />
          <div className="flex pt-4">
            <Button
              type="button"
              className="group !h-14 !px-8 rounded-xl"
              onClick={() =>
                append({
                  siblingDateOfBirth: new Date(),
                  siblingFullName: "",
                  siblingReligion: "",
                  siblingSchoolLevelOrCompanyPosition: "",
                  siblingSchoolOrCompanyName: "",
                })
              }>
              <PlusCircle className="mr-2 size-5 transition-transform group-hover:rotate-90" />
              <span className="font-black uppercase tracking-widest text-xs">Add sibling</span>
            </Button>
          </div>
        </>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(proceedToNextStep)} className="space-y-8 max-w-5xl mx-auto">
            <Alert className="bg-blue-500/10 border-none w-full md:w-max md:max-w-[400px] mx-auto">
              <Info className="h-4 w-4 !text-blue-500" />
              <div className="space-y-1 text-pretty">
                <AlertTitle className="text-xs text-blue-700 font-bold">Important Information</AlertTitle>
                <span className="text-xs text-blue-900">
                  Always click the <span className="font-bold">Save details</span> button after applying any changes to
                  ensure your updates are recorded.
                </span>
              </div>
            </Alert>
            {(!formState.familyInfo?.fatherInfo?.isValid || !formState.familyInfo?.motherInfo?.isValid) && (
              <>
                <div className="w-full max-w-md mx-auto">
                  <Alert className="border-amber-500/50 text-amber-500 dark:border-amber-500 [&>svg]:text-amber-500">
                    <AlertTriangleIcon className="size-4" />
                    <AlertTitle className="text-amber-600 font-bold">Confirmation Required</AlertTitle>
                    <p className="text-amber-500 col-start-2 text-sm">
                      Please save and confirm the father's and mother's information by clicking the{" "}
                      <span className="font-bold text-amber-600">"Confirm Details"</span> button on each tab separately
                      before proceeding.
                    </p>
                  </Alert>
                </div>
                <br />
              </>
            )}
            {fields.map((field, index) => (
              <Card key={field.id} className="flex flex-col space-y-8 shadow-none border-none">
                <CardHeader className="p-0 w-full flex items-center justify-between">
                  <CardTitle className="font-semibold text-xl">Sibling {index + 1} information</CardTitle>
                  <Button
                    variant="outline"
                    className="w-fit ml-auto gap-2 text-destructive hover:text-red-700 hover:bg-red-50 transition-colors"
                    onClick={() => remove(index)}>
                    <MinusCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Remove</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-0 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-4 lg:gap-6 w-full ">
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingFullName`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>Enter the student's sibling full name.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingBirthDay`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}>
                                  {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <AdvancedCalendarSelection
                                setDate={field.onChange}
                                date={field.value}
                                disablePastDates={false}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>Enter the student's sibling birth date.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingReligion`}
                      render={({ field }) => (
                        <div className="flex flex-col gap-2">
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>Enter sibling's religion</FormDescription>
                            <FormMessage />
                          </FormItem>
                        </div>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingSchoolCompany`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School or Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>Enter the student's sibling school or company name.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingEducationOccupation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Level or Company Position</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the student's sibling school level or company position.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex pt-4">
              <Button
                variant={"secondary"}
                type="button"
                className="group !h-14 !px-8 rounded-xl"
                onClick={() =>
                  append({
                    siblingDateOfBirth: new Date(),
                    siblingFullName: "",
                    siblingReligion: "",
                    siblingSchoolLevelOrCompanyPosition: "",
                    siblingSchoolOrCompanyName: "",
                  })
                }>
                <PlusCircle className="mr-2 size-5 transition-transform group-hover:rotate-90" />
                <span className="font-black uppercase tracking-widest text-xs">Add sibling</span>
              </Button>
            </div>

            <Separator />
            <br />

            <div className="flex flex-col gap-4 mb-4">
              <Button
                variant={"secondary"}
                size={"lg"}
                className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
                type="submit">
                Proceed to Next Step
                <ArrowRight />
              </Button>

              <Button
                variant={"secondary"}
                className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
                type="submit">
                Proceed to Next Step
                <ArrowRight />
              </Button>

              <Button
                onClick={async () => await saveForLater()}
                disabled={isLoading}
                size={"lg"}
                className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
                type="button">
                {isLoading ? "Saving..." : "Save for later & exit"}
                {isLoading ? <Loader2 className="animate-spin" /> : <FilePen />}
              </Button>

              <Button
                onClick={async () => await saveForLater()}
                disabled={isLoading}
                className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
                type="button">
                {isLoading ? "Saving..." : "Save for later & exit"}
                {isLoading ? <Loader2 className="animate-spin" /> : <FilePen />}
              </Button>

              {showDraftSaved && (
                <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  Draft auto-saved
                </p>
              )}
            </div>
          </form>
        </Form>
      )}
    </>
  );
}

function EmptySibling() {
  return (
    <Card className="group relative h-[300px] w-full max-w-5xl mx-auto mb-6 border-2 border-dashed border-slate-200 bg-slate-50/50 transition-colors hover:bg-slate-50 hover:border-slate-300 rounded-3xl overflow-hidden">
      <CardContent className="h-full flex flex-col items-center justify-center text-center p-8">
        {/* Decorative Icon Container */}
        <div className="relative mb-6">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform duration-300">
            <Baby className="size-8 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center size-6 rounded-full bg-slate-900 text-white border-2 border-white">
            <PlusCircle className="size-3.5" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-secondary">No Siblings Recorded</h3>
          <p className="text-sm text-slate-500 font-medium max-w-[280px] leading-relaxed">
            Adding siblings can help the school coordinate records and transportation for your family.
          </p>
        </div>

        {/* Subtle Hint */}
        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          Optional Section
        </div>
      </CardContent>
    </Card>
  );
}
export default SiblingInformation;
