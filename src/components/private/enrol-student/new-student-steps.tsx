import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { getStepValidity, stepKeyFromUrl } from "@/lib/step-validity";
import { cn } from "@/lib/utils";
import { useSelectAcademicYear } from "@/zustand-store";
import { AlertCircle, Check } from "lucide-react";
import { useNavigate } from "react-router";

const STEPS = [
  {
    name: "Student Information",
    description: "Student profile and personal data",
    url: "/enrol-student/new/student-info",
    label: "studentInfo",
  },
  {
    name: "Family Information",
    description: "Parent/Guardian and sibling details",
    url: "/enrol-student/new/family-info",
    label: "familyInfo",
  },
  {
    name: "Enrolment Information",
    description: "Academic level and enrolment type",
    url: "/enrol-student/new/enrollment-info",
    label: "enrollmentInfo",
  },
  {
    name: "Upload Requirements",
    description: "Upload required enrolment documents",
    url: "/enrol-student/new/upload-requirements",
    label: "uploadRequirements",
  },
];

function NewStudentSteps() {
  const { currentTab, completedTabs, activeTab, setActiveTab, formState } = useEnrolNewStudentContext();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();

  const validity = getStepValidity(formState, "hfse-is");

  return (
    <nav className="w-full bg-white mb-12 md:mb-0">
      <ol className="flex flex-col lg:flex-row max-w-screen mx-auto">
        {STEPS.map((step, index) => {
          const isActive = activeTab === step.url && completedTabs.length > 0;
          const isCurrent = currentTab === step.url && !completedTabs.includes(step.url);
          const isCompleted = completedTabs.includes(step.url);
          const isLocked = !isCurrent && !isCompleted;

          const stepKey = stepKeyFromUrl(step.url);
          const stepValid = stepKey ? validity[stepKey] : true;
          const isInvalid = isCompleted && !stepValid;

          return (
            <li
              key={step.name}
              onClick={() => {
                if (isLocked || step.url === activeTab) return;
                navigate(`${step.url}?academicYear=${academicYear}`);
                setActiveTab(step.url);
              }}
              className={cn(
                "relative flex-1 group transition-all duration-300",
                isLocked ? "cursor-not-allowed" : "cursor-pointer",
              )}>
              {isActive && (
                <div className="absolute top-3 right-4 flex flex-col items-end gap-1 animate-in fade-in slide-in-from-right-2 duration-500">
                  <span className="bg-blue-100/80 backdrop-blur-sm border border-blue-200 px-2 py-0.5 rounded-md text-[9.5px] font-black text-blue-700 uppercase tracking-tighter shadow-sm">
                    Active Tab
                  </span>
                </div>
              )}

              <div className="flex items-center lg:flex-col lg:text-center px-6 py-5 gap-4 lg:gap-2">
                <div
                  className={cn(
                    "size-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all",
                    isCurrent
                      ? "bg-primary text-white ring-4 ring-slate-100"
                      : isInvalid
                        ? "bg-destructive text-white"
                        : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-slate-100 text-slate-400",
                  )}>
                  {isInvalid ? (
                    <AlertCircle size={14} strokeWidth={3} />
                  ) : isCompleted ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Text Content */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-black uppercase tracking-tight transition-colors",
                      isCurrent
                        ? "text-primary"
                        : isInvalid
                          ? "text-destructive"
                          : isCompleted
                            ? "text-green-700"
                            : "text-slate-400",
                    )}>
                    {step.name}
                  </p>
                  <p className="hidden lg:block text-[12px] text-slate-500 font-medium truncate">{step.description}</p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-transparent px-2">
                <div
                  className={cn(
                    "h-full w-full rounded-t-full transition-all duration-500",
                    isCurrent
                      ? "bg-primary"
                      : isInvalid
                        ? "bg-destructive"
                        : isCompleted
                          ? "bg-green-600/40"
                          : "bg-slate-100",
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default NewStudentSteps;
