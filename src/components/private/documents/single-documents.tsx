import { updateEnrollmentApplicationDetails } from "@/actions/private";
import { sendEmailNotification } from "@/actions/send-email-notification";
import InputWithIcon from "@/components/private/student-profile/input-with-icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { applicationTypes, maritalStatuses, religions } from "@/data";
import useSession from "@/hooks/use-session";
import { cn, getChangedKeys } from "@/lib/utils";
import { Student } from "@/types";
import { studentAddressContactAndInformationSchema, StudentAddressContactAndInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInYears, format, formatDate } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import {
  BadgeInfo,
  BookOpenCheck,
  Cake,
  CalendarDays,
  CalendarIcon,
  Check,
  FileText,
  Globe,
  HeartHandshake,
  Languages,
  LucideMapPinHouse,
  MapPin,
  Phone,
  PhoneCall,
  PlusCircle,
  Save,
  Smile,
  Trash2,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

function SingleDocuments({ label, studentInformation }: { label: string; studentInformation: Student }) {
  const [editMode, setEditMode] = useState<boolean>(false);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
          <p className="text-sm font-medium text-slate-500">
            Review the student's personal and household details. Enable edit mode to make changes.
          </p>
        </div>

        <div
          className={cn(
            "w-full md:max-w-xs flex items-center justify-between gap-4 rounded-xl border p-4 transition-all duration-200",
            editMode
              ? "bg-secondary/5 border-secondary/30 ring-1 ring-secondary/20"
              : "bg-primary/5 border-border hover:bg-primary/10",
          )}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", editMode ? "bg-secondary" : "bg-primary")} />
              <p className="text-sm font-semibold leading-none tracking-tight">
                {editMode ? "Editing Mode" : "Viewing Mode"}
              </p>
            </div>
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              {editMode ? "You can now modify student details." : "Switch to edit to update information."}
            </p>
          </div>

          <Switch
            checked={editMode}
            onCheckedChange={(checked) => {
              if (checked) {
                toast.info("Edit mode enabled!", {
                  description: "You can now modify the student details.",
                });
              } else {
                toast.info("View mode enabled!", {
                  description: "Fields are locked and cannot be edited.",
                });
              }

              setEditMode(checked);
            }}
            className="data-[state=checked]:bg-secondary cursor-pointer"
          />
        </div>
      </div>

      {editMode ? (
        <EditStudentInformation studentInformation={studentInformation} />
      ) : (
        <ViewStudentInformation studentInformation={studentInformation} />
      )}
    </div>
  );
}

