import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from "@/components/ui/file-input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { languages, religions } from "@/data";
import { cn } from "@/lib/utils";
import { studentDetailsSchema, StudentDetailsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, CloudUpload, Paperclip, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function MyForm() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const [files, setFiles] = useState<File[] | null>(null);

  const dropZoneConfig: DropzoneOptions = {
    maxFiles: 1,
    disabled: false,
    maxSize: 1024 * 1024 * 4,
    multiple: false,
    accept: {
      "image/jpeg": [],
      "image/png": [],
    },
  };

  const form = useForm<StudentDetailsSchema>({
    resolver: zodResolver(studentDetailsSchema),
    defaultValues: {
      ...formState.studentInfo?.studentDetails,
    },
  });

  useEffect(() => {
    if (form.formState.errors.studentPhoto?.message != null) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [form.formState.errors.studentPhoto?.message]);

  function onSubmit(values: StudentDetailsSchema) {
    toast.success("Student details saved!", {
      description: "You're now ready to fill out the Address & Contact tab.",
    });

    if (formState.studentInfo?.addressContact == null) {
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
    } else {
      setFormState({
        studentInfo: {
          studentDetails: values,
          addressContact: {
            ...formState.studentInfo.addressContact,
          },
        },
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
        <FormField
          control={form.control}
          name="studentPhoto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select the Student's Photo</FormLabel>
              <FormControl>
                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  dropzoneOptions={dropZoneConfig}
                  className="relative bg-background rounded-lg">
                  <FileInput {...field} id="fileInput" className="bg-muted border-2 border-dashed">
                    <div className="flex items-center justify-center flex-col p-8 w-full ">
                      <CloudUpload className="text-gray-500 w-10 h-10" />
                      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>
                        &nbsp; or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or JPEG</p>
                    </div>
                  </FileInput>
                  <FileUploaderContent>
                    {files == null && formState.studentInfo?.studentDetails.studentPhoto && (
                      <div className="my-2 flex items-center justify-between px-1 rounded-md hover:bg-muted">
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-4 w-4 stroke-current" />
                          <span className="text-sm font-medium">
                            {formState.studentInfo.studentDetails.studentPhoto.split("\\").pop()}
                          </span>
                        </div>

                        <Trash2
                          className="h-4 w-4 "
                          onClick={() => {
                            form.setValue("studentPhoto", "");
                            setFiles([]);
                            setFormState({
                              ...formState,
                              studentInfo: {
                                ...formState.studentInfo!,
                                studentDetails: {
                                  ...formState.studentInfo!.studentDetails,
                                  studentPhoto: "",
                                },
                              },
                            });
                          }}
                        />
                      </div>
                    )}
                    {files &&
                      files.length > 0 &&
                      files.map((file, i) => (
                        <FileUploaderItem setValue={form.setValue} inputKey="studentPhoto" key={i} index={i}>
                          <Paperclip className="h-4 w-4 stroke-current" />
                          <span>{file.name}</span>
                        </FileUploaderItem>
                      ))}
                  </FileUploaderContent>
                </FileUploader>
              </FormControl>
              <FormDescription>Select a file to upload.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
