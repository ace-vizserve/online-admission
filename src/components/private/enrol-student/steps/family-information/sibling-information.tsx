import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { religions } from "@/data";
import { cn } from "@/lib/utils";
import { siblingInformationSchema, SiblingInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, MinusCircle, PlusCircle, Save } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

function SiblingInformation() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const [siblingOtherReligions, setSiblingOtherReligions] = useState<Record<number, boolean>>({});
  const form = useForm<SiblingInformationSchema>({
    resolver: zodResolver(siblingInformationSchema),
    defaultValues: {
      ...formState.familyInfo?.siblingsInfo,
    },
  });
  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "siblings" as never,
  });

  const onSubmit = (values: SiblingInformationSchema) => {
    toast.success("Sibling information saved!", {
      description: "Make sure to double check everything",
    });
    setFormState({
      familyInfo: {
        ...formState.familyInfo!,
        siblingsInfo: values,
      },
    });
  };

  return (
    <>
      {!fields.length ? (
        <EmptySibling />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto">
            {fields.map((field, index) => (
              <Card key={field.id} className="flex flex-col space-y-8 shadow-none border-none">
                <CardHeader className="w-full flex items-center justify-between">
                  <CardTitle className="font-semibold text-xl">Sibling {index + 1} information</CardTitle>
                  <Button
                    variant="outline"
                    className="w-fit ml-auto gap-2 text-destructive hover:text-red-700 hover:bg-red-50 transition-colors"
                    onClick={() => remove(index)}>
                    <MinusCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Remove</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full ">
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingFullName`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>Enter the student's sibling full name.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingDateOfBirth`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
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
                          <FormDescription>Enter the student's sibling birth date.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingReligion`}
                      render={({ field }) => (
                        <div className="flex flex-col gap-2">
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                setSiblingOtherReligions((prev) => ({
                                  ...prev,
                                  [index]: value === "other",
                                }));

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
                          {(siblingOtherReligions[index] ||
                            formState.familyInfo?.siblingsInfo?.siblings[index].siblingOtherReligion) && (
                            <FormField
                              control={form.control}
                              name={`siblings.${index}.siblingOtherReligion`}
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingSchoolOrCompanyName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School or Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>Enter the student's sibling school or company name.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`siblings.${index}.siblingSchoolLevelOrCompanyPosition`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Level or Company Position</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the student's sibling school level or company position.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant={"secondary"}
              size={"lg"}
              className="mb-4 hidden lg:flex w-full p-8 gap-2 uppercase"
              type="submit">
              Save
              <Save />
            </Button>

            <Button variant={"secondary"} className="mb-4 flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
              Save
              <Save />
            </Button>
          </form>
        </Form>
      )}

      <Button
        size={"lg"}
        className="hidden lg:flex w-full p-8 gap-2 uppercase mx-auto max-w-5xl"
        onClick={() =>
          append({
            siblingDateOfBirth: new Date(),
            siblingFullName: "",
            siblingReligion: "",
            siblingSchoolLevelOrCompanyPosition: "",
            siblingSchoolOrCompanyName: "",
          })
        }>
        Add Sibling
        <PlusCircle />
      </Button>

      <Button
        className="flex lg:hidden w-full p-8 gap-2 uppercase mx-auto max-w-5xl"
        onClick={() =>
          append({
            siblingDateOfBirth: new Date(),
            siblingFullName: "",
            siblingReligion: "",
            siblingSchoolLevelOrCompanyPosition: "",
            siblingSchoolOrCompanyName: "",
          })
        }>
        Add Sibling
        <PlusCircle />
      </Button>
    </>
  );
}

function EmptySibling() {
  return (
    <Card className="h-screen max-h-[400px] bg-muted w-full max-w-5xl mx-auto mb-4">
      <CardContent className="h-full flex flex-col items-center justify-center text-center p-6">
        <PlusCircle className="w-8 h-8 mb-2" />
        <p className="mb-1 font-medium">No siblings added yet.</p>
        <span className="text-sm text-muted-foreground">Click the button below to add a sibling.</span>
      </CardContent>
    </Card>
  );
}

export default SiblingInformation;
