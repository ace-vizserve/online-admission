import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { updateEnrollmentApplicationDetails } from "@/actions/private";
import { sendEmailNotification } from "@/actions/send-email-notification";
import { DataField, EditModeToggle, SectionHeader } from "@/components/private/documents/shared";
import InputWithIcon from "@/components/private/student-profile/input-with-icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useSession from "@/hooks/use-session";
import { cn, extractSiblings, getChangedKeys, removeEmptyKeys } from "@/lib/utils";
import { FamilyInfo } from "@/types";
import { familyInformationSchema, FamilyInformationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDate } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import {
  BadgeInfo,
  Briefcase,
  Cake,
  CalendarIcon,
  Globe,
  Heart,
  Landmark,
  Mail,
  Phone,
  PlusCircle,
  Save,
  School,
  Smile,
  User,
  Users,
} from "lucide-react";
import { ReactElement, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

function OldFamilyInfo({ label, familyInformation }: { label: string; familyInformation: FamilyInfo }) {
  const [editMode, setEditMode] = useState<boolean>(false);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
          <p className="text-sm font-medium text-slate-500">
            View-only details about parents, guardian, and siblings. Enable edit mode to make changes.
          </p>
        </div>

        <EditModeToggle editMode={editMode} onEditModeChange={setEditMode} />
      </div>

      {editMode ? (
        <EditFamilyInformation familyInformation={familyInformation} />
      ) : (
        <ViewFamilyInformation familyInformation={familyInformation} />
      )}
    </div>
  );
}

