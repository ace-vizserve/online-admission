"use client";

import { getStudentDetails } from "@/actions/private";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { StudentDetails } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { FolderOpen, Plus, ShieldCheck, User, Users } from "lucide-react";
import { Link } from "react-router";
import FamilyInformation from "./family-information";
import StudentDocuments from "./student-documents";
import StudentInformation from "./student-information";
import StudentPicture from "./student-picture";

type ProfileProps = {
  enroleeNumber: string;
};

const tabs = [
  { name: "Personal Info", value: "student-information", icon: User },
  { name: "Family Info", value: "family-information", icon: Users },
  { name: "Documents", value: "student-documents", icon: FolderOpen },
];

function Profile({ enroleeNumber }: ProfileProps) {
  const { data, isPending } = useQuery({
    queryKey: ["student-profile", enroleeNumber],
    queryFn: async () => await getStudentDetails({ enroleeNumber }),
  });

  if (isPending) {
    return (
      <div className="h-[60vh] w-full flex flex-col gap-4 items-center justify-center">
        <Tailspin size="40" stroke="5" speed="0.9" color="#4F46E5" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Assembling profile data...</p>
      </div>
    );
  }

  if (!data) return <NoData />;

  const studentName = `${data.studentInformation.lastName}, ${data.studentInformation.firstName} ${
    data.studentInformation.middleName?.charAt(0) ?? ""
  }.`;

  const studentNumber = data.studentInformation?.studentNumber ?? "PENDING";

  return (
    <div className="w-full mx-auto">
      <Tabs defaultValue={tabs[0].value} className="flex flex-col 2xl:flex-row gap-8 items-start">
        <aside className="w-full 2xl:w-[420px] space-y-8">
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

          <TabsList className="flex flex-col sm:flex-row 2xl:flex-col w-full h-auto bg-transparent gap-1 overflow-x-auto xl:overflow-visible">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex-1 w-full justify-start gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer hover:text-primary",
                  "text-slate-600 font-bold text-sm md:text-base",
                  "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-200"
                )}>
                <tab.icon className="size-5 shrink-0" />
                <span className="whitespace-nowrap">{tab.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </aside>

        <main className="flex-1 w-full">
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="border p-6 md:p-8 rounded-xl">
              <InfoBox studentDetails={data as unknown as StudentDetails} label={tab.name} value={tab.value} />
            </TabsContent>
          ))}
        </main>
      </Tabs>
    </div>
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

export default Profile;
