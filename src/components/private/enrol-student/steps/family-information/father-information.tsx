import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { useAutoSave } from "@/hooks/use-autosave";
import { useDebounce } from "@/hooks/use-debounce";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { EnrolNewStudentFormState } from "@/types";
import {
  fatherInformationSchema,
  FatherInformationSchema,
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Calendar as CalendarIcon, Info, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function FatherInformation() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isFatherAccount = session?.user.user_metadata.relationship === "father";

  const { formState, setFormState, setCompletedTabs, setCurrentTab, setActiveTab } = useEnrolNewStudentContext();

  const form = useForm<FatherInformationSchema>({
    resolver: zodResolver(fatherInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.fatherInfo,
      noFatherInfo: formState.familyInfo?.fatherInfo?.noFatherInfo ?? false,
      isValid: formState.familyInfo?.fatherInfo?.isValid ?? false,
    },
  });

  function onSubmit(values: FatherInformationSchema) {
    const insertedValues = Object.keys(values).filter((v) => {
      const key = v as keyof FatherInformationSchema;
      return values[key] != undefined && typeof values[key] != "boolean" && values[key] != "";
    }) as [keyof FatherInformationSchema];

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
    toast.success("Father information details saved!", {
      description: "Make sure to double check everything",
    });
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
        queryKey: ["new-family-information", session?.user.email],
      });
      const familyInfo = queryClient.getQueryData(["new-family-information"]) as EnrolNewStudentFormState["familyInfo"];
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

  function proceedToNextStep() {
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

    setCompletedTabs("/enrol-student/new/family-info");
    setCurrentTab("/enrol-student/new/enrollment-info");
    setActiveTab("/enrol-student/new/enrollment-info");
    navigate("/enrol-student/new/enrollment-info");
  }

  const debouncedAutoSaveValue = useDebounce(form.watch(), 500);

  useAutoSave(
    setFormState,
    {
      ...formState,
      familyInfo: {
        ...formState.familyInfo,
        fatherInfo: {
          ...debouncedAutoSaveValue,
        },
      },
    },
    0
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
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
                            !field.value && "text-muted-foreground"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
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

            <Alert className="bg-blue-500/10 border-none w-full md:w-max md:max-w-[400px] mx-auto">
              <Info className="h-4 w-4 !text-blue-500" />
              <div className="space-y-1 text-pretty">
                <AlertTitle className="text-xs text-blue-700 font-semibold">Important Information</AlertTitle>
                <span className="text-xs text-blue-900">
                  Always click the <span className="font-semibold">Save</span> button after applying any changes to
                  ensure your updates are recorded.
                </span>
              </div>
            </Alert>
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <Button size={"lg"} variant={"secondary"} className="hidden lg:flex w-full p-8 gap-2 uppercase" type="submit">
            Confirm & Save
            <Save />
          </Button>

          <Button variant={"secondary"} className="flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
            Confirm & Save
            <Save />
          </Button>

          <Button
            disabled={!formState.familyInfo?.fatherInfo?.isValid}
            onClick={proceedToNextStep}
            size={"lg"}
            className="hidden lg:flex w-full p-8 gap-2 uppercase"
            type="button">
            Proceed to Next Step
            <ArrowRight />
          </Button>

          <Button
            disabled={!formState.familyInfo?.fatherInfo?.isValid}
            onClick={proceedToNextStep}
            className="flex lg:hidden w-full p-6 gap-2 uppercase"
            type="button">
            Proceed to Next Step
            <ArrowRight />
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default FatherInformation;
