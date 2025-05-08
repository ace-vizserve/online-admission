import { getStudentDetails } from "@/actions/private";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Family, GroupedDocument, Student, StudentDetails } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { compareAsc, format } from "date-fns";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import {
  Cake,
  CalendarDaysIcon,
  CalendarFold,
  Eye,
  EyeOff,
  FolderOpen,
  MapPinIcon,
  Plus,
  User,
  UserCircleIcon,
  Users,
} from "lucide-react";
import { Link } from "react-router";

type ProfileProps = {
  studentNumber: string;
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

function Profile({ studentNumber }: ProfileProps) {
  const { data, isPending } = useQuery({
    queryKey: ["student-profile", studentNumber],
    queryFn: async () => {
      return await getStudentDetails({ studentNumber });
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

  if (data == null || !data.studentInformation.length) {
    return <NoData />;
  }

  return (
    <Tabs
      defaultValue={tabs[0].value}
      orientation="vertical"
      className="w-full flex flex-col xl:flex-row items-start gap-4 justify-center py-4 lg:py-6">
      <TabsList className="w-full xl:w-[250px] flex flex-col gap-1 h-max !bg-white">
        <div className="w-full mt-4 mb-2 md:mb-4 lg:mb-8 space-y-4 px-4">
          <Avatar className="size-28 mx-auto border">
            <AvatarImage src={data.idPicture.idPicture ?? "https://github.com/shadcn.png"} />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className="font-semibold text-black text-balance">{data.studentInformation[0].studentName}</p>
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
        <TabsContent className="w-full" key={tab.value} value={tab.value}>
          <InfoBox studentDetails={data} label={tab.name} value={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function InfoBox({ label, value, studentDetails }: { label: string; value: string; studentDetails: StudentDetails }) {
  const { familyInformation, groupedDocuments, studentInformation } = studentDetails;

  switch (value) {
    case "family-information":
      return <FamilyInformation label={label} familyInformation={familyInformation} />;
    case "student-information":
      return <StudentInformation label={label} studentInformation={studentInformation} />;
    case "student-documents":
      return <StudentDocuments label={label} documents={groupedDocuments} />;
    default:
      break;
  }
}

function StudentInformation({ label, studentInformation }: { label: string; studentInformation: Student[] }) {
  const { age, birthDate, currentSchoolYear, nationality, studentName } = studentInformation[0];

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section contains the student's personal details such as name, age, and current school year.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Student's name", value: studentName, icon: <UserCircleIcon className="size-4" /> },
          {
            label: "Current School Year",
            value: currentSchoolYear,
            icon: <CalendarFold className="size-4" />,
          },
          { label: "Age", value: `${age} years old`, icon: <CalendarDaysIcon className="size-4" /> },
          { label: "Birthdate", value: format(birthDate, "PP"), icon: <Cake className="size-4" /> },
          { label: "Nationality", value: nationality, icon: <MapPinIcon className="size-4" /> },
        ].map((item, index) => (
          <Card key={index} className="py-4">
            <CardHeader className="px-4 !gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={"outline"} className="rounded-full">
                    {item.label}
                  </Badge>
                </div>
                <Button size={"icon"}>{item.icon}</Button>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{item.value}</div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FamilyInformation({ label, familyInformation }: { label: string; familyInformation: Family[] }) {
  const { fatherFullName, guardianFullName, motherFullName, siblings } = familyInformation[0];

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's parents, guardian, and siblings.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Father's Name", value: fatherFullName ? fatherFullName : "N/A" },
          { label: "Mother's Name", value: motherFullName ? motherFullName : "N/A" },
          { label: "Guardian's Name", value: guardianFullName ? guardianFullName : "N/A" },
          {
            label: "Siblings",
            value: siblings.length
              ? siblings.map((sibling) => (
                  <ul className="space-y-2 text-sm font-medium">
                    <li className="w-full flex items-center justify-between">
                      <p>{sibling.fullName}</p>
                    </li>
                  </ul>
                ))
              : "N/A",
          },
        ].map((item, index) => (
          <Card key={index} className="py-4">
            <CardHeader className="px-4 !gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={"outline"} className="rounded-full">
                    {item.label}
                  </Badge>
                </div>
                <Button size={"icon"}>
                  <Users className="size-4" />
                </Button>
              </div>

              <div className=" text-sm font-medium text-muted-foreground">{item.value}</div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudentDocuments({ label, documents }: { label: string; documents: GroupedDocument[] }) {
  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {documents.map((doc, index) => (
          <Card key={index} className="py-4">
            <CardHeader className="px-4 !gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={"outline"} className="rounded-full text-xs">
                    {doc.label}
                  </Badge>
                </div>
                {doc.label === "Passport" && doc.expiry && (
                  <p className="text-xs font-medium text-muted-foreground">Expires {format(doc.expiry, "PP")}</p>
                )}

                {doc.label === "Pass" && doc.expiry && (
                  <p className="text-xs font-medium text-muted-foreground">Expires {format(doc.expiry!, "PP")}</p>
                )}
                {doc.status === "Uploaded" && (
                  <Badge className="bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 shadow-none rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" />
                    {doc.status}
                  </Badge>
                )}

                {doc.status === "Valid" && doc.expiry && compareAsc(new Date(), new Date(doc.expiry)) < 0 && (
                  <Badge className="bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 shadow-none rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" /> Valid
                  </Badge>
                )}

                {doc.label === "Passport" && doc.expiry && compareAsc(new Date(), new Date(doc.expiry)) >= 0 && (
                  <Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 shadow-none rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Expired
                  </Badge>
                )}

                {doc.label === "Pass" && doc.expiry && compareAsc(new Date(), new Date(doc.expiry)) >= 0 && (
                  <Badge className="bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 shadow-none rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Expired
                  </Badge>
                )}
              </div>

              {doc.file == null ? (
                <Button className="w-full text-xs" disabled size={"icon"}>
                  No file <EyeOff className="size-4" />
                </Button>
              ) : (
                <Link
                  target="_blank"
                  to={doc.file}
                  className={buttonVariants({
                    className: "w-full text-xs text-muted-foreground",
                  })}>
                  View document <Eye className="size-4" />
                </Link>
              )}
            </CardHeader>
          </Card>
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

export default Profile;
