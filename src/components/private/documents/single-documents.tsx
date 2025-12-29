import { updateEnrollmentApplicationDetails } from "@/actions/private";
import { sendEmailNotification } from "@/actions/send-email-notification";
import InputWithIcon from "@/components/private/student-profile/input-with-icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { maritalStatuses, religions } from "@/data";
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
  Globe,
  HeartHandshake,
  Languages,
  LucideMapPinHouse,
  MapPin,
  Phone,
  PhoneCall,
  Save,
  Smile,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
              : "bg-primary/5 border-border hover:bg-primary/10"
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
  const { nationality, middleName, birthDay, gender, contactPersonNumber, homePhone, postalCode, religionOther } =
    studentInformation;
  const [isOtherReligion, setIsOtherReligion] = useState<boolean>(religionOther ? true : false);

  const form = useForm<StudentAddressContactAndInformationSchema>({
    resolver: zodResolver(studentAddressContactAndInformationSchema),
    defaultValues: {
      ...(studentInformation as Omit<Student, "id" | "enroleePhoto">),
      middleName: middleName ? middleName : "N/A",
      contactPersonNumber: String(contactPersonNumber),
      homePhone: String(homePhone),
      postalCode: String(postalCode),
    },
  });

  const initialValuesRef = useRef(form.getValues());
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: StudentAddressContactAndInformationSchema) => {
      if (!academicYear || !params.id) return;

      return await updateEnrollmentApplicationDetails({ academicYear, enroleeNumber: params.id, enrollmentDetails });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["student-documents", params.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-profile", params.id],
      });
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

  const age = differenceInYears(new Date(), birthDay);

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

  return (
    <div className="grid grid-cols-1 gap-12">
      {/* Section: Personal Identity */}
      <section className="space-y-4">
        <SectionHeader title="Personal Identity" icon={<User className="size-5 text-indigo-500" />} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
          <DataField label="First Name" value={firstName} icon={<User />} />
          <DataField label="Middle Name" value={middleName || "—"} icon={<User />} />
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
  value: string;
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
