import PageMetaData from "@/components/page-metadata";
import StudentAddressContact from "@/components/private/enrol-student/steps/student-information/student-address-contact";
import StudentDetails from "@/components/private/enrol-student/steps/student-information/student-details";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENROL_NEW_STUDENT_STUDENT_INFORMATION_TITLE_DESCRIPTION } from "@/data";
import { MapPin, User } from "lucide-react";

const tabs = [
  {
    name: "Student Details",
    value: "student-details",
    icon: User,
    component: StudentDetails,
  },
  {
    name: "Address & Contact",
    value: "address-contact",
    icon: MapPin,
    component: StudentAddressContact,
  },
];

function StudentInformation() {
  const { title, description } = ENROL_NEW_STUDENT_STUDENT_INFORMATION_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <Card className="flex-1 w-full border-none shadow-none p-0">
        <CardContent className="px-0">
          <StudentInformationTabs />
        </CardContent>
      </Card>
    </>
  );
}

function StudentInformationTabs() {
  return (
    <Tabs
      orientation="vertical"
      defaultValue={tabs[0].value}
      className="w-full h-full flex flex-col lg:flex-row items-start gap-8 md:gap-10 justify-center py-4">
      <TabsList className="grid grid-cols-2 lg:grid-cols-1 h-auto w-full lg:w-1/4 gap-4 bg-white">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="border shadow flex items-center justify-center gap-2 p-6 data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
            <tab.icon /> {tab.name}
          </TabsTrigger>
        ))}
      </TabsList>

      <Separator className="my-2 block lg:hidden" />
      <div className="h-full flex items-center justify-center w-full">
        {tabs.map((tab) => (
          <TabsContent className="w-max" key={tab.value} value={tab.value}>
            <tab.component />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

export default StudentInformation;
