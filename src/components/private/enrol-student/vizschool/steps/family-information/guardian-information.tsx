import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useSaveApplication } from "@/hooks/use-save-application";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { VizSchoolEnrolNewStudentFormState } from "@/types";
import {
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
  vizSchoolGuardianInformationSchema,
  VizSchoolGuardianInformationSchema,
} from "@/zod-schema";
import { useSelectAcademicYear } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangleIcon, ArrowRight, Calendar as CalendarIcon, CheckCircle2, FilePen, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useBeforeUnload, useNavigate } from "react-router";
import { toast } from "sonner";

function GuardianInformation() {
  const { session } = useSession();
  const queryClient = useQueryClient();
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

  const form = useForm<VizSchoolGuardianInformationSchema>({
    resolver: zodResolver(vizSchoolGuardianInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.guardianInfo,
    },
  });

  async function saveForLater() {
    await saveApplication({ willExit: true });
  }

  function proceedToNextStep(values: VizSchoolGuardianInformationSchema) {
    if (!formState.familyInfo?.motherInfo?.isValid) {
      toast.warning("Mother's information not confirmed!", {
        description: "Please review and confirm all required fields before proceeding",
      });
      form.setError("root", {});
      return;
    }

    if (!formState.familyInfo?.fatherInfo?.isValid) {
      toast.warning("Father's information not confirmed!", {
        description: "Please review and confirm all required fields before proceeding",
      });
      form.setError("root", {});
      return;
    }

    const insertedValues = Object.keys(values).filter((v) => {
      const key = v as keyof VizSchoolGuardianInformationSchema;
      return values[key] != undefined && typeof values[key] != "boolean" && values[key] != "";
    }) as [keyof VizSchoolGuardianInformationSchema];

    if (insertedValues.length > 0 && values.noGuardianInfo) {
      for (const key of insertedValues) {
        form.setError(key, {});
      }

      toast.warning("Conflict detected!", {
        description: "Some guardian's details are filled, but marked as not applicable. Please review.",
      });

      form.setError("noGuardianInfo", {
        message: "You've entered guardian details but marked them as not applicable.",
      });
      return;
    }

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo,
        guardianInfo: { ...values, guardianEmail: values.guardianEmail?.toLowerCase() },
      },
      uploadRequirements: {
        studentUploadRequirements: {
          ...(formState.uploadRequirements?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
        },
        parentGuardianUploadRequirements: {
          ...(formState.uploadRequirements
            ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
          hasGuardianInfo: true,
        },
      },
    });

    setCompletedTabs("/vizschool/enrol-student/new/family-info");

    if (completedTabs.includes("/vizschool/enrol-student/new/enrollment-info")) return;

    setCurrentTab("/vizschool/enrol-student/new/enrollment-info");
    setActiveTab("/vizschool/enrol-student/new/enrollment-info");
  }

  async function hasGuardianInfoToggle(checked: boolean) {
    if (checked) {
      form.reset({
        ...form.getValues(),
        guardianFirstName: "",
        guardianMiddleName: "",
        guardianLastName: "",
        guardianPreferredName: "",
        guardianBirthDay: undefined,
        guardianNationality: "",
        guardianReligion: "",
        guardianNric: "",
        guardianMobile: "",
        guardianEmail: "",
        guardianCompanyName: "",
        guardianPosition: "",
        noGuardianInfo: true,
      });
      setFormState({
        ...formState,
        familyInfo: {
          ...formState.familyInfo!,
          guardianInfo: {
            noGuardianInfo: true,
          },
        },
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            hasGuardianInfo: false,
            ...(formState.uploadRequirements
              ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
          },
          studentUploadRequirements: {
            ...(formState.uploadRequirements?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
          },
        },
      });
    } else {
      await queryClient.refetchQueries({
        queryKey: ["new-learner-family-information", session?.user.email],
      });
      const familyInfo = queryClient.getQueryData([
        "new-learner-family-information",
        session?.user.email,
      ]) as VizSchoolEnrolNewStudentFormState["familyInfo"];
      form.reset({ ...(familyInfo?.guardianInfo ?? {}), noGuardianInfo: false });
      setFormState({
        ...formState,
        familyInfo: {
          ...formState.familyInfo!,
          guardianInfo: {
            noGuardianInfo: false,
          },
        },
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            hasGuardianInfo: true,
            ...(formState.uploadRequirements
              ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
          },
          studentUploadRequirements: {
            ...(formState.uploadRequirements?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
          },
        },
      });
    }
  }

  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    const wasDirty = form.formState.isDirty;

    if (wasDirty) {
      setFormState({
        ...formState,
        familyInfo: {
          ...formState.familyInfo!,
          guardianInfo: {
            ...debouncedValues,
          },
        },
      });
    }

    form.reset(
      { ...debouncedValues },
      {
        keepErrors: true,
      },
    );

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

        toast.success("Guardian information details saved!", {
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="guardianFirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian first name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardianMiddleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Middle name <span className="text-xs text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian middle name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="guardianLastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian last name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardianPreferredName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian preferred name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="guardianBirthDay"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full lg:w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}>
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())));
                          } else {
                            field.onChange(date);
                          }
                        }}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>Enter the student's guardian birth date.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianReligion"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <FormItem>
                    <FormLabel>Religion</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter guardian's religion</FormDescription>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="guardianNationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Nationality</FormLabel>
                <FormControl>
                  <LocationSelector
                    showStates={false}
                    currentCountry={formState.familyInfo?.guardianInfo?.guardianNationality}
                    onCountryChange={(value) => field.onChange(value?.name)}
                  />
                </FormControl>
                <FormDescription>Select the country that best represents the guardian's nationality.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="guardianNric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NRIC/FIN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian NRIC/FIN.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="guardianMobile"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>Mobile Phone</FormLabel>
                  <FormControl className="w-full">
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Enter the student's guardian mobile phone.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="guardianEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input placeholder="" type="email" {...field} />
                  </FormControl>
                  <FormDescription>Enter the student's guardian email address.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="guardianCompanyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Company</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian work company.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardianPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Position</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's guardian work position.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="!space-y-4">
          <FormField
            control={form.control}
            name="noGuardianInfo"
            render={({ field }) => (
              <FormItem className="my-8 w-full mx-auto max-w-lg rounded-lg border px-4 py-6">
                <div className="w-full flex flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <FormLabel>Is the guardian's information not available?</FormLabel>
                    <FormDescription className="text-pretty">
                      Turn this on if you are unable to provide the guardian's details.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={async (checked) => {
                        field.onChange(checked);
                        await hasGuardianInfoToggle(checked);
                      }}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden lg:block w-full">
                  <Button
                    variant={"secondary"}
                    size={"lg"}
                    className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
                    type="submit">
                    Confirm & Proceed
                    <ArrowRight />
                  </Button>
                </span>
              </TooltipTrigger>
              {(!formState.familyInfo?.fatherInfo?.isValid || !formState.familyInfo?.motherInfo?.isValid) && (
                <TooltipContent>
                  <p>Please save the father’s and mother’s information by clicking the Save button on each tab.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Button
            variant={"secondary"}
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="submit">
            Confirm & Proceed
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
  );
}

export default GuardianInformation;
