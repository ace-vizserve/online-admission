import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { applicationTypes } from "@/data";
import { cn } from "@/lib/utils";
import { usePassTypeStore, useSelectAcademicYear } from "@/zustand-store";
import { AlertCircle, Search } from "lucide-react";
import { NavLink, useParams } from "react-router";

function OldStudentSteps() {
  const { formState } = useEnrolOldStudentContext();
  const params = useParams();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);

  const { familyInfo, enrollmentInfo, uploadRequirements, studentInfo } = formState;

  const isAddressContactInvalid = applicationTypes.includes(stpApplicationType) && !studentInfo?.addressContact?.isValid;
  const isFamilyInfoInvalid = familyInfo == null;
  const enrollmentInfoIsInvalid = enrollmentInfo == null || enrollmentInfo.isValid !== true;
  const docsInvalid =
    uploadRequirements?.studentUploadRequirements?.isValid !== true ||
    uploadRequirements?.parentGuardianUploadRequirements?.isValid !== true;

  const STEPS = [
    {
      name: "Student Information",
      path: "student-info",
      desc: "Student profile and personal data",
      invalid: isAddressContactInvalid,
    },
    {
      name: "Family Information",
      path: "family-info",
      desc: "Parent/Guardian and sibling details",
      forReview: isFamilyInfoInvalid,
    },
    {
      name: "Enrolment Information",
      path: "enrollment-info",
      desc: "Academic level and enrolment type",
      invalid: enrollmentInfoIsInvalid,
    },
    {
      name: "Upload Requirements",
      path: "documents",
      desc: "Upload required enrolment documents",
      invalid: docsInvalid,
    },
  ];

  return (
    <nav className="w-full bg-white mb-12 md:mb-0">
      <ol className="flex flex-col lg:flex-row max-w-screen mx-auto">
        {STEPS.map((step, index) => (
          <NavLink
            key={step.path}
            to={`/enrol-student/${params.id}/${step.path}?academicYear=${academicYear}`}
            className="relative flex-1 group">
            {({ isActive }) => (
              <div className="flex items-center lg:flex-col lg:text-center px-6 py-5 gap-4 lg:gap-2">
                {/* Status Icon / Number */}
                <div
                  className={cn(
                    "size-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all",
                    step.forReview
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : isActive && !step.invalid
                        ? "bg-primary text-white ring-4 ring-slate-100"
                        : step.invalid
                          ? "bg-destructive text-white border border-destructive"
                          : "bg-slate-100 text-slate-400",
                  )}>
                  {step.invalid ? <AlertCircle size={14} /> : step.forReview ? <Search size={14} /> : index + 1}
                </div>

                {/* Text Content */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 lg:justify-center">
                    <p
                      className={cn(
                        "text-xs font-black uppercase tracking-tight",
                        isActive && !step.invalid
                          ? "text-primary"
                          : isActive && step.invalid
                            ? "text-destructive"
                            : "text-slate-500",
                      )}>
                      {step.name}
                    </p>
                  </div>
                  <p className="hidden lg:block text-[12px] text-slate-400 font-medium truncate">{step.desc}</p>
                </div>

                {/* Indicator Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 px-2">
                  <div
                    className={cn(
                      "h-full w-full rounded-t-full transition-all duration-300",
                      isActive ? (step.invalid ? "bg-destructive" : "bg-primary") : "bg-slate-100",
                    )}
                  />
                </div>
              </div>
            )}
          </NavLink>
        ))}
      </ol>
    </nav>
  );
}

export default OldStudentSteps;
