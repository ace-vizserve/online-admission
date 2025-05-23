import { updateFamilyInformation } from "@/actions/private";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { religions } from "@/data";
import { cn } from "@/lib/utils";
import { FamilyInfo } from "@/types";
import { motherInformationSchema, MotherInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";

function MotherInformation() {
  const { formState, setFormState } = useEnrolOldStudentContext();
  const { mutate, isPending } = useMutation({
    mutationFn: async (familyInformation: Partial<FamilyInfo>) => {
      return await updateFamilyInformation(familyInformation);
    },
  });
  const [isOtherReligion, setIsOtherReligion] = useState<boolean>(false);
  const form = useForm<MotherInformationSchema>({
    resolver: zodResolver(motherInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.motherInfo,
    },
  });

  useEffect(() => {
    if (!formState.familyInfo?.motherInfo) return;

    form.reset(formState.familyInfo.motherInfo);
  }, [form, formState.familyInfo?.motherInfo]);

  function onSubmit(values: MotherInformationSchema) {
    if (!isValidPhoneNumber(values.motherMobile)) {
      form.setError("motherMobile", {
        message: "Invalid phone number",
      });
      return;
    }

    setFormState({
      familyInfo: {
        ...formState.familyInfo!,
        motherInfo: { ...values, isValid: true },
      },
    });

    mutate({ ...values, motherBirthDay: values.motherBirthDay as unknown as string });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="motherFirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother first name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherMiddleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Middle name <span className="text-xs text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother middle name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="motherLastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother lastname.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherPreferredName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred name</FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother preferred name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="motherBirthDay"
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
                  <FormDescription>Enter the student's mother birth date.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motherReligion"
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
                    <FormDescription>Enter mother's religion</FormDescription>
                    <FormMessage />
                  </FormItem>
                  {(isOtherReligion || formState.familyInfo?.motherInfo?.motherOtherReligion) && (
                    <FormField
                      control={form.control}
                      name="motherOtherReligion"
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
            name="motherNationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Country</FormLabel>
                <FormControl>
                  <LocationSelector
                    showStates={false}
                    selectedNationality={formState.familyInfo?.motherInfo?.motherNationality}
                    onCountryChange={(value) => field.onChange(value?.nationality)}
                  />
                </FormControl>
                <FormDescription>Select the country to determine the nationality.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="motherNric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NRIC/FIN</FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother NRIC/FIN.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="motherMobile"
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
                  <FormDescription>Enter the student's mother mobile phone.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input placeholder="" type="email" {...field} />
                  </FormControl>
                  <FormDescription>Enter the student's mother email address.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="motherCompanyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Company</FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother work company.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motherPosition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Position</FormLabel>
                <FormControl>
                  <Input placeholder="" type="" {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother work position.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={isPending} size={"lg"} className="hidden lg:flex w-full p-8 gap-2 uppercase" type="submit">
          {isPending ? (
            <>
              Saving
              <DotPulse size="30" speed="1.3" color="white" />
            </>
          ) : (
            <>
              Save
              <Save />
            </>
          )}
        </Button>

        <Button disabled={isPending} className="flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
          {isPending ? (
            <>
              Saving
              <DotPulse size="20" speed="1.3" color="white" />
            </>
          ) : (
            <>
              Save
              <Save />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default MotherInformation;
