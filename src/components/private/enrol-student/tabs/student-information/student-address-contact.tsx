import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { maritalStatuses } from "@/data";
import { studentAddressContactSchema, StudentAddressContactSchema, StudentDetailsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import "ldrs/react/DotPulse.css";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { isValidPhoneNumber, parsePhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

function StudentAddressContact() {
  const { formState, setFormState } = useEnrolOldStudentContext();

  const form = useForm<StudentAddressContactSchema>({
    resolver: zodResolver(studentAddressContactSchema),
    defaultValues: {
      ...formState.studentInfo?.addressContact,
    },
  });

  function onSubmit(values: StudentAddressContactSchema) {
    if (form.getValues("homePhone") && !isValidPhoneNumber(form.getValues("homePhone"))) {
      form.setError("homePhone", {
        message: "Invalid phone number",
      });
      return;
    }

    if (form.getValues("contactPersonNumber") && !isValidPhoneNumber(form.getValues("contactPersonNumber"))) {
      form.setError("contactPersonNumber", {
        message: "Invalid phone number",
      });
      return;
    }

    setFormState({
      studentInfo: {
        studentDetails: { ...(formState.studentInfo?.studentDetails ?? ({} as unknown as StudentDetailsSchema)) },
        addressContact: {
          ...values,
        },
      },
    });

    toast.success("Student information saved!", {
      description: "Make sure to double check everything",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
        <FormField
          control={form.control}
          name="homeAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>This is your student's current address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>This is your student's address postal code.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Nationality</FormLabel>
                <FormControl>
                  <LocationSelector
                    showStates={false}
                    selectedNationality={formState.studentInfo?.addressContact.nationality}
                    onCountryChange={(value) => field.onChange(value?.name)}
                  />
                </FormControl>
                <FormDescription>Select the country that best represents the student's nationality.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="homePhone"
            render={({ field }) => (
              <FormItem className="flex flex-col items-start">
                <FormLabel>Home phone</FormLabel>
                <FormControl className="w-full">
                  <PhoneInput
                    {...field}
                    value={parsePhoneNumber(field.value, "SG")?.formatInternational() ?? field.value}
                    defaultCountry="SG"
                    international
                  />
                </FormControl>
                <FormDescription>Enter your home phone number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input type="" {...field} />
                  </FormControl>
                  <FormDescription>This is your student's contact person.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPersonNumber"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>Contact Person Number</FormLabel>
                  <FormControl className="w-full">
                    <PhoneInput
                      {...field}
                      value={parsePhoneNumber(field.value, "SG")?.formatInternational() ?? field.value}
                      defaultCountry="SG"
                      international
                    />
                  </FormControl>
                  <FormDescription>Enter your student's contact person phone number.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="parentMaritalStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent's Marital Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select marital status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {maritalStatuses.map((passType) => (
                      <SelectItem key={passType.value} value={passType.value}>
                        {passType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>This refers to the current marital status of the student's parents.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="livingWithWhom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Living with whom?</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter who your student is living with.</FormDescription>
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

export default StudentAddressContact;
