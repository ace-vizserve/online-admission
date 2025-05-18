import { getStudentDetails } from "@/actions/private";
import fileSvg from "@/assets/file.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractSiblings } from "@/lib/utils";
import { Document, FamilyInfo, Student, StudentDetails } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { differenceInYears, formatDate } from "date-fns";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import {
  BadgeInfo,
  BookOpenCheck,
  Briefcase,
  Cake,
  CalendarDays,
  EllipsisVertical,
  Eye,
  FolderOpen,
  Globe,
  HeartHandshake,
  Landmark,
  Languages,
  LucideMapPinHouse,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Plus,
  School,
  Smile,
  User,
  Users,
  VenetianMask,
} from "lucide-react";
import { ReactNode } from "react";
import { Link } from "react-router";

type ProfileProps = {
  studentID: string;
};

const tabs = [
  {
    name: "Student Information",
    value: "student-information",
    icon: User,
  },
  {
    name: "Family Information",
    value: "family-information",
    icon: Users,
  },
  {
    name: "Student Documents",
    value: "student-documents",
    icon: FolderOpen,
  },
];

function StudentFiles({ studentID }: ProfileProps) {
  const { data, isPending } = useQuery({
    queryKey: ["student-documents", studentID],
    queryFn: async () => {
      return await getStudentDetails({ studentID });
    },
  });

  if (isPending) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
        <p className="text-sm text-muted-foreground animate-pulse">Fetching students details...</p>
        <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
      </div>
    );
  }

  if (data == null) {
    return <NoData />;
  }

  const studentName = `${data.studentInformation[0].lastName}, ${data.studentInformation[0].firstName} ${
    data.studentInformation[0].middleName?.charAt(0) ?? ""
  }`;

  const studentNumber = data.studentInformation[0]?.studentNumber ?? "N/A";

  return (
    <Tabs
      defaultValue={tabs[0].value}
      orientation="vertical"
      className="w-full flex flex-col xl:flex-row items-start gap-4 justify-center py-4 lg:py-6">
      <TabsList className="w-full xl:w-[250px] flex flex-col gap-1 h-max !bg-white">
        <div className="w-full mt-4 mb-2 md:mb-4 lg:mb-8 space-y-4 px-4">
          <Avatar className="size-28 mx-auto border">
            <AvatarImage src={data.studentIDPicture.fileUrl ?? "https://github.com/shadcn.png"} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className="font-semibold text-black text-balance">{studentName}</p>
            <p className="text-sm text-muted-foreground font-semibold">Student # {studentNumber}</p>
          </div>
        </div>

        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="w-full p-3 md:p-4 data-[state=active]:bg-primary data-[state=active]:text-white">
            <tab.icon className="size-5" /> {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent className="w-full px-2" key={tab.value} value={tab.value}>
          <InfoBox studentDetails={data} label={tab.name} value={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function InfoBox({ label, value, studentDetails }: { label: string; value: string; studentDetails: StudentDetails }) {
  const { familyInformation, studentDocuments, studentInformation } = studentDetails;

  switch (value) {
    case "family-information":
      return <FamilyInformation label={label} familyInformation={familyInformation} />;
    case "student-information":
      return <StudentInformation label={label} studentInformation={studentInformation} />;
    case "student-documents":
      return <StudentDocuments label={label} documents={studentDocuments} />;
    default:
      break;
  }
}

function StudentInformation({ label, studentInformation }: { label: string; studentInformation: Student[] }) {
  const {
    nationality,
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    contactPerson,
    contactPersonNumber,
    gender,
    homeAddress,
    homePhone,
    livingWithWhom,
    nricFin,
    parentMaritalStatus,
    postalCode,
    preferredName,
    primaryLanguage,
    religion,
  } = studentInformation[0];

  const age = differenceInYears(new Date(), new Date(dateOfBirth));

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
                value={formatDate(dateOfBirth, "PPP")}
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
              <InputWithIcon value={nricFin} svgIcon={<BadgeInfo className="text-muted-foreground size-4" />} />
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

function FamilyInformation({ label, familyInformation }: { label: string; familyInformation: FamilyInfo[] }) {
  const {
    motherDateOfBirth,
    motherEmail,
    motherFirstName,
    motherLastName,
    motherMiddleName,
    motherMobilePhone,
    motherNationality,
    motherNricFin,
    motherPreferredName,
    motherReligion,
    motherWorkCompany,
    motherWorkPosition,
    fatherEmail,
    fatherDateOfBirth,
    fatherFirstName,
    fatherLastName,
    fatherMiddleName,
    fatherMobilePhone,
    fatherNationality,
    fatherNricFin,
    fatherPreferredName,
    fatherReligion,
    fatherWorkCompany,
    fatherWorkPosition,
    guardianDateOfBirth,
    guardianReligion,
    guardianEmail,
    guardianFirstName,
    guardianLastName,
    guardianMiddleName,
    guardianMobilePhone,
    guardianNationality,
    guardianNricFin,
    guardianPreferredName,
    guardianWorkCompany,
    guardianWorkPosition,
  } = familyInformation[0];

  const siblings = extractSiblings(familyInformation[0]);

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's parents, guardian, and siblings. All fields are read-only.
        </p>
      </div>

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
                    value={fatherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    value={fatherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    value={fatherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    value={fatherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    value={fatherDateOfBirth ? formatDate(fatherDateOfBirth, "PPP") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    value={fatherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    value={fatherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    value={fatherMobilePhone ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    value={fatherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Father's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={fatherNricFin ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={fatherWorkCompany ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={fatherWorkPosition ?? "N/A"}
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
                    value={motherFirstName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <InputWithIcon
                    value={motherMiddleName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <InputWithIcon
                    value={motherLastName ?? "N/A"}
                    svgIcon={<User className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Name</Label>
                  <InputWithIcon
                    value={motherPreferredName ?? "N/A"}
                    svgIcon={<Smile className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <InputWithIcon
                    value={motherDateOfBirth ? formatDate(motherDateOfBirth, "PPP") : "N/A"}
                    svgIcon={<Cake className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <InputWithIcon
                    value={motherReligion ?? "N/A"}
                    svgIcon={<Landmark className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <InputWithIcon
                    value={motherEmail ?? "N/A"}
                    svgIcon={<Mail className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <InputWithIcon
                    value={motherMobilePhone ?? "N/A"}
                    svgIcon={<Phone className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <InputWithIcon
                    value={motherNationality ?? "N/A"}
                    svgIcon={<Globe className="text-muted-foreground size-4" />}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Mother’s Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={motherNricFin ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={motherWorkCompany ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={motherWorkPosition ?? "N/A"}
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
                    value={guardianDateOfBirth ? formatDate(guardianDateOfBirth, "PPP") : "N/A"}
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

          <Separator />

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
                    value={guardianMobilePhone ?? "N/A"}
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

          <Separator />

          <Card className="p-0 border-none shadow-none">
            <CardHeader className="p-0">
              <CardTitle className="font-bold text-lg">Guardian's Work Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>NRIC/FIN</Label>
                  <InputWithIcon
                    value={guardianNricFin ?? "N/A"}
                    svgIcon={<BadgeInfo className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <InputWithIcon
                    value={guardianWorkCompany ?? "N/A"}
                    svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <InputWithIcon
                    value={guardianWorkPosition ?? "N/A"}
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
            <CardContent className="space-y-4 p-0">
              {siblings.map((sibling, index) => (
                <div key={index} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <InputWithIcon
                        value={(sibling.siblingFullName as string) ?? "N/A"}
                        svgIcon={<User className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <InputWithIcon
                        value={
                          sibling.siblingDateOfBirth ? formatDate(sibling.siblingDateOfBirth as string, "PPP") : "N/A"
                        }
                        svgIcon={<Cake className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Religion</Label>
                      <InputWithIcon
                        value={(sibling.siblingReligion as string) ?? "N/A"}
                        svgIcon={<Landmark className="text-muted-foreground size-4" />}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>School Level / Company Position</Label>
                      <InputWithIcon
                        value={(sibling.siblingSchoolLevelOrCompanyPosition as string) ?? "N/A"}
                        svgIcon={<Briefcase className="text-muted-foreground size-4" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>School / Company Name</Label>
                      <InputWithIcon
                        value={(sibling.siblingSchoolOrCompanyName as string) ?? "N/A"}
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
    </div>
  );
}

function StudentDocuments({ label, documents }: { label: string; documents: Document[] }) {
  const documentThatExpire = documents.filter((doc) => /(passport|pass)/i.test(doc.documentType));
  const documentsThatDoNotExpire = documents.filter((doc) => !/(passport|pass)/i.test(doc.documentType));

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      <h2 className="font-bold text-lg">Documents That Expire</h2>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {documentThatExpire.map((doc) => (
          <div
            key={doc.id}
            className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={doc.status as StatusProps} />
              {doc.documentType == "Pass" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                      <EllipsisVertical />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Student Pass</h4>
                        <p className="text-xs text-muted-foreground">See the details of the Student's Pass.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passType" className="text-xs">
                            Pass Type
                          </Label>
                          <Input
                            id="passType"
                            defaultValue={doc.passType!.replace("_", " ")}
                            className="col-span-2 h-8 capitalize"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passExpirationDate" className="text-xs">
                            Expires at
                          </Label>
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(doc.passExpirationDate!, "PPP")}
                            className="col-span-2 h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {doc.documentType == "Passport" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                      <EllipsisVertical />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="grid gap-4">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">Student Passport</h4>
                        <p className="text-xs text-muted-foreground">See the details of the Student's Passport.</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passType" className="text-xs">
                            Passport #
                          </Label>
                          <Input
                            id="passType"
                            defaultValue={doc.passportNumber!}
                            className="col-span-2 h-8 uppercase"
                            readOnly
                          />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="passExpirationDate" className="text-xs">
                            Expires at
                          </Label>
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(doc.passportExpirationDate!, "PPP")}
                            className="col-span-2 h-8"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">{doc.documentType}</p>

            <Link
              to={doc.fileUrl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs  w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        ))}
      </div>

      <Separator />

      <h2 className="font-bold text-lg">Permanent Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {documentsThatDoNotExpire.map((doc) => (
          <div
            key={doc.id}
            className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <div className="pt-4 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
              <StatusBadge className="absolute -top-2" status={doc.status as StatusProps} />
            </div>
            <p className="text-muted-foreground font-medium text-sm">{doc.documentType}</p>

            <Link
              to={doc.fileUrl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 text-xs w-full",
                variant: "secondary",
              })}>
              View document <Eye />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoData() {
  return (
    <div className="w-full h-[80vh] flex items-center justify-center flex-col gap-4 text-center px-4">
      <div className="p-4 border bg-muted rounded-full">
        <FolderOpen className="size-12 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">No data to show here</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Looks like there's nothing yet. Once you add a student, they'll appear here.
        </p>
      </div>

      <Link
        to={"/enrol-student"}
        className={buttonVariants({
          variant: "outline",
          className: "mt-2 gap-2",
        })}>
        <Plus className="w-4 h-4 mr-2" />
        Add New Student
      </Link>
    </div>
  );
}

function InputWithIcon({ svgIcon, value }: { value: string; svgIcon: ReactNode }) {
  return (
    <div className="relative flex items-center rounded-md outline focus-within:ring-1 focus-within:ring-ring pl-2">
      {svgIcon}
      <Input defaultValue={value} readOnly className="border-0 focus-visible:ring-0 shadow-none text-sm font-medium" />
    </div>
  );
}

export default StudentFiles;
