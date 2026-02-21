import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { useDebounce } from "@/hooks/use-debounce";
import { useSaveApplication } from "@/hooks/use-save-application";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { VizSchoolEnrolNewStudentFormState } from "@/types";
import {
  fatherInformationSchema,
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
  VizSchoolFatherInformationSchema,
} from "@/zod-schema";
import { useSelectAcademicYear } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangleIcon, ArrowRight, Calendar as CalendarIcon, CheckCircle, FilePen, Info } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useBeforeUnload, useNavigate } from "react-router";
import { toast } from "sonner";

function FatherInformation() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isFatherAccount = session?.user.user_metadata.relationship === "father";

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

  const form = useForm<VizSchoolFatherInformationSchema>({
    resolver: zodResolver(fatherInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.fatherInfo,
      noFatherInfo: formState.familyInfo?.fatherInfo?.noFatherInfo ?? false,
      isValid: formState.familyInfo?.fatherInfo?.isValid ?? false,
    },
  });

  async function saveForLater() {
    await saveApplication({ willExit: true });
  }

  async function hasFatherInfoToggle(checked: boolean) {
    if (checked) {
      form.reset({
        ...form.getValues(),
        fatherFirstName: "",
        fatherMiddleName: "",
        fatherLastName: "",
        fatherPreferredName: "",
        fatherBirthDay: undefined,
        fatherNationality: "",
        fatherReligion: "",
        fatherNric: "",
        fatherMobile: "",
        fatherEmail: "",
        fatherCompanyName: "",
        fatherPosition: "",
        noFatherInfo: true,
      });
      setFormState({
        ...formState,
        familyInfo: {
          ...formState.familyInfo!,
          fatherInfo: {
            noFatherInfo: true,
          },
        },
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            hasFatherInfo: false,
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
      ]) as VizSchoolEnrolNewStudentFormState["familyInfo"];
      form.reset({ ...(familyInfo?.fatherInfo ?? {}), noFatherInfo: false });
      setFormState({
        ...formState,
        familyInfo: {
          ...formState.familyInfo!,
          fatherInfo: {
            noFatherInfo: false,
          },
        },
        uploadRequirements: {
          parentGuardianUploadRequirements: {
            hasFatherInfo: true,
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

  function proceedToNextStep(values: VizSchoolFatherInformationSchema) {
    const insertedValues = Object.keys(values).filter((v) => {
      const key = v as keyof VizSchoolFatherInformationSchema;
      return values[key] != undefined && typeof values[key] != "boolean" && values[key] != "";
    }) as [keyof VizSchoolFatherInformationSchema];

    if (insertedValues.length > 0 && values.noFatherInfo) {
      for (const key of insertedValues) {
        form.setError(key, {});
      }

      toast.warning("Conflict detected!", {
        description: "Some father's details are filled, but marked as not applicable. Please review.",
      });

      form.setError("noFatherInfo", {
        message: "You've entered father details but marked them as not applicable.",
      });
      return;
    }

    if (!values.noFatherInfo && isFatherAccount) {
      const accountEmail = session.user.email;

      if (values.fatherEmail?.toLowerCase() !== accountEmail?.toLowerCase()) {
        toast.warning("Father's email mismatch!", {
          description: "Please enter your account email to correctly link the student to your account.",
        });
        form.setError("fatherEmail", {
          message: "Email must match your account to link the student.",
        });
        return;
      }
    }

    form.setValue("isValid", true);

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo!,
        fatherInfo: { ...values, fatherEmail: values.fatherEmail?.toLowerCase(), isValid: true },
      },
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...(formState.uploadRequirements
            ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
          hasFatherInfo: !values.noFatherInfo,
        },
        studentUploadRequirements: {
          ...(formState.uploadRequirements?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
        },
      },
    });

    if (!formState.familyInfo?.motherInfo.isValid) {
      toast.info("Father's information confirmed!", {
        description: "Please proceed in confirming the Mother's information",
      });
      form.setError("root", {});
      return;
    }

    setCompletedTabs("/vizschool/enrol-student/new/family-info");

    if (completedTabs.includes("/vizschool/enrol-student/new/enrollment-info")) return;

    setCurrentTab("/vizschool/enrol-student/new/enrollment-info");
    setActiveTab("/vizschool/enrol-student/new/enrollment-info");
  }

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo!,
        fatherInfo: {
          ...form.watch(),
        },
      },
    });
  }, [debouncedValues]);

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      (async () => {
        await saveApplication({ willExit: false });

        toast.success("Father information details saved!", {
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
            name="fatherFirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father first name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherMiddleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Middle name <span className="text-xs text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father middle name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="fatherLastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father last name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherPreferredName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father preferred name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="fatherBirthDay"
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
                  <FormDescription>Enter the student's father birth date.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fatherReligion"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <FormItem>
                    <FormLabel>Religion</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter father's religion</FormDescription>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="fatherNationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Nationality</FormLabel>
                <FormControl>
                  <LocationSelector
                    showStates={false}
                    currentCountry={formState.familyInfo?.fatherInfo?.fatherNationality}
                    onCountryChange={(value) => field.onChange(value?.name)}
                  />
                </FormControl>
                <FormDescription>Select the country that best represents the father's nationality.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="fatherNric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NRIC/FIN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father NRIC/FIN.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="fatherMobile"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>Mobile Phone</FormLabel>
                  <FormControl className="w-full">
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Enter the student's father mobile phone.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fatherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input placeholder="" type="email" {...field} />
                  </FormControl>
                  <FormDescription>Enter the student's father email address.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="fatherCompanyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Company</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father work company.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatherPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Position</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's father work position.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!isFatherAccount ? (
          <div className="!space-y-4">
            <FormField
              control={form.control}
              name="noFatherInfo"
              render={({ field }) => (
                <FormItem className="my-8 w-full mx-auto max-w-lg rounded-lg border px-4 py-6">
                  <div className="w-full flex flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <FormLabel>Is the father's information not available?</FormLabel>
                      <FormDescription className="text-pretty">
                        Turn this on if you are unable to provide the father's details.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={async (checked) => {
                          field.onChange(checked);
                          await hasFatherInfoToggle(checked);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <Button
            variant={"secondary"}
            disabled={isLoading}
            size={"lg"}
            className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
            type="submit">
            {form.watch("isValid") === true ? (
              <>
                Confirm & Proceed <ArrowRight />
              </>
            ) : (
              <>
                Confirm Details <CheckCircle />
              </>
            )}
          </Button>

          <Button
            variant={"secondary"}
            disabled={isLoading}
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="submit">
            {form.watch("isValid") === true ? (
              <>
                Confirm & Proceed <ArrowRight />
              </>
            ) : (
              <>
                Confirm Details <CheckCircle />
              </>
            )}
          </Button>

          <Button
            onClick={async () => await saveForLater()}
            disabled={isLoading}
            size={"lg"}
            className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
            type="button">
            Save for later & exit
            <FilePen />
          </Button>

          <Button
            onClick={async () => await saveForLater()}
            disabled={isLoading}
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="button">
            Save for later & exit
            <FilePen />
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default FatherInformation;
