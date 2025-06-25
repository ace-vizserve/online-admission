import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { motherInformationSchema, MotherInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowRight, Calendar as CalendarIcon, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function MotherInformation() {
  const { session } = useSession();
  const navigate = useNavigate();
  const { formState, setFormState, setCompletedTabs, setCurrentTab } = useEnrolNewStudentContext();

  const isMotherAccount = session?.user.user_metadata.relationship === "mother";

  const form = useForm<MotherInformationSchema>({
    resolver: zodResolver(motherInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.motherInfo,
      isValid: formState.familyInfo?.motherInfo?.isValid ?? false,
    },
  });

  function onSubmit(values: MotherInformationSchema) {
    if (isMotherAccount) {
      const accountEmail = session.user.email;

      if (values.motherEmail?.toLowerCase() !== accountEmail?.toLowerCase()) {
        toast.warning("Mother's email mismatch!", {
          description: "Please enter your account email to correctly link the student to your account.",
        });
        form.setError("motherEmail", {
          message: "Email must match your account to link the student.",
        });
        return;
      }
    }

    setFormState({
      ...formState,
      familyInfo: {
        ...formState.familyInfo!,
        motherInfo: { ...values, isValid: true },
      },
    });

    toast.success("Mother's information has been saved!", {
      description: "Make sure to double check everything",
    });
  }

  function proceedToNextStep() {
    if (!formState.familyInfo?.fatherInfo?.isValid) {
      toast.warning("Father's information not confirmed!", {
        description: "Please review and confirm all required fields before proceeding",
      });
      return;
    }

    if (!formState.familyInfo?.motherInfo?.isValid) {
      toast.warning("Mother's information not confirmed!", {
        description: "Please review and confirm all required fields before proceeding",
      });
      return;
    }

    setCompletedTabs("/enrol-student/new/family-info");
    setCurrentTab("/enrol-student/new/enrollment-info");
    navigate("/enrol-student/new/enrollment-info");
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
                  <Input {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother last name.</FormDescription>
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
                  <Input {...field} />
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
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
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
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter mother's religion</FormDescription>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="motherNationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Nationality</FormLabel>
                <FormControl>
                  <LocationSelector
                    showStates={false}
                    currentCountry={formState.studentInfo?.addressContact.nationality}
                    onCountryChange={(value) => field.onChange(value?.name)}
                  />
                </FormControl>
                <FormDescription>Select the country that best represents the mother's nationality.</FormDescription>
                <FormMessage />
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
                  <Input {...field} />
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
                    <Input {...field} />
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
                    <Input type="email" {...field} />
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
                  <Input {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter the student's mother work position.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            disabled={!formState.familyInfo?.motherInfo?.isValid}
            onClick={proceedToNextStep}
            size={"lg"}
            className="hidden lg:flex w-full p-8 gap-2 uppercase"
            type="button">
            Proceed to Next Step
            <ArrowRight />
          </Button>

          <Button
            disabled={!formState.familyInfo?.motherInfo?.isValid}
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

export default MotherInformation;
