import AdvancedCalendarSelection from "@/components/ui/advanced-calendar-selection";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOpenHouseContext } from "@/context/open-house/open-house-student-context";
import { religions } from "@/data";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { StudentDetailsSchema, studentDetailsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInYears, format } from "date-fns";
import { Calendar as CalendarIcon, Info, Save } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useBeforeUnload } from "react-router";
import { toast } from "sonner";

const StudentDetails = memo(function StudentDetails({ setTabOpened }: { setTabOpened: (tab: string) => void }) {
  const { formState, setFormState } = useOpenHouseContext();

  const [isReligionOther, setIsReligionOther] = useState<boolean>(false);

  const form = useForm<StudentDetailsSchema>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      ...formState.studentInfo?.studentDetails,
    },
  });

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    setFormState({
      ...formState,
      studentInfo: {
        ...formState.studentInfo!,
        studentDetails: {
          ...debouncedValues,
        },
      },
    });

    form.reset(
      { ...debouncedValues },
      {
        keepErrors: true,
      },
    );
  }, [debouncedValues]);

  useEffect(() => {
    form.trigger();
  }, []);

  useBeforeUnload((e) => {
    e.preventDefault();
  });

  async function onSubmit(values: StudentDetailsSchema) {
    const age = differenceInYears(new Date(), values.birthDay);

    if (age < 3) {
      toast.info("Child must be at least 3 years old to enrol");
      form.setError("birthDay", {
        type: "manual",
        message: "Child must be at least 3 years old",
      });
      return;
    }

    setFormState({
      ...formState,
      studentInfo: {
        ...formState.studentInfo!,
        studentDetails: { ...values, isValid: true },
      },
    });

    toast.success("Student details saved!", {
      description: "You're now ready to fill out the Address & Contact tab.",
    });

    setTabOpened("address-contact");
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>This is your student's legal first name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="middleName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Middle name <span className="text-xs text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="" {...field} />
                </FormControl>
                <FormDescription>This is your student's legal middle name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>This is your student's legal last name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student's Preferred name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>This is your student's public display name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="birthDay"
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
                    <AdvancedCalendarSelection setDate={field.onChange} date={field.value} disablePastDates={false} />
                  </PopoverContent>
                </Popover>
                <FormDescription>Your student's date of birth</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    defaultValue={formState.studentInfo?.studentDetails?.gender}
                    onValueChange={field.onChange}
                    className="flex gap-2">
                    {[
                      ["Male", "Male"],
                      ["Female", "Female"],
                    ].map((option, index) => (
                      <FormItem className="flex items-center space-x-3 space-y-0" key={index}>
                        <FormControl>
                          <RadioGroupItem value={option[1]} />
                        </FormControl>
                        <FormLabel className="font-normal">{option[0]}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormDescription>Your student's gender</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <FormItem>
                    <FormLabel>Religion</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === "Other") {
                          setIsReligionOther(true);
                        } else {
                          form.reset({ ...form.getValues(), religionOther: undefined });
                          if (formState.studentInfo) formState.studentInfo.studentDetails.religionOther = undefined;
                          setIsReligionOther(false);
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
                    <FormDescription>Your student's religion</FormDescription>
                    <FormMessage />
                  </FormItem>
                  {(formState.studentInfo?.studentDetails?.religionOther || isReligionOther) && (
                    <FormField
                      control={form.control}
                      name="religionOther"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <Input placeholder="Please specify religion" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="primaryLanguage"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Primary language</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>Student speaks the language fluently</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nric"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>NRIC / FIN </FormLabel>

                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter your student’s NRIC or FIN</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <br />
        <Separator />
        <br />

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
        </div>
      </form>
    </Form>
  );
});

export default StudentDetails;
