import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { cn } from "@/lib/utils";
import { EnrolNewStudentFormState } from "@/types";
import {
  guardianInformationSchema,
  GuardianInformationSchema,
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import "ldrs/react/DotPulse.css";
import { Calendar as CalendarIcon, Info, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";

function GuardianInformation() {
  const queryClient = useQueryClient();
  const params = useParams();
  const { formState, setFormState } = useEnrolOldStudentContext();

  const form = useForm<GuardianInformationSchema>({
    resolver: zodResolver(guardianInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.guardianInfo,
      noGuardianInfo: formState.familyInfo?.guardianInfo?.noGuardianInfo ?? false,
    },
  });

  function onSubmit(values: GuardianInformationSchema) {
    const insertedValues = Object.keys(values).filter((v) => {
      const key = v as keyof GuardianInformationSchema;
      return values[key] != undefined && typeof values[key] != "boolean" && values[key] != "";
    }) as [keyof GuardianInformationSchema];

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
        ...formState.familyInfo!,
        guardianInfo: { ...values, guardianEmail: values.guardianEmail?.toLowerCase() },
      },
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...(formState.uploadRequirements
            ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
          hasGuardianInfo: !values.noGuardianInfo,
        },
        studentUploadRequirements: {
          ...(formState.uploadRequirements?.studentUploadRequirements as unknown as StudentUploadRequirementsSchema),
        },
      },
    });
    toast.success("Guardian information details saved!", {
      description: "Make sure to double check everything",
    });
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
        queryKey: ["old-family-information", params.id],
        fetchStatus: "idle",
      });
      const familyInfo = queryClient.getQueryData([
        "old-family-information",
        params.id,
      ]) as EnrolNewStudentFormState["familyInfo"];
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
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

          <Alert className="bg-blue-500/10 border-none w-full md:w-max md:max-w-[400px] mx-auto">
            <Info className="h-4 w-4 !text-blue-500" />
            <div className="space-y-1 text-pretty">
              <AlertTitle className="text-xs text-blue-700 font-semibold">Important Information</AlertTitle>
              <span className="text-xs text-blue-900">
                Always click the <span className="font-semibold">Save</span> button after applying any changes to ensure
                your updates are recorded.
              </span>
            </div>
          </Alert>
        </div>

        <Button size={"lg"} className="hidden lg:flex w-full p-8 gap-2 uppercase" type="submit">
          Save
          <Save />
        </Button>

        <Button className="flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
          Save
          <Save />
        </Button>
      </form>
    </Form>
  );
}

export default GuardianInformation;
