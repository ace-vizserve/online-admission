import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { maritalStatuses } from "@/data";
import { useAutoSave } from "@/hooks/use-autosave";
import { useDebounce } from "@/hooks/use-debounce";
import { studentAddressContactSchema, StudentAddressContactSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Info, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";

function StudentAddressContact() {
  const { formState, setFormState, setCompletedTabs, setCurrentTab, setActiveTab } = useEnrolNewLearnerContext();
  const navigate = useNavigate();

  const form = useForm<StudentAddressContactSchema>({
    resolver: zodResolver(studentAddressContactSchema),
    defaultValues: {
      ...formState.studentInfo?.addressContact,
    },
  });

  function onSubmit(values: StudentAddressContactSchema) {
    setFormState({
      studentInfo: {
        studentDetails: { ...formState.studentInfo!.studentDetails },
        addressContact: { ...values, isValid: true },
      },
    });
    toast.success("Student Address & Contact details saved!", {
      description: "Please double check everything before proceeding.",
    });
  }

  function proceedToNextStep() {
    if (!Object.keys(formState).length) {
      toast.warning("Student Details is missing!", {
        description: "Please fill out all required fields to move forward.",
      });
      return;
    }
    if (!formState.studentInfo?.studentDetails?.isValid) {
      toast.warning("Student Details is missing!", {
        description: "Please fill out all required fields to move forward.",
      });
      return;
    }

    if (!formState.studentInfo?.addressContact?.isValid) {
      toast.warning("Student Address & Contact invalid!", {
        description:
          "Please check the student’s address and contact details and correct any missing or invalid information.",
      });
      return;
    }

    setCompletedTabs("/vizschool/enrol-student/new/student-info");
    setCurrentTab("/vizschool/enrol-student/new/family-info");
    setActiveTab("/vizschool/enrol-student/new/family-info");
    navigate("/vizschool/enrol-student/new/family-info");
  }

  const debouncedAutoSaveValue = useDebounce(form.watch(), 500);

  useAutoSave(
    setFormState,
    {
      ...formState,
      studentInfo: {
        studentDetails: { ...formState.studentInfo?.studentDetails },
        addressContact: { ...debouncedAutoSaveValue },
      },
    },
    0
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
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

        <FormField
          control={form.control}
          name="homeAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Home Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Student's current address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Student's address postal code.</FormDescription>
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
                    currentCountry={formState.studentInfo?.addressContact?.nationality}
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
                  <Input {...field} />
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
                  <FormDescription>Student's contact person.</FormDescription>
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
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Student's contact person phone number.</FormDescription>
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

        <div className="flex flex-col gap-4">
          <Button
            size={"lg"}
            className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
            type="submit">
            Save details
            <Save />
          </Button>

          <Button
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="submit">
            Save details
            <Save />
          </Button>

          <Button
            variant={"secondary"}
            onClick={proceedToNextStep}
            size={"lg"}
            className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
            type="button">
            Proceed to next step
            <ArrowRight />
          </Button>

          <Button
            variant={"secondary"}
            onClick={proceedToNextStep}
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="button">
            Proceed to next step
            <ArrowRight />
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default StudentAddressContact;
