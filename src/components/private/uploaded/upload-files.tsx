import { getFamilyDocuments, getStudentDetails } from "@/actions/private";
import FamilyDocuments from "@/components/private/documents/family-files";
import StudentDocuments from "@/components/private/documents/student-files";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { StudentDocumentsList } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { FolderOpen, Plus, ShieldCheck, User, Users } from "lucide-react";
import { Link, useLocation } from "react-router";
import OldFamilyInfo from "../documents/old-family-info";
import SingleDocuments from "../documents/single-documents";
import StudentPicture from "../student-profile/student-picture";

type ProfileProps = {
  enroleeNumber: string;
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
  {
    name: "Family Documents",
    value: "family-documents",
    icon: FolderOpen,
  },
];

function UploadFiles({ enroleeNumber }: ProfileProps) {
  const { state } = useLocation();
  const { data, isPending } = useQuery({
    queryKey: ["student-documents", enroleeNumber],
    queryFn: async () => {
      return await getStudentDetails({ enroleeNumber });
    },
  });

  const { data: familyDocuments, isPending: isFamilyLoading } = useQuery({
    queryKey: ["family-documents", enroleeNumber],
    queryFn: async () => {
      if (!enroleeNumber) return {};
      return await getFamilyDocuments(enroleeNumber);
    },
    enabled: !!enroleeNumber,
  });

  if (isPending || isFamilyLoading) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
        <Tailspin size="30" stroke="5" speed="0.9" color="#4F46E5" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching students details...</p>
      </div>
    );
  }

  if (data == null) {
    return <NoData />;
  }

  const studentName = `${data.studentInformation?.lastName}, ${data.studentInformation?.firstName} ${
    data.studentInformation?.middleName?.charAt(0) ?? ""
  }`;

  const studentNumber = data.studentInformation?.studentNumber ?? "N/A";

  return (
    <div className="w-full mx-auto">
      <Tabs defaultValue={tabs[0].value} className="flex flex-col 2xl:flex-row gap-8 items-start">
        <aside className="w-full 2xl:w-[420px] space-y-8">
          <div>
            <div className="bg-slate-50/80 p-6 flex flex-col items-center border-b border-slate-100 rounded-xl">
              <StudentPicture studentIDPicture={data.studentIDPicture} enroleeNumber={enroleeNumber} />

              <div className="text-center mt-4 space-y-1">
                <h2 className="font-black text-xl text-slate-900 leading-tight capitalize">
                  {studentName.toLowerCase()}
                </h2>
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">ID: {studentNumber}</p>
                </div>
              </div>
            </div>
          </div>
          <TabsList className="flex flex-col sm:flex-row 2xl:flex-col w-full h-auto bg-transparent gap-1 overflow-x-auto xl:overflow-visible">
            {tabs.map((tab) => {
              const hasStudentAction = tab.name === "Student Documents" && state?.studentDocsActions;
              const hasFamilyAction = tab.name === "Family Documents" && state?.parentGuardianDocsActions;
              const needsAction = hasStudentAction || hasFamilyAction;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex-1 w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer group",
                    "text-slate-600 font-bold text-sm md:text-base border border-transparent",
                    "hover:bg-slate-50 hover:text-primary",
                    "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-100"
                  )}>
                  <tab.icon
                    className={cn("size-5 shrink-0", needsAction && "group-data-[state=inactive]:text-amber-500")}
                  />

                  <span className="flex-1 text-left">{tab.name}</span>

                  {needsAction && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter",
                        "group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white",
                        "group-data-[state=inactive]:bg-amber-50 group-data-[state=inactive]:text-amber-600"
                      )}>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      Action
                    </div>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </aside>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="border p-6 md:p-8 rounded-xl">
            <InfoBox
              studentDetails={data as unknown as StudentDocumentsList}
              label={tab.name}
              value={tab.value}
              familyDocuments={familyDocuments}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function InfoBox({
  label,
  value,
  studentDetails,
  familyDocuments,
}: {
  label: string;
  value: string;
  studentDetails: StudentDocumentsList;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  familyDocuments?: any;
}) {
  const { familyInformation, studentDocuments, studentInformation } = studentDetails;

  const fatherEmail = familyInformation?.fatherEmail;
  const guardianEmail = familyInformation?.guardianEmail;

  switch (value) {
    case "student-information":
      return <SingleDocuments label={label} studentInformation={studentInformation} />;
    case "student-documents":
      return <StudentDocuments label={label} documents={studentDocuments} />;
    case "family-information":
      return <OldFamilyInfo label={label} familyInformation={familyInformation} />;

    case "family-documents": {
      return (
        <FamilyDocuments
          label={label}
          documents={familyDocuments}
          noFatherInfo={Boolean(!fatherEmail)}
          noGuardianInfo={Boolean(!guardianEmail)}
        />
      );
    }
    default:
      return null;
  }
}

function NoData() {
  return (
    <div className="w-full h-[70vh] flex items-center justify-center flex-col gap-6 text-center px-6">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="relative p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl">
          <FolderOpen className="size-16 text-indigo-500" />
        </div>
      </div>

      <div className="max-w-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Record Not Found</h1>
        <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
          We couldn't find the profile you're looking for. It might have been moved or hasn't been created yet.
        </p>
      </div>

      <Link
        to="/enrol-student"
        className={buttonVariants({
          size: "lg",
          className:
            "gap-2 shadow-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white !rounded-2xl border-b-4 border-indigo-800 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all mt-2",
        })}>
        <Plus className="w-5 h-5" />
        Create New Record
      </Link>
    </div>
  );
}

export default UploadFiles;