function EditStudentInformation({ studentInformation }: { studentInformation: Student }) {
  const [searchParams] = useSearchParams();
  const { session } = useSession();
  const academicYear = searchParams.get("academicYear");
  const params = useParams();
  const queryClient = useQueryClient();
  const {
    nationality,
    middleName,
    birthDay,
    gender,
    contactPersonNumber,
    homePhone,
    postalCode,
    religionOther,
    residenceHistory,
  } = studentInformation;
  const [isOtherReligion, setIsOtherReligion] = useState<boolean>(religionOther ? true : false);

  const form = useForm<StudentAddressContactAndInformationSchema>({
    resolver: zodResolver(studentAddressContactAndInformationSchema),
    defaultValues: {
      ...(studentInformation as Omit<Student, "id" | "enroleePhoto">),
      middleName: middleName ? middleName : undefined,
      contactPersonNumber: String(contactPersonNumber),
      homePhone: String(homePhone),
      postalCode: String(postalCode),
      residenceHistory,
    },
  });

  const initialValuesRef = useRef(form.getValues());
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: StudentAddressContactAndInformationSchema) => {
      if (!academicYear || !params.id) return;

      return await updateEnrollmentApplicationDetails({ academicYear, enroleeNumber: params.id, enrollmentDetails });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-documents", params.id] });
      queryClient.invalidateQueries({ queryKey: ["student-profile", params.id] });

      initialValuesRef.current.birthDay = new Date(initialValuesRef.current.birthDay);

      const updatedSections = getChangedKeys(initialValuesRef.current, variables);
      const parentEmail = session?.user.email as string;
      const role = session?.user.user_metadata.relationship as string;
      if (!academicYear || !params.id) return;
      if (updatedSections.length) {
        await sendEmailNotification({
          parentEmail,
          role,
          updatedSections,
          section: "Student Information",
          academicYear,
          enroleeNumber: params.id,
        });
      }
      initialValuesRef.current = variables;
    },
  });

  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: "residenceHistory",
  });

  const age = differenceInYears(new Date(), birthDay);

  const isStpApplication = applicationTypes.includes(studentInformation.stpApplicationType || "");

  function onSubmit(values: StudentAddressContactAndInformationSchema) {
    if (values.birthDay) {
      const age = differenceInYears(new Date(), values.birthDay);

      if (age < 3) {
        toast.info("Child must be at least 3 years old to enrol");
        form.setError("birthDay", {
          type: "manual",
          message: "Child must be at least 3 years old",
        });
        return;
      }
    }

    mutate(values);
  }

  return (
    <Form {...form}>
      <form className="space-y-12 pb-10" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Section: Personal Identity */}
        <section className="space-y-4">
          <SectionHeader title="Personal Identity" icon={<User className="size-5 text-indigo-500" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon
                      className="bg-white border-slate-200"
                      svgIcon={<User className="text-muted-foreground size-4" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Middle Name
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon
                      className="bg-white border-slate-200"
                      svgIcon={<User className="text-muted-foreground size-4" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon
                      className="bg-white border-slate-200"
                      svgIcon={<User className="text-muted-foreground size-4" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Preferred Name
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon
                      className="bg-white border-slate-200"
                      svgIcon={<Smile className="text-muted-foreground size-4" />}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="birthDay"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Date of Birth
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full pl-3 text-left bg-white border-slate-200">
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">Age</Label>
              <InputWithIcon
                readOnly
                className="bg-white border-slate-200"
                value={`${age} years old`}
                svgIcon={<CalendarDays className="text-muted-foreground size-4" />}
              />
            </div>
          </div>
        </section>

        {/* Section: Contact & Household */}
        <section className="space-y-4">
          <SectionHeader title="Contact & Household" icon={<Phone className="size-5 text-indigo-500" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Primary Contact
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon svgIcon={<Phone className="size-4" />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactPersonNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Emergency Number
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon svgIcon={<PhoneCall className="size-4" />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="homePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Home Phone
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon svgIcon={<Phone className="size-4" />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormField
                control={form.control}
                name="homeAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                      Residential Address
                    </FormLabel>
                    <FormControl>
                      <InputWithIcon svgIcon={<LucideMapPinHouse className="size-4" />} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Postal Code
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon svgIcon={<MapPin className="size-4" />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="livingWithWhom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Living Arrangement
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon svgIcon={<Users className="size-4" />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Section: Legal & Diversity */}
        <section className="space-y-4">
          <SectionHeader title="Legal & Diversity" icon={<BadgeInfo className="size-5 text-indigo-500" />} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6 bg-slate-50/50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Gender
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      defaultValue={gender}
                      className="flex gap-4">
                      {["Male", "Female"].map((g) => (
                        <div
                          key={g}
                          className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                          <RadioGroupItem value={g} id={g} />
                          <Label htmlFor={g} className="font-bold text-slate-700">
                            {g}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nric"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    NRIC/FIN
                  </FormLabel>
                  <FormControl>
                    <InputWithIcon className="bg-white" svgIcon={<BadgeInfo className="size-4" />} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentMaritalStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider text-slate-400 ml-1">
                    Marital Status
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value.trim()}>
                    <FormControl>
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {maritalStatuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Student Nationality
                  </FormLabel>

                  <FormControl>
                    <LocationSelector
                      showStates={false}
                      currentCountry={nationality}
                      onCountryChange={(value) => field.onChange(value?.name)}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryLanguage"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 ml-1">
                    Primary language
                  </FormLabel>

                  <FormControl>
                    <InputWithIcon svgIcon={<Languages className="text-muted-foreground size-4" />} {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="religion"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase tracking-wider text-slate-400 ml-1">Religion</FormLabel>

                    <Select
                      onValueChange={(value) => {
                        if (value === "Other") {
                          setIsOtherReligion(true);
                        } else {
                          setIsOtherReligion(false);
                        }

                        field.onChange(value);
                      }}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white w-full">
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

                    <FormMessage />
                  </FormItem>

                  {isOtherReligion && (
                    <FormField
                      control={form.control}
                      name="religionOther"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<BookOpenCheck className="text-muted-foreground size-4" />}
                              placeholder="Please specify religion"
                              {...field}
                              value={field.value ?? ""}
                            />
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
        </section>

        {isStpApplication && (
          <>
            <section className="space-y-8">
              <SectionHeader title="Residence History" icon={<Globe className="size-5 text-indigo-500" />} />
              {fields.map((field, idx) => (
                <Card
                  key={field.id}
                  className="py-0 relative overflow-hidden border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md rounded-[2rem]">
                  {/* Decorative Index Header */}
                  <CardHeader className="bg-slate-50/80 px-8 !pt-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black">
                        {idx + 1}
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-800">Residence History</CardTitle>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        onClick={() => remove(idx)}>
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
                        name={`residenceHistory.${idx}.country`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <InputWithIcon
                                svgIcon={<Globe className="text-muted-foreground size-4" />}
                                placeholder="e.g. Philippines"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* City or Town */}
                      <FormField
                        control={form.control}
                        name={`residenceHistory.${idx}.cityOrTown`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City or Town</FormLabel>
                            <FormControl>
                              <InputWithIcon
                                svgIcon={<MapPin className="text-muted-foreground size-4" />}
                                placeholder="e.g. Makati City"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* From Year */}
                      <FormField
                        control={form.control}
                        name={`residenceHistory.${idx}.fromYear`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year you moved in</FormLabel>
                            <FormControl>
                              <InputWithIcon
                                svgIcon={<CalendarIcon className="text-muted-foreground size-4" />}
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
                        name={`residenceHistory.${idx}.toYear`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year you moved out</FormLabel>
                            <div className="flex flex-row items-center gap-3">
                              <div className="flex-1">
                                <FormControl>
                                  <InputWithIcon
                                    svgIcon={<CalendarIcon className="text-muted-foreground size-4" />}
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
                        name={`residenceHistory.${idx}.purposeOfStay`}
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Purpose of Stay</FormLabel>
                            <FormControl>
                              <InputWithIcon
                                svgIcon={<FileText className="text-muted-foreground size-4" />}
                                placeholder="e.g. Study, Work, Family, Tourism"
                                {...field}
                              />
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
            </section>

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
          </>
        )}

        <div className="pt-4">
          <Button
            disabled={isPending}
            size="lg"
            className="w-full py-8 rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 text-base font-bold"
            type="submit">
            {isPending ? (
              <DotPulse size={35} speed={1.3} color="white" />
            ) : (
              <>
                Save Changes
                <Save className="size-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ViewStudentInformation({ studentInformation }: { studentInformation: Student }) {
  const {
    nationality,
    firstName,
    lastName,
    middleName,
    birthDay,
    contactPerson,
    contactPersonNumber,
    gender,
    homeAddress,
    homePhone,
    livingWithWhom,
    nric,
    parentMaritalStatus,
    postalCode,
    preferredName,
    primaryLanguage,
    religion,
    religionOther,
  } = studentInformation;

  const age = differenceInYears(new Date(), new Date(birthDay));
  const maskedNric = nric ? nric.slice(0, 3) + "****" + nric.slice(7) : "";

  const isStpApplication = applicationTypes.includes(studentInformation.stpApplicationType || "");

  return (
    <div className="grid grid-cols-1 gap-12">
      {/* Section: Personal Identity */}
      <section className="space-y-4">
        <SectionHeader title="Personal Identity" icon={<User className="size-5 text-indigo-500" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <DataField label="First Name" value={firstName} icon={<User />} />
          <DataField label="Middle Name" value={middleName || undefined} icon={<User />} />
          <DataField label="Last Name" value={lastName} icon={<User />} />
          <DataField label="Preferred Name" value={preferredName} icon={<Smile />} />
          <DataField label="Date of Birth" value={formatDate(new Date(birthDay), "dd/MM/yyyy")} icon={<Cake />} />
          <DataField label="Age" value={`${age} Years Old`} icon={<CalendarDays />} />
        </div>
      </section>

      {/* Section: Contact & Household */}
      <section className="space-y-4">
        <SectionHeader title="Contact & Household" icon={<Phone className="size-5 text-indigo-500" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <DataField label="Primary Contact" value={contactPerson} icon={<Phone />} />
          <DataField label="Emergency Number" value={contactPersonNumber} icon={<PhoneCall />} />
          <DataField label="Home Phone" value={homePhone || "Not Provided"} icon={<Phone />} />
          <DataField label="Residential Address" value={homeAddress} icon={<LucideMapPinHouse />} />
          <DataField label="Postal Code" value={postalCode} icon={<MapPin />} />
          <DataField label="Living Arrangement" value={`Lives with ${livingWithWhom}`} icon={<Users />} />
        </div>
      </section>

      {/* Section: Legal & Diversity */}
      <section className="space-y-4">
        <SectionHeader title="Legal & Diversity" icon={<BadgeInfo className="size-5 text-indigo-500" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <DataField label="Gender" value={gender} icon={<VenetianMask />} />
          <DataField label="NRIC / Identity No." value={maskedNric} icon={<BadgeInfo />} />
          <DataField label="Marital Status (Parents)" value={parentMaritalStatus} icon={<HeartHandshake />} />
          <DataField label="Nationality" value={nationality} icon={<Globe />} />
          <DataField label="Native Language" value={primaryLanguage} icon={<Languages />} />
          <DataField
            label="Religion"
            value={religion !== "Other" ? religion : religionOther!}
            icon={<BookOpenCheck />}
          />
        </div>
      </section>

      {isStpApplication && (
        <section className="space-y-8">
          <SectionHeader title="Residence History" icon={<Globe className="size-5 text-indigo-500" />} />
          {studentInformation.residenceHistory?.map((residence, idx) => (
            <div key={idx} className="space-y-4">
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                <DataField label="Country" value={residence.country} icon={<Globe />} />
                <DataField label="City / Town" value={residence.cityOrTown} icon={<MapPin />} />
              </div>
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                <DataField label="From Year" value={String(residence.fromYear)} icon={<CalendarIcon />} />
                <DataField label="To Year" value={String(residence.toYear)} icon={<CalendarIcon />} />
              </div>
              <DataField label="Purpose of Stay" value={residence.purposeOfStay} icon={<FileText />} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/* Helper Component for Section Headers */
function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className="p-2 bg-indigo-50 rounded-lg">{icon}</div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

/* Helper Component for Data Fields */
function DataField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | undefined;
  icon: React.ReactElement<{ className: string }>;
}) {
  return (
    <div className="space-y-1.5 group">
      <Label className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">{label}</Label>
      <div className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 bg-white border-slate-200 group-hover:border-slate-300 shadow-sm">
        {React.cloneElement(icon, {
          className: "size-4 text-slate-400 shrink-0 group-hover:text-indigo-500 transition-colors",
        })}

        <span className="text-sm font-bold text-slate-700 truncate capitalize">{value}</span>
      </div>
    </div>
  );
}

export default SingleDocuments;
