import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDaysIcon, MapPinIcon, User, UserCircleIcon, Users, UsersIcon } from "lucide-react";

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
  if (value === "family-information") {
    return (
      <div className="space-y-8 py-6 xl:py-0">
        <div className="space-y-2">
          <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
          <p className="text-sm text-muted-foreground">
            This section includes details about the student's parents, guardian, and siblings.
          </p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Father's Name</p>
                <div className="rounded-md bg-primary p-2">
                  <UsersIcon className="stroke-white size-4" />
                </div>
              </div>
              <p className="text-base font-semibold mt-1">Michael Doe</p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Mother's Name</p>
                <div className="rounded-md bg-primary p-2">
                  <UsersIcon className="stroke-white size-4" />
                </div>
              </div>
              <p className="text-base font-semibold mt-1">Sarah Doe</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Guardian</p>
                <div className="rounded-md bg-primary p-2">
                  <UsersIcon className="stroke-white size-4" />
                </div>
              </div>
              <p className="text-base font-semibold mt-1">Jane Smith</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">Siblings</p>
                <div className="rounded-md bg-primary p-2">
                  <UsersIcon className="stroke-white size-4" />
                </div>
              </div>
              <ul className="mt-4 text-sm">
                <li>
                  <p className="font-semibold mt-1">Emily Doe (Age 10)</p>
                </li>
                <li>
                  <p className="font-semibold mt-1">Jacob Doe (Age 8)</p>
                </li>
              </ul>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section contains the student's personal details such as name, age, and current school year.
        </p>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Name</p>
              <div className="rounded-md bg-primary p-2">
                <UserCircleIcon className="stroke-white size-4" />
              </div>
            </div>
            <p className="text-base font-semibold mt-1">John Doe</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Current School Year</p>
              <div className="rounded-md bg-primary p-2">
                <CalendarDaysIcon className="stroke-white size-4" />
              </div>
            </div>
            <p className="text-base font-semibold mt-1">2024–2025</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Age</p>
              <div className="rounded-md bg-primary p-2">
                <CalendarDaysIcon className="stroke-white size-4" />
              </div>
            </div>
            <p className="text-base font-semibold mt-1">12</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Birthdate</p>
              <div className="rounded-md bg-primary p-2">
                <CalendarDaysIcon className="stroke-white size-4" />
              </div>
            </div>
            <p className="text-base font-semibold mt-1">July 7, 2012</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">Nationality</p>
              <div className="rounded-md bg-primary p-2">
                <MapPinIcon className="stroke-white size-4" />
              </div>
            </div>
            <p className="text-base font-semibold mt-1">Filipino</p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

export default Profile;
