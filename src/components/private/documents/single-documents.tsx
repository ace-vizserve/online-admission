import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Student } from "@/types";
import { differenceInYears, formatDate } from "date-fns";
import {
  BadgeInfo,
  BookOpenCheck,
  Cake,
  CalendarDays,
  Globe,
  HeartHandshake,
  Languages,
  LucideMapPinHouse,
  MapPin,
  Phone,
  PhoneCall,
  Smile,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import InputWithIcon from "@/components/private/student-profile/input-with-icon";

function SingleDocuments({ label, studentInformation }: { label: string; studentInformation: Student }) {
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
  } = studentInformation;

  const age = differenceInYears(new Date(), new Date(birthDay));

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          Review the student's personal and household details. All fields are read-only.
        </p>
      </div>

      <Separator />

      <Card className="p-0 border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="font-bold text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <InputWithIcon value={firstName} svgIcon={<User className="text-muted-foreground size-4" />} />
            </div>

            <div className="space-y-2">
              <Label>Middle Name</Label>
              <InputWithIcon value={middleName ?? "N/A"} svgIcon={<User className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <InputWithIcon value={lastName} svgIcon={<User className="text-muted-foreground size-4" />} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preferred Name</Label>
              <InputWithIcon value={preferredName} svgIcon={<Smile className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <InputWithIcon
                value={formatDate(new Date(birthDay), "PPP")}
                svgIcon={<Cake className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Age</Label>
              <InputWithIcon
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
              <InputWithIcon value={contactPerson} svgIcon={<Phone className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <InputWithIcon
                value={contactPersonNumber}
                svgIcon={<PhoneCall className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Home Phone</Label>
              <InputWithIcon value={homePhone} svgIcon={<Phone className="text-muted-foreground size-4" />} />
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
                value={homeAddress}
                svgIcon={<LucideMapPinHouse className="text-muted-foreground size-4" />}
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <InputWithIcon value={postalCode} svgIcon={<MapPin className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Living With</Label>
              <InputWithIcon value={livingWithWhom} svgIcon={<Users className="text-muted-foreground size-4" />} />
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
              <InputWithIcon value={gender} svgIcon={<VenetianMask className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>NRIC/FIN</Label>
              <InputWithIcon value={nric} svgIcon={<BadgeInfo className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Parent Marital Status</Label>
              <InputWithIcon
                value={parentMaritalStatus}
                svgIcon={<HeartHandshake className="text-muted-foreground size-4" />}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nationality</Label>
              <InputWithIcon value={nationality} svgIcon={<Globe className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Primary Language</Label>
              <InputWithIcon value={primaryLanguage} svgIcon={<Languages className="text-muted-foreground size-4" />} />
            </div>
            <div className="space-y-2">
              <Label>Religion</Label>
              <InputWithIcon value={religion} svgIcon={<BookOpenCheck className="text-muted-foreground size-4" />} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SingleDocuments;
// 