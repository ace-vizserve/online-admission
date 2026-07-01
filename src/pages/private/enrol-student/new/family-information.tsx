import { getFamilyInformation } from "@/actions/private";
import PageMetaData from "@/components/page-metadata";
import FatherInformation from "@/components/private/enrol-student/steps/family-information/father-information";
import GuardianInformation from "@/components/private/enrol-student/steps/family-information/guardian-information";
import MotherInformation from "@/components/private/enrol-student/steps/family-information/mother-information";
import SiblingInformation from "@/components/private/enrol-student/steps/family-information/sibling-information";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION } from "@/data";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { EnrolNewStudentFormState } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { Baby, ChevronRight, ShieldUser, User, Users } from "lucide-react";
import { useEffect } from "react";
import { Navigate } from "react-router";

function FamilyInformation() {
  const { title, description } = ENROL_NEW_STUDENT_FAMILY_INFORMATION_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <FamilyInformationTabs />
      </div>
    </>
  );
}

function FamilyInformationTabs() {
  const { session } = useSession();
  const { formState, setFormState } = useEnrolNewStudentContext();
  const { data, isPending, isSuccess, fetchStatus } = useQuery({
    queryKey: ["new-family-information", session?.user.email],
    queryFn: async () => {
      return await getFamilyInformation();
    },
    enabled: session != null && Object.keys(formState.familyInfo ?? {}).length < 1,
  });

  useEffect(() => {
    if (!isSuccess || !data) return;

    if (formState.familyInfo != null) return;

    setFormState({
      familyInfo: { ...data } as unknown as EnrolNewStudentFormState["familyInfo"],
    });
  }, [data, formState.familyInfo, isSuccess, setFormState]);

  if (formState.studentInfo?.addressContact == null || formState.studentInfo.studentDetails == null) {
    return <Navigate to={"/enrol-student/new/student-info"} />;
  }

  if (fetchStatus === "fetching" && isPending) {
    return <Loader />;
  }

  if (formState.familyInfo == null) {
    return <Loader />;
  }

  const motherInfoSaved = formState.familyInfo.motherInfo?.isValid === true;
  const fatherInfoSaved = formState.familyInfo.fatherInfo?.isValid === true;

  const tabs = [
    {
      name: "Mother Information",
      description: "Required maternal legal and contact details",
      skippable: false,
      value: "mother-information",
      icon: User,
      component: MotherInformation,
      isSaved: motherInfoSaved,
      hasError: !motherInfoSaved,
    },
    {
      name: "Father Information",
      description: "Required paternal legal and contact details",
      skippable: false,
      value: "father-information",
      icon: Users,
      component: FatherInformation,
      isSaved: fatherInfoSaved,
      hasError: !fatherInfoSaved,
    },
    {
      name: "Guardian Information",
      description: "Optional info for alternative legal guardians",
      skippable: true,
      value: "guardian-information",
      icon: ShieldUser,
      component: GuardianInformation,
      isSaved: false,
      hasError: false,
    },
    {
      name: "Sibling Information",
      description: "Optional info for brothers or sisters",
      skippable: true,
      value: "sibling-information",
      icon: Baby,
      component: SiblingInformation,
      isSaved: false,
      hasError: false,
    },
  ];

  return (
    <Tabs
      orientation="vertical"
      defaultValue={tabs[0].value}
      className="w-full h-full flex flex-col lg:flex-row items-start gap-8 xl:gap-12">
      {/* Sidebar-style Tabs List */}
      <TabsList className="grid grid-cols-1 h-auto w-full lg:w-[320px] gap-3 bg-transparent p-0">
        <div className="px-2 mb-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Form Sections</h3>
        </div>

        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "group relative flex flex-row items-center justify-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
              "bg-white border-slate-100 shadow-sm text-slate-800",
              "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-slate-200",
              tab.isSaved && "bg-green-50 border-green-100",
              tab.isSaved && "data-[state=active]:bg-green-600 data-[state=active]:shadow-green-200",
              !tab.isSaved && tab.hasError && "bg-amber-50",
              !tab.isSaved && tab.hasError && "data-[state=active]:bg-amber-600 data-[state=active]:shadow-amber-200",
            )}>
            <div
              className={cn(
                "relative flex items-center justify-center size-10 rounded-xl transition-colors shrink-0",
                "bg-slate-100 text-slate-800",
                tab.isSaved && "bg-green-100 text-green-600",
                tab.isSaved && "group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white",
                !tab.isSaved && tab.hasError && "bg-white text-amber-600",
                !tab.isSaved && tab.hasError && "group-data-[state=active]:bg-white/30 group-data-[state=active]:text-white",
              )}>
              <tab.icon className="size-5" />

              {tab.isSaved && (
                <span
                  className={cn(
                    "absolute right-0 top-0 inline-flex size-2 rounded-full bg-green-500 shadow-sm",
                    "group-data-[state=active]:bg-green-300 group-data-[state=active]:border-2 group-data-[state=active]:border-white",
                  )}
                />
              )}
              {!tab.isSaved && tab.hasError && (
                <span
                  className={cn(
                    "absolute right-0 top-0 inline-flex size-2 items-center rounded-full bg-amber-600 shadow-sm",
                    "group-data-[state=active]:bg-amber-400 group-data-[state=active]:border-2 group-data-[state=active]:border-white group-data-[state=active]:shadow-sm",
                  )}
                />
              )}
            </div>

            <div className="flex flex-col items-start text-left">
              <span className="font-bold text-sm tracking-tight">{tab.name}</span>
              {tab.isSaved ? (
                <span className="group-data-[state=active]:text-white text-green-600 text-[11px] font-medium leading-none mt-1">
                  Saved
                </span>
              ) : tab.hasError ? (
                <span className="group-data-[state=active]:text-white text-amber-600 text-[11px] font-medium leading-none mt-1">
                  Confirmation Required
                </span>
              ) : (
                <span className="text-[11px] font-medium leading-none mt-1">{tab.description}</span>
              )}
            </div>

            <ChevronRight className="ml-auto size-4 opacity-0 data-[state=active]:opacity-100 transition-opacity" />
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="hidden lg:block">
        <Separator orientation="vertical" className="h-[500px] bg-slate-100" />
      </div>

      {/* Main Form Content Area */}
      <div className="flex-1 w-full bg-white rounded-3xl border border-slate-100 p-6 md:p-10 shadow-sm">
        {tabs.map((tab) => (
          <TabsContent className="mt-0 focus-visible:ring-0" key={tab.value} value={tab.value}>
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-primary">{tab.name}</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Please ensure all required fields are filled correctly.
              </p>
            </div>
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
      <Tailspin size="30" stroke="5" speed="0.9" color="#4F46E5" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching family details...</p>
    </div>
  );
}

export default FamilyInformation;
