"use client";

import PageMetaData from "@/components/page-metadata";
import Profile from "@/components/private/student-profile/profile";
import { buttonVariants } from "@/components/ui/button";
import { CURRENT_ACADEMIC_YEAR } from "@/config/academic-years";
import { STUDENT_PROFILE_TITLE_DESCRIPTION } from "@/data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, FileEdit } from "lucide-react";
import { Link, useParams } from "react-router";

function StudentProfile() {
  const { title, description } = STUDENT_PROFILE_TITLE_DESCRIPTION;
  const params = useParams();

  if (!params.id) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-xl font-bold text-slate-400">Student number is not defined!</h1>
      </div>
    );
  }

  const ayMatch = params.id.match(/E(\d{2})/);
  const academicYear = ayMatch ? `ay20${ayMatch[1]}` : CURRENT_ACADEMIC_YEAR;

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="max-w-screen-2xl mx-auto w-full py-7 md:py-10 px-4 md:px-8">
        <div className="w-max ml-auto pb-8">
          <Link
            to={`/admission/enrolments/application/${params.id}?academicYear=${academicYear}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 px-6 rounded-xl bg-secondary hover:bg-secondary text-white font-bold gap-3 shadow-lg shadow-slate-200 transition-all active:scale-[0.98] w-full md:w-auto"
            )}>
            <div className="flex items-center justify-center size-6 rounded-lg bg-white/10">
              <FileEdit className="size-3.5" />
            </div>
            <span>Edit Enrollment Application</span>
            <ArrowUpRight className="size-4 ml-1" />
          </Link>
        </div>

        {/* Main Profile Content */}
        <Profile enroleeNumber={params.id} />
      </div>
    </>
  );
}

export default StudentProfile;
