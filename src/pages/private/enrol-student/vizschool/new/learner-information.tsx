import PageMetaData from "@/components/page-metadata";
import StudentAddressContact from "@/components/private/enrol-student/vizschool/steps/learner-information/student-address-contact";
import StudentDetails from "@/components/private/enrol-student/vizschool/steps/learner-information/student-details";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENROL_NEW_STUDENT_STUDENT_INFORMATION_TITLE_DESCRIPTION } from "@/data";
import { cn } from "@/lib/utils";
import { ChevronRight, MapPin, User } from "lucide-react";
import { useCallback, useState } from "react";

function LearnerInformation() {
  const { title, description } = ENROL_NEW_STUDENT_STUDENT_INFORMATION_TITLE_DESCRIPTION;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <LearnerInformationTabs />
      </div>
    </>
  );
}

function LearnerInformationTabs() {
  const { formState } = useEnrolNewLearnerContext();
  const [tabOpened, setTabOpened] = useState<string>("student-details");

  const memoizedCb = useCallback(
    (tab: string) => {
      setTabOpened(tab);
    },
    [tabOpened],
  );

  const detailsSaved = formState.studentInfo?.studentDetails?.isValid === true;
  const addressSaved = formState.studentInfo?.addressContact?.isValid === true;

  const tabs = [
    {
      name: "Student Details",
      value: "student-details",
      description: "Personal and academic background",
      icon: User,
      component: StudentDetails,
      isSaved: detailsSaved,
      hasError: !detailsSaved,
    },
    {
      name: "Address & Contact",
      value: "address-contact",
      description: "Emergency and residence info",
      icon: MapPin,
      component: StudentAddressContact,
      isSaved: addressSaved,
      hasError: !addressSaved,
    },
  ];

  return (
    <Tabs
      orientation="vertical"
      defaultValue={tabOpened}
      value={tabOpened}
      className="w-full h-full flex flex-col lg:flex-row items-start gap-8 xl:gap-12">
      {/* Sidebar-style Tabs List */}
      <TabsList className="grid grid-cols-1 h-auto w-full lg:w-[320px] gap-3 bg-transparent p-0">
        <div className="px-2 mb-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Form Sections</h3>
        </div>

        {tabs.map((tab) => (
          <TabsTrigger
            onClick={() => memoizedCb(tab.value)}
            key={tab.value}
            value={tab.value}
            className={cn(
              "group relative flex flex-row items-center justify-start gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
              "bg-white border-slate-100 shadow-sm text-slate-800",
              "data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-slate-200",
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
                    "absolute right-0 top-0 inline-flex size-2 rounded-full bg-amber-600 shadow-sm",
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
              <h2 className="text-2xl font-black tracking-tight text-secondary">{tab.name}</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Please ensure all required fields are filled correctly.
              </p>
            </div>
            <tab.component setTabOpened={memoizedCb} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

export default LearnerInformation;
