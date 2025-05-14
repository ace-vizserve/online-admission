import { getFamilyInformation } from "@/actions/private";
import PageMetaData from "@/components/page-metadata";
import FatherInformation from "@/components/private/enrol-student/steps/family-information/father-information";
import GuardianInformation from "@/components/private/enrol-student/steps/family-information/guardian-information";
import MotherInformation from "@/components/private/enrol-student/steps/family-information/mother-information";
import SiblingInformation from "@/components/private/enrol-student/steps/family-information/sibling-information";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION } from "@/data";
import { EnrolNewStudentFormState } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { Baby, ShieldUser, User, Users } from "lucide-react";
import { useEffect } from "react";
import { Navigate } from "react-router";

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

function FamilyInformation() {
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
  const { formState, setFormState } = useEnrolNewStudentContext();
  const { data, isPending, isSuccess } = useQuery({
    queryKey: ["family-information"],
    queryFn: getFamilyInformation,
    enabled: formState.studentInfo?.addressContact != null && formState.studentInfo.studentDetails != null,
  });

  useEffect(() => {
    if (isSuccess) {
      setFormState({
        familyInfo: { ...data! } as unknown as EnrolNewStudentFormState["familyInfo"],
      });
    }
  }, [data, isSuccess, setFormState]);

  if (formState.studentInfo?.addressContact == null || formState.studentInfo.studentDetails == null) {
    return <Navigate to={"/enrol-student/new/student-info"} />;
  }

  if (isPending) {
    return <Loader />;
  }

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

function Loader() {
  return (
    <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <p className="text-sm text-muted-foreground animate-pulse">Fetching family details...</p>
      <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
    </div>
  );
}

export default FamilyInformation;
