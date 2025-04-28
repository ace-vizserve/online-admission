import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { languages, religions } from "@/data";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { studentDetailsSchema, StudentDetailsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function StudentDetails() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const props = useSupabaseUpload({
    bucketName: "test",
    path: "test",
    allowedMimeTypes: ["image/*"],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 4,
    upsert: true,
  });

  const form = useForm<StudentDetailsSchema>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      ...formState.studentInfo?.studentDetails,
    },
  });

  console.log(props.successes[0]);

  useEffect(() => {
    if (form.formState.errors.studentPhoto?.message != null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [form.formState.errors.studentPhoto?.message]);

  useEffect(() => {
    if (props.isSuccess && props.successes[0]) {
      form.setValue("studentPhoto", props.successes[0]);

      setFormState({
        studentInfo: {
          studentDetails: {
            ...(formState.studentInfo?.studentDetails as Omit<StudentDetailsSchema, "studentPhoto">),
            studentPhoto: props.successes[0],
          },
          addressContact: formState.studentInfo?.addressContact ?? {
            contactPerson: "",
            contactPersonNumber: "",
            countryCode: ["", ""],
            homePhone: "",
            livingWithWhom: "",
            parentsMaritalStatus: "",
            studentHomeAddress: "",
            studentPostalCode: "",
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isSuccess, props.successes, setFormState]);

  function onSubmit(values: StudentDetailsSchema) {
    toast.success("Student details saved!", {
      description: "You're now ready to fill out the Address & Contact tab.",
    });

    setFormState({
      studentInfo: {
        studentDetails: values,
        addressContact: {
          contactPerson: "",
          contactPersonNumber: "",
          countryCode: ["", ""],
          homePhone: "",
          livingWithWhom: "",
          parentsMaritalStatus: "",
          studentHomeAddress: "",
          studentPostalCode: "",
        },
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
        {formState.studentInfo?.studentDetails.studentPhoto != null ? (
          <div className="border-2 border-gray-300 rounded-lg p-6 text-center bg-card transition-colors duration-300 text-foreground">
            <Avatar className="h-20 w-20 mx-auto">
              <AvatarImage
                src={formState.studentInfo.studentDetails.studentPhoto}
                alt="student photo"
                className="object-cover"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <p className="mt-1 text-muted-foreground text-sm font-medium">Student photo</p>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="studentPhoto"
            render={() => (
              <FormItem>
                <FormLabel>Select the Student's Photo</FormLabel>
                <FormControl>
                  <Dropzone {...props}>
                    <DropzoneEmptyState />
                    <DropzoneContent label="Student photo" />
                  </Dropzone>
                </FormControl>
                <FormDescription>Select a file to upload.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>This is your student's legal last name.</FormDescription>
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
                <FormDescription>This is your student's legal middle name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>This is your student's legal last name.</FormDescription>
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
                <FormDescription>This is your student's public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <FormField
            control={form.control}
            name="studentBirthDate"
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
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormDescription>Your student's date of birth.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentGender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} className="flex gap-2">
                    {[
                      ["Male", "male"],
                      ["Female", "female"],
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
                <FormDescription>Select your gender</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
            <FormField
              control={form.control}
              name="studentReligion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Religion</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormDescription>Your student's religion.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentPrimaryLanguage"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Language</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full lg:max-w-[240px] justify-between",
                            !field.value && "text-muted-foreground"
                          )}>
                          {field.value
                            ? languages.find((language) => language.value === field.value)?.label
                            : "Select language"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0">
                      <Command>
                        <CommandInput placeholder="Search language..." />
                        <CommandList>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {languages.map((language) => (
                              <CommandItem
                                value={language.label}
                                key={language.value}
                                onSelect={() => {
                                  form.setValue("studentPrimaryLanguage", language.value);
                                }}>
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    language.value === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {language.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>This is the language the student speaking fluently.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="nricFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NRIC / FIN</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>Enter your student’s NRIC or FIN.</FormDescription>
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

export default StudentDetails;
