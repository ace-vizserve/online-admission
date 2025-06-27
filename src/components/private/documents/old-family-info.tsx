import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { updateEnrollmentApplicationDetails } from "@/actions/private";
import InputWithIcon from "@/components/private/student-profile/input-with-icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn, extractSiblings, removeEmptyKeys } from "@/lib/utils";
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
  Landmark,
  Mail,
  Phone,
  PlusCircle,
  Save,
  School,
  Smile,
  User,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";

function OldFamilyInfo({ label, familyInformation }: { label: string; familyInformation: FamilyInfo }) {
  const [editMode, setEditMode] = useState<boolean>(false);

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-bold text-2xl md:text-3xl">{editMode ? "Edit Family Information" : label}</h1>
          <p className="text-sm text-muted-foreground text-balance">
            View-only details about parents, guardian, and siblings. Enable edit mode to make changes.
          </p>
        </div>

        <div className="w-full md:max-w-xs flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">Switch to {editMode ? "view" : "edit"} mode</p>
            <p className="text-xs text-muted-foreground">
              Enable&nbsp;{editMode ? "viewing" : "editing"}&nbsp;of&nbsp;student's&nbsp;family&nbsp;information.
            </p>
          </div>

          <Switch checked={editMode} onCheckedChange={setEditMode} />
        </div>
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
  const params = useParams();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: FamilyInformationSchema) => {
      const academicYear = searchParams.get("academicYear");

      if (!academicYear || !params.id) return;

      return await updateEnrollmentApplicationDetails({ academicYear, enroleeNumber: params.id, enrollmentDetails });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["student-documents", params.id],
      });
    },
  });

  const {
    fatherMiddleName,
    fatherMobile,
    motherMiddleName,
    motherMobile,
    guardianMiddleName,
    guardianMobile,
    fatherNationality,
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
    },
  });

  const { append, fields } = useFieldArray({
    control: form.control,
    name: "siblings" as never,
  });

  function onSubmit(values: FamilyInformationSchema) {
    mutate(values);
  }

  return (
    <Form {...form}>
      <form className="space-y-8 py-6 xl:py-0" onSubmit={form.handleSubmit(onSubmit)}>
        {fatherEmail && (
          <>
            <Separator />
            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Father's Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="fatherFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherMiddleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Middle Name <span className="text-xs text-muted-foreground">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="fatherPreferredName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Smile className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="fatherBirthDay"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherReligion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Landmark className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Father's Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="fatherEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Mail className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Phone className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherNationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Nationality</FormLabel>
                          <FormControl>
                            <LocationSelector
                              showStates={false}
                              currentCountry={fatherNationality ?? "Singapore"}
                              onCountryChange={(value) => field.onChange(value?.name)}
                            />
                          </FormControl>
                          <FormMessage />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Father's Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="fatherNric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NRIC/FIN</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="fatherPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {motherEmail && (
          <>
            <Separator />
            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Mother's Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="motherFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherMiddleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Middle Name <span className="text-xs text-muted-foreground">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="motherPreferredName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Smile className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="motherBirthDay"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherReligion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Landmark className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Mother's Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="motherEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Mail className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Phone className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherNationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Nationality</FormLabel>
                          <FormControl>
                            <LocationSelector
                              showStates={false}
                              currentCountry={fatherNationality ?? "Singapore"}
                              onCountryChange={(value) => field.onChange(value?.name)}
                            />
                          </FormControl>
                          <FormMessage />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Mother's Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="motherNric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NRIC/FIN</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="motherPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {guardianEmail && (
          <>
            <Separator />
            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Guardian's Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="guardianFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianMiddleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Middle Name <span className="text-xs text-muted-foreground">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<User className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="guardianPreferredName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Name</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Smile className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="guardianBirthDay"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
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
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianReligion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Religion</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Landmark className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Guardian's Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="guardianEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Mail className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianMobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <InputWithIcon svgIcon={<Phone className="text-muted-foreground size-4" />} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianNationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Nationality</FormLabel>
                          <FormControl>
                            <LocationSelector
                              showStates={false}
                              currentCountry={fatherNationality ?? "Singapore"}
                              onCountryChange={(value) => field.onChange(value?.name)}
                            />
                          </FormControl>
                          <FormMessage />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-0 border-none shadow-none">
              <CardHeader className="p-0">
                <CardTitle className="font-bold text-lg">Guardian's Work Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="guardianNric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NRIC/FIN</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="guardianPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <InputWithIcon
                              svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {siblings != null && siblings.length > 0 && (
          <>
            <Separator />

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
                          <FormLabel>Full name</FormLabel>
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
                            <FormLabel>Religion</FormLabel>
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
                          <FormLabel>School or Company Name</FormLabel>
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
                          <FormLabel>School Level or Company Position</FormLabel>
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

            <Button
              variant={"secondary"}
              disabled={fields.length >= 5}
              size={"lg"}
              className="my-4 hidden lg:flex w-full p-8 gap-2 uppercase mx-auto max-w-5xl"
              onClick={() =>
                append({
                  siblingBirthDay: new Date(),
                  siblingFullName: "",
                  siblingReligion: "",
                  siblingEducationOccupation: "",
                  siblingSchoolCompany: "",
                })
              }>
              Add Sibling
              <PlusCircle />
            </Button>

            <Button
              variant={"secondary"}
              className="my-4 flex lg:hidden w-full p-6 gap-2 uppercase mx-auto max-w-5xl"
              onClick={() =>
                append({
                  siblingBirthDay: new Date(),
                  siblingFullName: "",
                  siblingReligion: "",
                  siblingEducationOccupation: "",
                  siblingSchoolCompany: "",
                })
              }>
              Add Sibling
              <PlusCircle />
            </Button>
          </>
        )}

        <Button disabled={isPending} size={"lg"} className="hidden lg:flex w-full p-8 gap-2 uppercase" type="submit">
          {isPending ? (
            <>
              Saving
              <DotPulse size="30" speed="1.3" color="#FFF" />
            </>
          ) : (
            <>
              Save Changes
              <Save />
            </>
          )}
        </Button>

        <Button disabled={isPending} className="flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
          {isPending ? (
            <>
              Saving
              <DotPulse size="15" speed="1.3" color="#FFF" />
            </>
          ) : (
            <>
              Save Changes
              <Save />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

function ViewFamilyInformation({ familyInformation }: { familyInformation: FamilyInfo }) {
  const {
    motherBirthDay,
    motherEmail,
    motherFirstName,
    motherLastName,
    motherMiddleName,
    motherMobile,
    motherNationality,
    motherNric,
    motherPreferredName,
    motherReligion,
    motherCompanyName,
    motherPosition,
    fatherEmail,
    fatherBirthDay,
    fatherFirstName,
    fatherLastName,
    fatherMiddleName,
    fatherMobile,
    fatherNationality,
    fatherNric,
    fatherPreferredName,
    fatherReligion,
    fatherCompanyName,
    fatherPosition,
    guardianBirthDay,
    guardianReligion,
    guardianEmail,
    guardianFirstName,
    guardianLastName,
    guardianMiddleName,
    guardianMobile,
    guardianNationality,
    guardianNric,
    guardianPreferredName,
    guardianCompanyName,
    guardianPosition,
  } = familyInformation;

  const siblings = extractSiblings(familyInformation);

  const maskedFatherNric = fatherNric ? fatherNric.slice(0, 3) + "****" + fatherNric.slice(7) : undefined;
  const maskedGuardianNric = guardianNric ? guardianNric.slice(0, 3) + "****" + guardianNric.slice(7) : undefined;
  const maskedMotherNric = motherNric?.slice(0, 3) + "****" + motherNric?.slice(7);

  return (
    <>
      {fatherEmail && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherBirthDay ? formatDate(fatherBirthDay, "dd/MM/yyyy") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherMobile ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    readOnly
                    value={maskedFatherNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherCompanyName ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    readOnly
                    value={fatherPosition ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {motherEmail && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    readOnly
                    value={motherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    readOnly
                    value={motherBirthDay ? formatDate(motherBirthDay, "dd/MM/yyyy") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    readOnly
                    value={motherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    readOnly
                    value={motherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    readOnly
                    value={motherMobile ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    readOnly
                    value={motherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    readOnly
                    value={maskedMotherNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    readOnly
                    value={motherCompanyName ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    readOnly
                    value={motherPosition ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {guardianEmail && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <InputWithIcon
                    value={guardianFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    value={guardianMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    value={guardianLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    value={guardianPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    value={guardianBirthDay ? formatDate(guardianBirthDay, "dd/MM/yyyy") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    value={guardianReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    value={guardianEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    value={guardianMobile ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    value={guardianNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={maskedGuardianNric ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={guardianCompanyName ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={guardianPosition ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {siblings != null && siblings.length > 0 && (
        <>
          <Separator />
          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Sibling Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-12 p-0">
              {siblings.map((sibling, index) => (
                <div key={index} className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <InputWithIcon
                        readOnly
                        value={(sibling.siblingFullName as string) ?? "N/A"}
                        svgIcon={<User className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <InputWithIcon
                        readOnly
                        value={
                          sibling.siblingBirthDay ? formatDate(sibling.siblingBirthDay as string, "dd/MM/yyyy") : "N/A"
                        }
                        svgIcon={<Cake className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <InputWithIcon
                        readOnly
                        value={(sibling.siblingReligion as string) ?? "N/A"}
                        svgIcon={<Landmark className="text-muted-foreground size-4" />}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>School Level / Company Position</Label>
                      <InputWithIcon
                        readOnly
                        value={(sibling.siblingEducationOccupation as string) ?? "N/A"}
                        svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>School / Company Name</Label>
                      <InputWithIcon
                        readOnly
                        value={(sibling.siblingSchoolCompany as string) ?? "N/A"}
                        svgIcon={<School className="text-muted-foreground size-4" />}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

export default OldFamilyInfo;
