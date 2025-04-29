import PageMetaData from "@/components/page-metadata";
import FatherInformation from "@/components/private/enrol-student/tabs/family-information/father-information";
import GuardianInformation from "@/components/private/enrol-student/tabs/family-information/guardian-information";
import MotherInformation from "@/components/private/enrol-student/tabs/family-information/mother-information";
import SiblingInformation from "@/components/private/enrol-student/tabs/family-information/sibling-information";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION } from "@/data";
import { Baby, ShieldUser, User, Users } from "lucide-react";

const tabs = [
  {
    name: "Mother Information",
    skippable: false,
    value: "mother-information",
    icon: User,
    component: MotherInformation,
  },
  {
    name: "Father Information",
    skippable: true,
    value: "father-information",
    icon: Users,
    component: FatherInformation,
  },
  {
    name: "Guardian Information",
    skippable: true,
    value: "guardian-information",
    icon: ShieldUser,
    component: GuardianInformation,
  },
  {
    name: "Sibling Information",
    skippable: true,
    value: "sibling-information",
    icon: Baby,
    component: SiblingInformation,
  },
];

function OldFamilyInformation() {
  const { title, description } = ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <Card className="flex-1 w-full border-none shadow-none p-0">
        <CardContent className="px-0">
          <FamilyInformationTabs />
        </CardContent>
      </Card>
    </>
  );
}

function FamilyInformationTabs() {
  return (
    <Tabs
      orientation="vertical"
      defaultValue={tabs[0].value}
      className="w-full h-full flex flex-col lg:flex-row items-start gap-4 justify-center py-4">
      <TabsList className="grid grid-cols-2 lg:grid-cols-1 h-auto w-full lg:w-1/4 gap-4 bg-white">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex flex-col gap-1 border shadow p-6 data-[state=active]:bg-primary data-[state=active]:text-white cursor-pointer">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 ">
              <tab.icon /> {tab.name}
            </div>
            <span className="text-xs text-muted-foreground font-semibold">{tab.skippable ? "optional" : ""}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      <Separator className="my-4 block lg:hidden" />
      <div className="h-full flex items-center justify-center w-full">
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <tab.component />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

export default OldFamilyInformation;
