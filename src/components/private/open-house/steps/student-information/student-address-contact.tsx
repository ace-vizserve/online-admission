import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOpenHouseContext } from "@/context/open-house/open-house-student-context";
import { applicationTypes, maritalStatuses } from "@/data";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { StudentAddressContactSchema, studentAddressContactSchema } from "@/zod-schema";
import { usePassTypeStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Globe, Info, PlusCircle, Trash2 } from "lucide-react";
import { memo, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useBeforeUnload } from "react-router";
import { toast } from "sonner";

const StudentAddressContact = memo(function StudentAddressContact({
  setTabOpened,
}: {
  setTabOpened: (tab: string) => void;
}) {
  const { formState, setFormState } = useOpenHouseContext();

  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const shouldShowResidenceHistory = applicationTypes.includes(stpApplicationType);

  const savedAddressContact = formState.studentInfo?.addressContact;

  const form = useForm<StudentAddressContactSchema>({
    resolver: zodResolver(studentAddressContactSchema),
    defaultValues: {
      ...savedAddressContact,
      residenceHistory: shouldShowResidenceHistory
        ? savedAddressContact?.residenceHistory && savedAddressContact.residenceHistory.length > 0
          ? savedAddressContact.residenceHistory
          : [
              {
                country: "",
                cityOrTown: "",
                fromYear: undefined as unknown as number,
                toYear: undefined as unknown as number,
              },
            ]
        : [],
    },
  });

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "residenceHistory",
  });

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    setFormState({
      ...formState,
      studentInfo: {
        ...formState.studentInfo!,
        addressContact: {
          ...form.watch(),
        },
      },
    });

    form.reset(
      { ...form.watch() },
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

  function proceedToNextStep(values: StudentAddressContactSchema) {
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

    setFormState({
      ...formState,
      studentInfo: {
        ...formState.studentInfo,
        addressContact: { ...values, isValid: true },
      },
    });

    toast.success("Student Address & Contact details saved!", {
      description: "Please double check everything before proceeding.",
    });

    setTabOpened("medical-information");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(proceedToNextStep, (errors) => {
          if (errors.nationality) {
            toast.error("Please select a student nationality!", {
              description: "Make sure to double check everything",
            });
          }
        })}
        className="space-y-8 max-w-5xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
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

        {shouldShowResidenceHistory && (
          <>
            <br />
            <br />
            <Separator />
            <div className="space-y-8 mt-6">
              <div className="mb-10 p-8 rounded-[2rem] bg-slate-50 border border-slate-100 relative overflow-hidden">
                {/* Decorative Background Icon - Gives it a modern, premium feel */}
                <Globe className="absolute -right-6 -top-6 size-40 text-slate-200/40 rotate-12" />

                {!formState.studentInfo?.addressContact?.isValid && (
                  <Badge variant={"destructive"} className="uppercase mb-6 rounded-full font-bold">
                    Action required
                  </Badge>
                )}

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                      <Globe className="size-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                      Where has your child <span className="text-primary">lived?</span>
                    </h2>
                  </div>

                  <div className="space-y-4 max-w-3xl">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      To process the Student’s Pass, the Immigration &amp; Checkpoints Authority (ICA) requires a record
                      of your child’s residence history. Please list the countries and cities where they have stayed for
                      one year or more in the last five years. You can refer to ICA’s Student’s Pass information at{" "}
                      <a
                        href="https://www.ica.gov.sg/reside/STP/apply"
                        target="_blank"
                        rel="noreferrer"
                        className="inline font-semibold text-primary underline underline-offset-2">
                        ICA website
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="py-0 relative overflow-hidden border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md rounded-[2rem]">
                  {/* Decorative Index Header */}
                  <CardHeader className="bg-slate-50/80 px-8 !pt-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-800">Residence History</CardTitle>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest">Remove</span>
                      </Button>
                    )}
                  </CardHeader>

                  <CardContent className="p-8 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {/* Country */}
                      <FormField
                        control={form.control}
                        name={`residenceHistory.${index}.country`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Philippines" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* City or Town */}
                      <FormField
                        control={form.control}
                        name={`residenceHistory.${index}.cityOrTown`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City or Town</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Makati City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* From Year */}
                      <FormField
                        control={form.control}
                        name={`residenceHistory.${index}.fromYear`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year you moved in</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="YYYY"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || e.target.value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* To Year */}
                      <FormField
                        control={form.control}
                        name={`residenceHistory.${index}.toYear`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year you moved out</FormLabel>
                            <div className="flex flex-row items-center gap-3">
                              <div className="flex-1">
                                <FormControl>
                                  <Input
                                    disabled={field.value === "Present"}
                                    placeholder={field.value === "Present" ? "Current Residence" : "YYYY"}
                                    value={field.value === "Present" ? "" : field.value || ""}
                                    onChange={(e) => field.onChange(e.target.valueAsNumber || e.target.value)}
                                  />
                                </FormControl>
                              </div>

                              <label
                                className={cn(
                                  "flex items-center gap-2 h-10 px-2 rounded-lg border-2 cursor-pointer transition-all duration-300 select-none whitespace-nowrap",
                                  field.value === "Present"
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300",
                                )}>
                                <div className="relative flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={field.value === "Present"}
                                    onChange={() => field.onChange(field.value === "Present" ? "" : "Present")}
                                  />
                                  <div
                                    className={cn(
                                      "size-4 rounded border flex items-center justify-center transition-colors",
                                      field.value === "Present" ? "bg-white border-white" : "border-slate-300 bg-white",
                                    )}>
                                    {field.value === "Present" && (
                                      <Check className="size-3 text-emerald-600 stroke-[4]" />
                                    )}
                                  </div>
                                </div>

                                <span className="text-[11px] font-black uppercase tracking-widest">Still here?</span>
                              </label>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`residenceHistory.${index}.purposeOfStay`}
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Purpose of Stay</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Study, Work, Family, Tourism" {...field} />
                            </FormControl>
                            <FormDescription>Briefly describe the reason for staying in this location.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex pt-4">
                <Button
                  type="button"
                  className="group !h-14 !px-8 rounded-xl"
                  onClick={() =>
                    append({
                      purposeOfStay: "",
                      country: "",
                      cityOrTown: "",
                      fromYear: undefined as unknown as number,
                      toYear: undefined as unknown as number,
                    })
                  }>
                  <PlusCircle className="mr-2 size-5 transition-transform group-hover:rotate-90" />
                  <span className="font-black uppercase tracking-widest text-xs">Add another residence</span>
                </Button>
              </div>
            </div>
          </>
        )}

        <br />
        <Separator />
        <br />

        <div className="flex flex-col gap-4">
          <Button
            size={"lg"}
            className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
            type="submit">
            Save & proceed to next step
            <ArrowRight />
          </Button>

          <Button
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="submit">
            Save & proceed to next step
            <ArrowRight />
          </Button>
        </div>
      </form>
    </Form>
  );
});

export default StudentAddressContact;
