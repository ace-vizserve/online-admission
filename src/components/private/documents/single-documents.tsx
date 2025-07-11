import { updateEnrollmentApplicationDetails } from "@/actions/private";
import InputWithIcon from "@/components/private/student-profile/input-with-icon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import LocationSelector from "@/components/ui/location-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { maritalStatuses, religions } from "@/data";
import { cn } from "@/lib/utils";
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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

function SingleDocuments({ label, studentInformation }: { label: string; studentInformation: Student }) {
  const [editMode, setEditMode] = useState<boolean>(false);

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full space-y-2">
          <h1 className="font-bold text-2xl md:text-3xl">{editMode ? "Edit Student Information" : label}</h1>
          <p className="text-sm text-muted-foreground">
            Student's personal and household details. Read-only unless edit mode is on.
          </p>
        </div>

        <div className="w-full md:max-w-xs flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">Switch to {editMode ? "view" : "edit"} mode</p>
            <p className="text-xs text-muted-foreground">
              Enable {editMode ? "viewing" : "editing"} of student information.
            </p>
          </div>

          <Switch checked={editMode} onCheckedChange={setEditMode} />
        </div>
      </div>

      <Separator />

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
  const params = useParams();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: StudentAddressContactAndInformationSchema) => {
      const academicYear = searchParams.get("academicYear");

      if (!academicYear || !params.id) return;

      return await updateEnrollmentApplicationDetails({ academicYear, enroleeNumber: params.id, enrollmentDetails });
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["student-documents", params.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-profile", params.id],
      });
    },
  });
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
      <form className="space-y-8 py-6 xl:py-0" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="p-0 border-none shadow-none">
          <CardHeader className="p-0">
            <CardTitle className="font-bold text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="firstName"
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
                  name="middleName"
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
                  name="lastName"
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
                  name="preferredName"
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
                  name="birthDay"
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

              <div className="space-y-2">
                <Label>Age</Label>
                <InputWithIcon
                  readOnly={false}
                  value={`${age} years old`}
                  svgIcon={<CalendarDays className="text-muted-foreground size-4" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card className="p-0 border-none shadow-none">
          <CardHeader className="p-0">
            <CardTitle className="font-bold text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
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
                  name="contactPersonNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel>Contact Person Number</FormLabel>
                      <FormControl className="w-full">
                        <InputWithIcon svgIcon={<PhoneCall className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="homePhone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                      <FormLabel>Home Phone</FormLabel>
                      <FormControl className="w-full">
                        <InputWithIcon svgIcon={<Phone className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card className="p-0 border-none shadow-none">
          <CardHeader className="p-0">
            <CardTitle className="font-bold text-lg">Home & Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="homeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Address</FormLabel>
                      <FormControl>
                        <InputWithIcon
                          svgIcon={<LucideMapPinHouse className="text-muted-foreground size-4" />}
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
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<MapPin className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="livingWithWhom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Living With</FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Users className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card className="p-0 border-none shadow-none">
          <CardHeader className="p-0">
            <CardTitle className="font-bold text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup defaultValue={gender} onValueChange={field.onChange} className="flex gap-2">
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

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="nric"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NRIC/FIN</FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<BadgeInfo className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="parentMaritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value.trim()}>
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
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Nationality</FormLabel>
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
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="primaryLanguage"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Primary language</FormLabel>
                      <FormControl>
                        <InputWithIcon svgIcon={<Languages className="text-muted-foreground size-4" />} {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
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
                              setIsOtherReligion(true);
                            } else {
                              setIsOtherReligion(false);
                            }

                            field.onChange(value);
                          }}
                          defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
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
            </div>
          </CardContent>
        </Card>
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
  const maskedNric = nric.slice(0, 3) + "****" + nric.slice(7);

  return (
    <>
      <Card className="p-0 border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="font-bold text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <InputWithIcon readOnly value={firstName} svgIcon={<User className="text-muted-foreground size-4" />} />
            </div>

            <div className="space-y-2">
              <Label>Middle Name</Label>
              <InputWithIcon
                readOnly
                value={middleName || "N/A"}
                svgIcon={<User className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <InputWithIcon readOnly value={lastName} svgIcon={<User className="text-muted-foreground size-4" />} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preferred Name</Label>
              <InputWithIcon
                readOnly
                value={preferredName}
                svgIcon={<Smile className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <InputWithIcon
                readOnly
                value={formatDate(new Date(birthDay), "dd/MM/yyyy")}
                svgIcon={<Cake className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <InputWithIcon
                readOnly
                value={`${age} years old`}
                svgIcon={<CalendarDays className="text-muted-foreground size-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="p-0 border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="font-bold text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <InputWithIcon
                readOnly
                value={contactPerson}
                svgIcon={<Phone className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <InputWithIcon
                readOnly
                value={contactPersonNumber}
                svgIcon={<PhoneCall className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Home Phone</Label>
              <InputWithIcon readOnly value={homePhone} svgIcon={<Phone className="text-muted-foreground size-4" />} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="p-0 border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="font-bold text-lg">Home & Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Home Address</Label>
              <InputWithIcon
                readOnly
                value={homeAddress}
                svgIcon={<LucideMapPinHouse className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <InputWithIcon
                readOnly
                value={postalCode}
                svgIcon={<MapPin className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Living With</Label>
              <InputWithIcon
                readOnly
                value={livingWithWhom}
                svgIcon={<Users className="text-muted-foreground size-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="p-0 border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="font-bold text-lg">Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <InputWithIcon
                readOnly
                value={gender}
                svgIcon={<VenetianMask className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>NRIC/FIN</Label>
              <InputWithIcon
                readOnly
                value={maskedNric}
                svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Marital Status</Label>
              <InputWithIcon
                readOnly
                value={parentMaritalStatus}
                svgIcon={<HeartHandshake className="text-muted-foreground size-4" />}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nationality</Label>
              <InputWithIcon
                readOnly
                value={nationality}
                svgIcon={<Globe className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Primary Language</Label>
              <InputWithIcon
                readOnly
                value={primaryLanguage}
                svgIcon={<Languages className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Religion</Label>
              <InputWithIcon
                readOnly
                value={religion != "Other" ? religion : religionOther!}
                svgIcon={<BookOpenCheck className="text-muted-foreground size-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default SingleDocuments;
