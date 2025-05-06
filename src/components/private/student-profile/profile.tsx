import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cake,
  CalendarDaysIcon,
  CalendarFold,
  Eye,
  FolderOpen,
  MapPinIcon,
  User,
  UserCircleIcon,
  Users,
} from "lucide-react";

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

function Profile({ studentID }: ProfileProps) {
  console.log(studentID);

  return (
    <Tabs
      defaultValue={tabs[0].value}
      orientation="vertical"
      className="w-full flex flex-col xl:flex-row items-start gap-4 justify-center py-4 lg:py-6">
      <TabsList className="w-full xl:w-[250px] flex flex-col gap-1 h-max !bg-white">
        <div className="w-full mt-4 mb-2 md:mb-4 lg:mb-8 space-y-4 px-4">
          <Avatar className="size-24 mx-auto">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-black">John Doe</p>
            <p className="text-xs text-muted-foreground font-medium">johndoe@example.com</p>
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
          <InfoBox label={tab.name} value={tab.value} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  switch (value) {
    case "family-information":
      return <FamilyInformation label={label} />;
    case "student-information":
      return <StudentInformation label={label} />;
    case "student-documents":
      return <StudentDocuments label={label} />;
    default:
      break;
  }
}

function StudentInformation({ label }: { label: string }) {
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
          { label: "Student's name", value: "John Doe", icon: <UserCircleIcon className="size-4" /> },
          {
            label: "Current School Year",
            value: "2024–2025",
            icon: <CalendarFold className="size-4" />,
          },
          { label: "Age", value: "12 years old", icon: <CalendarDaysIcon className="size-4" /> },
          { label: "Birthdate", value: "July 7, 2012", icon: <Cake className="size-4" /> },
          { label: "Nationality", value: "Filipino", icon: <MapPinIcon className="size-4" /> },
        ].map((item, index) => (
          <Card key={index} className="py-4">
            <CardHeader className="px-4 !gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={"outline"} className="rounded-full">
                    {item.label}
                  </Badge>
                </div>
                <Button size={"icon"} variant={"outline"}>
                  {item.icon}
                </Button>
              </div>
              <div className="text-sm font-semibold text-muted-foreground">{item.value}</div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FamilyInformation({ label }: { label: string }) {
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
          { label: "Father's Name", value: "Michael Doe", created: new Date() },
          { label: "Mother's Name", value: "Sarah Doe", created: new Date() },
          { label: "Guardian's Name", value: "Jane Smith", created: new Date() },
          {
            label: "Siblings",
            value: (
              <ul className="space-y-2 text-sm font-semibold">
                <li className="w-full flex items-center justify-between">
                  <p>Emily Doe</p>
                  <p> Age 10</p>
                </li>
                <li className="w-full flex items-center justify-between">
                  <p>Jacob Doe</p>
                  <p> Age 8</p>
                </li>
              </ul>
            ),
            created: new Date(), // You can adjust this if you want to display specific dates for siblings or any other data
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
                <Button size={"icon"} variant={"outline"}>
                  <Users className="size-4" />
                </Button>
              </div>

              <div className=" text-sm font-semibold text-muted-foreground">{item.value}</div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StudentDocuments({ label }: { label: string }) {
  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Birth Certificate", "Transcript of Records", "Form 12", "Medical Exam", "Passport", "Pass"].map(
          (doc, index) => (
            <Card key={index} className="py-4">
              <CardHeader className="px-4 !gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={"outline"} className="rounded-full text-">
                      {doc}
                    </Badge>
                  </div>
                  <Button size={"icon"} variant={"outline"}>
                    <Eye className="size-4" />
                  </Button>
                </div>
                <div className="w-full flex items-start justify-between">
                  {doc === "Passport" || doc === "Pass" ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Created {new Date().toLocaleDateString()}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Expires {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-muted-foreground">
                      Created {new Date().toLocaleDateString()}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground">3.2MB</p>
                </div>
              </CardHeader>
            </Card>
          )
        )}
      </div>
    </div>
  );
}

export default Profile;
