import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { religions } from "@/data";
import { cn } from "@/lib/utils";
import {
  guardianInformationSchema,
  GuardianInformationSchema,
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

function GuardianInformation() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const [isOtherReligion, setIsOtherReligion] = useState<boolean>(false);

  const form = useForm<GuardianInformationSchema>({
    resolver: zodResolver(guardianInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.guardianInfo,
    },
  });

  function onSubmit(values: GuardianInformationSchema) {
    if (!isValidPhoneNumber(values.guardianMobile)) {
      form.setError("guardianMobile", {
        message: "Invalid phone number",
      });
      return;
    }

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo!,
        guardianInfo: { ...values },
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
    toast.success("Guardian information details saved!", {
      description: "Make sure to double check everything",
    });
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
                <FormDescription>Enter the student's guardian lastname.</FormDescription>
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
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                    <Select
                      onValueChange={(value) => {
                        if (value === "other") {
                          setIsOtherReligion(true);
                        } else {
                          setIsOtherReligion(false);
                        }

                        field.onChange(value);
                      }}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full lg:max-w-[240px]">
                          <SelectValue placeholder="Select a religion" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {religions.map((religion) => (
                          <SelectItem key={religion.value} value={religion.value}>
                            {religion.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Enter father's religion</FormDescription>
                    <FormMessage />
                  </FormItem>
                  {(isOtherReligion || formState.familyInfo?.guardianInfo?.guardianOtherReligion) && (
                    <FormField
                      control={form.control}
                      name="guardianOtherReligion"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <Input placeholder="Please specify religion" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
                    selectedNationality={formState.familyInfo?.guardianInfo?.guardianNationality}
                    onCountryChange={(value) => field.onChange(value?.nationality)}
                  />
                </FormControl>
                <FormDescription>Select the country that best represents the guardian's nationality.</FormDescription>
                <FormMessage />
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
                    <PhoneInput
                      {...field}
                      value={parsePhoneNumber(field.value, "SG")?.formatInternational() ?? field.value}
                      defaultCountry="SG"
                      international
                    />
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