function EditFamilyInformation({ familyInformation }: { familyInformation: FamilyInfo }) {
  const [searchParams] = useSearchParams();
  const { session } = useSession();
  const academicYear = searchParams.get("academicYear");
  const params = useParams();
  const queryClient = useQueryClient();
  const {
    fatherMiddleName,
    fatherMobile,
    motherMiddleName,
    motherMobile,
    guardianMiddleName,
    guardianMobile,
    guardianEmail,
    fatherEmail,
    motherEmail,
  } = familyInformation;
  const siblings = extractSiblings(familyInformation);
  const form = useForm<FamilyInformationSchema>({
    resolver: zodResolver(familyInformationSchema),
    defaultValues: {
      ...(removeEmptyKeys(familyInformation) as unknown as FamilyInformationSchema),
      fatherMiddleName: fatherMiddleName ? fatherMiddleName : undefined,
      fatherMobile: fatherMobile ? String(fatherMobile) : undefined,
      motherMiddleName: motherMiddleName ? motherMiddleName : undefined,
      motherMobile: motherMobile ? String(motherMobile) : undefined,
      guardianMiddleName: guardianMiddleName ? guardianMiddleName : undefined,
      guardianMobile: guardianMobile ? String(guardianMobile) : undefined,
      siblings: siblings as unknown as FamilyInformationSchema["siblings"],
      noFatherInfo: fatherEmail ? false : true,
      noGuardianInfo: guardianEmail ? false : true,
    },
  });
  const initialValuesRef = useRef(form.getValues());
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: FamilyInformationSchema) => {
      if (!academicYear || !params.id) return;

      return await updateEnrollmentApplicationDetails({ academicYear, enroleeNumber: params.id, enrollmentDetails });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["family-documents", params.id] });
      queryClient.invalidateQueries({ queryKey: ["student-profile", params.id] });

      if (initialValuesRef.current.fatherBirthDay) {
        initialValuesRef.current.fatherBirthDay = new Date(initialValuesRef.current.fatherBirthDay);
      }

      if (initialValuesRef.current.motherBirthDay) {
        initialValuesRef.current.motherBirthDay = new Date(initialValuesRef.current.motherBirthDay);
      }

      if (initialValuesRef.current.guardianBirthDay) {
        initialValuesRef.current.guardianBirthDay = new Date(initialValuesRef.current.guardianBirthDay);
      }

      const updatedSections = getChangedKeys(initialValuesRef.current, variables);
      const parentEmail = session?.user.email as string;
      const role = session?.user.user_metadata.relationship as string;
      if (!academicYear || !params.id) return;
      if (updatedSections.length) {
        await sendEmailNotification({
          parentEmail,
          role,
          updatedSections,
          section: "Parent/Guardian Information",
          academicYear,
          enroleeNumber: params.id,
        });
      }
      initialValuesRef.current = variables;
    },
  });

  const { append, fields } = useFieldArray({
    control: form.control,
    name: "siblings" as never,
  });

  const isMotherAccount = session?.user.user_metadata.relationship === "mother";

  const isFatherAccount = session?.user.user_metadata.relationship === "father";

  function onSubmit(values: FamilyInformationSchema) {
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

    if (values.fatherEmail && isFatherAccount) {
      const accountEmail = session.user.email;

      if (values.fatherEmail?.toLowerCase() !== accountEmail?.toLowerCase()) {
        toast.warning("Father's email mismatch!", {
          description: "Please enter your account email to correctly link the student to your account.",
        });
        form.setError("fatherEmail", {
          message: "Email must match your account to link the student.",
        });
        return;
      }
    }

    mutate(values);
  }

  return (
    <Form {...form}>
      <form className="space-y-12" onSubmit={form.handleSubmit(onSubmit)}>
        {/* FATHER SECTION */}
        {fatherEmail && (
          <Card className="border-none py-0 shadow-none bg-transparent">
            <SectionHeader title="Father's Details" icon={<User className="size-5" />} color="text-blue-600" />
            <CardContent className="px-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <FormField
                  control={form.control}
                  name="fatherFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherMiddleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Middle Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherPreferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Preferred Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherBirthDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Birthday
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherReligion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Religion
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Landmark className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Mail className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fatherMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Mobile Number
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
                  name="fatherNationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <LocationSelector
                          showStates={false}
                          currentCountry={field.value || "Singapore"}
                          onCountryChange={(v) => field.onChange(v?.name)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherNric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        NRIC/FIN
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<BadgeInfo className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Company
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Briefcase className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Occupation
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* MOTHER SECTION */}
        {motherEmail && (
          <Card className="border-none py-0 shadow-none bg-transparent">
            <SectionHeader title="Mother's Details" icon={<Heart className="size-5" />} color="text-rose-500" />
            <CardContent className="px-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <FormField
                  control={form.control}
                  name="motherFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherMiddleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Middle Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherPreferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Preferred Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherBirthDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Birthday
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherReligion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Religion
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Landmark className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Mail className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motherMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Mobile Number
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
                  name="motherNationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <LocationSelector
                          showStates={false}
                          currentCountry={field.value || "Singapore"}
                          onCountryChange={(v) => field.onChange(v?.name)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherNric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        NRIC/FIN
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<BadgeInfo className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Company
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Briefcase className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motherPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Occupation
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* GUARDIAN SECTION */}
        {guardianEmail && (
          <Card className="border-none py-0 shadow-none bg-transparent">
            <SectionHeader title="Guardian's Details" icon={<Users className="size-5" />} color="text-indigo-600" />
            <CardContent className="px-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <FormField
                  control={form.control}
                  name="guardianFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianMiddleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Middle Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianPreferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Preferred Name
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<User className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianBirthDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Birthday
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianReligion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Religion
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Landmark className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Mail className="size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianMobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Mobile Number
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
                  name="guardianNationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <LocationSelector
                          showStates={false}
                          currentCountry={field.value || "Singapore"}
                          onCountryChange={(v) => field.onChange(v?.name)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianNric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        NRIC/FIN
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<BadgeInfo className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Company
                      </FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Briefcase className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardianPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                        Occupation
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {siblings != null && siblings.length > 0 && (
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users className="size-5 text-purple-600" />
                  </div>

                  <CardTitle className="text-xl font-bold text-slate-900">Siblings Information</CardTitle>
                </div>
                <Button
                  type="button"
                  size={"lg"}
                  variant={"outline"}
                  onClick={() =>
                    append({
                      siblingBirthDay: new Date(),
                      siblingFullName: "",
                      siblingReligion: "",
                      siblingEducationOccupation: "",
                      siblingSchoolCompany: "",
                    })
                  }
                  className="gap-2 text-white hover:bg-green-600 hover:text-white bg-green-500 font-bold">
                  <PlusCircle className="size-4" /> Add Sibling
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 md:space-y-12 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-0 flex flex-col shadow-none border-none">
                  <CardHeader className="p-0 w-full ">
                    <CardTitle className="font-semibold text-xl">Sibling {index + 1} information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full ">
                      <FormField
                        control={form.control}
                        name={`siblings.${index}.siblingFullName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                              Full name
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`siblings.${index}.siblingBirthDay`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                              Date of birth
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground",
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
                              <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                                Religion
                              </FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>

                              <FormMessage />
                            </FormItem>
                          </div>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                      <FormField
                        control={form.control}
                        name={`siblings.${index}.siblingSchoolCompany`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                              School or Company Name
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`siblings.${index}.siblingEducationOccupation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400 ml-1">
                              School Level or Company Position
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            disabled={isPending}
            type="submit"
            size="lg"
            className="w-full py-8 rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 text-base font-bold">
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

function ViewFamilyInformation({ familyInformation }: { familyInformation: FamilyInfo }) {
  const siblings = extractSiblings(familyInformation);

  // Thin wrapper over the shared `DataField` component — kept as a function (rather than converting
  // every one of this view's ~40 call sites to JSX) so this migration doesn't have to hand-edit that
  // many call sites to get the duplication benefit of a single shared implementation.
  const renderDataField = (label: string, value: string | null | undefined, icon: ReactElement<{ className: string }>) => (
    <DataField label={label} value={value} icon={icon} />
  );

  return (
    <div className="space-y-16">
      {/* FATHER SECTION */}
      {familyInformation.fatherEmail && (
        <section className="space-y-6">
          <SectionHeader title="Father's Details" icon={<User className="size-5" />} color="text-blue-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            {renderDataField("First Name", familyInformation.fatherFirstName, <User />)}
            {renderDataField("Middle Name", familyInformation.fatherMiddleName, <User />)}
            {renderDataField("Last Name", familyInformation.fatherLastName, <User />)}
            {renderDataField("Preferred Name", familyInformation.fatherPreferredName, <Smile />)}
            {renderDataField(
              "Date of birth",
              familyInformation.fatherBirthDay ? formatDate(familyInformation.fatherBirthDay, "dd MMM yyyy") : null,
              <Cake />,
            )}
            {renderDataField("Religion", familyInformation.fatherReligion, <Landmark />)}
            {renderDataField("Email Address", familyInformation.fatherEmail, <Mail />)}
            {renderDataField("Mobile No.", familyInformation.fatherMobile, <Phone />)}
            {renderDataField("Nationality", familyInformation.fatherNationality, <Globe />)}
            {renderDataField(
              "NRIC/FIN",
              familyInformation.fatherNric
                ? familyInformation.fatherNric.slice(0, 3) + "****" + familyInformation.fatherNric.slice(-2)
                : null,
              <BadgeInfo />,
            )}
            {renderDataField("Company", familyInformation.fatherCompanyName, <Briefcase />)}
            {renderDataField("Occupation", familyInformation.fatherPosition, <Briefcase />)}
          </div>
        </section>
      )}

      {/* MOTHER SECTION */}
      {familyInformation.motherEmail && (
        <section className="space-y-6">
          <SectionHeader title="Mother's Details" icon={<Heart className="size-5" />} color="text-rose-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            {renderDataField("First Name", familyInformation.motherFirstName, <User />)}
            {renderDataField("Middle Name", familyInformation.motherMiddleName, <User />)}
            {renderDataField("Last Name", familyInformation.motherLastName, <User />)}
            {renderDataField("Preferred Name", familyInformation.motherPreferredName, <Smile />)}
            {renderDataField(
              "Date of birth",
              familyInformation.motherBirthDay ? formatDate(familyInformation.motherBirthDay, "dd MMM yyyy") : null,
              <Cake />,
            )}
            {renderDataField("Religion", familyInformation.motherReligion, <Landmark />)}
            {renderDataField("Email Address", familyInformation.motherEmail, <Mail />)}
            {renderDataField("Mobile No.", familyInformation.motherMobile, <Phone />)}
            {renderDataField("Nationality", familyInformation.motherNationality, <Globe />)}
            {renderDataField(
              "NRIC/FIN",
              familyInformation.motherNric
                ? familyInformation.motherNric.slice(0, 3) + "****" + familyInformation.motherNric.slice(-2)
                : null,
              <BadgeInfo />,
            )}
            {renderDataField("Company", familyInformation.motherCompanyName, <Briefcase />)}
            {renderDataField("Occupation", familyInformation.motherPosition, <Briefcase />)}
          </div>
        </section>
      )}

      {/* GUARDIAN SECTION (Conditional) */}
      {familyInformation.guardianEmail && (
        <section className="space-y-6">
          <SectionHeader title="Guardian's Details" icon={<Users className="size-5" />} color="text-indigo-600" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
            {renderDataField("First Name", familyInformation.guardianFirstName, <User />)}
            {renderDataField("Middle Name", familyInformation.guardianMiddleName, <User />)}
            {renderDataField("Last Name", familyInformation.guardianLastName, <User />)}
            {renderDataField("Preferred Name", familyInformation.guardianPreferredName, <Smile />)}
            {renderDataField(
              "Date of birth",
              familyInformation.guardianBirthDay ? formatDate(familyInformation.guardianBirthDay, "dd MMM yyyy") : null,
              <Cake />,
            )}
            {renderDataField("Religion", familyInformation.guardianReligion, <Landmark />)}
            {renderDataField("Email Address", familyInformation.guardianEmail, <Mail />)}
            {renderDataField("Mobile No.", familyInformation.guardianMobile, <Phone />)}
            {renderDataField("Nationality", familyInformation.guardianNationality, <Globe />)}
            {renderDataField(
              "NRIC/FIN",
              familyInformation.guardianNric
                ? familyInformation.guardianNric.slice(0, 3) + "****" + familyInformation.guardianNric.slice(-2)
                : null,
              <BadgeInfo />,
            )}
            {renderDataField("Company", familyInformation.guardianCompanyName, <Briefcase />)}
            {renderDataField("Occupation", familyInformation.guardianPosition, <Briefcase />)}
          </div>
        </section>
      )}

      {/* SIBLINGS SECTION */}
      {siblings && siblings.length > 0 && (
        <section className="space-y-6">
          <SectionHeader
            title="Sibling Records"
            icon={<Users className="size-5 text-purple-600" />}
            color="text-slate-700"
          />
          <div className="space-y-4">
            {siblings.map((sibling, index) => (
              <div
                key={index}
                className="space-y-8 md:space-y-12 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderDataField("Full Name", sibling.siblingFullName as string, <User />)}
                  {renderDataField(
                    "Date of Birth",
                    sibling.siblingBirthDay ? formatDate(sibling.siblingBirthDay as string, "dd/MM/yyyy") : null,
                    <Cake />,
                  )}
                  {renderDataField("Religion", sibling.siblingReligion as string, <Landmark />)}
                  <div className="lg:col-span-2">
                    {renderDataField("School / Company Name", sibling.siblingSchoolCompany as string, <School />)}
                  </div>
                  {renderDataField("Education/Occupation", sibling.siblingEducationOccupation as string, <Briefcase />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default OldFamilyInfo;
