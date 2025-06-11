import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
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
import "ldrs/react/DotPulse.css";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";

function FatherInformation() {
  const { session } = useSession();
  const params = useParams();
  const { formState, setFormState } = useEnrolOldStudentContext();
  const queryClient = useQueryClient();

  const isFatherAccount = session?.user.user_metadata.relationship === "father";

  const form = useForm<FatherInformationSchema>({
    resolver: zodResolver(fatherInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.fatherInfo,
      noFatherInfo: formState.familyInfo?.fatherInfo?.noFatherInfo ?? false,
    },
  });

  function onSubmit(values: FatherInformationSchema) {
    const insertedValues = Object.values(values).filter((v) => typeof v !== "boolean" && v != "" && v != undefined);

    if (insertedValues.length > 0 && values.noFatherInfo) {
      form.setError("noFatherInfo", {
        message: "You've entered father details but marked them as not applicable. Please resolve the conflict.",
      });
      return;
    }

    if (!values.noFatherInfo && isFatherAccount) {
      const accountEmail = session.user.email;
      if (values.fatherEmail?.toLowerCase() !== accountEmail?.toLowerCase()) {
        form.setError("fatherEmail", {
          message: "Please enter your account email to correctly link the student to your account.",
        });
        return;
      }
    }

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo!,
        fatherInfo: { ...values, isValid: true },
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
        fatherReligion: undefined,
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
        queryKey: ["old-family-information", params.id],
        fetchStatus: "idle",
      });
      const familyInfo = queryClient.getQueryData([
        "old-family-information",
        params.id,
      ]) as EnrolNewStudentFormState["familyInfo"];
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
                <FormDescription>Enter the student's father lastname.</FormDescription>
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
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                    selectedNationality={formState.familyInfo?.fatherInfo?.fatherNationality}
                    onCountryChange={(value) => field.onChange(value?.nationality)}
                  />
                </FormControl>
                <FormDescription>Select the country that best represents the father's nationality.</FormDescription>
                <FormMessage />
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

export default FatherInformation;
