import { buttonVariants } from "@/components/ui/button";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { cn } from "@/lib/utils";
import { useSelectAcademicYear } from "@/zustand-store";
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
  const { currentTab, completedTabs, activeTab, setActiveTab } = useEnrolNewStudentContext();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();

  return (
    <ol className="flex flex-col lg:flex-row gap-0.5 pb-6 lg:pb-0">
      {STEPS.map((step) => {
        const isCurrent = currentTab == step.url;
        const isCompleted = completedTabs.includes(step.url);

        return (
          <li
            key={step.name}
            onClick={() => {
              if (step.url === activeTab) return;
              navigate(`${step.url}?=academicYear=${academicYear}`);
              setActiveTab(step.url);
            }}
            className={buttonVariants({
              size: "lg",
              className: cn("relative overflow-hidden lg:flex-1 w-full py-10 px-6 rounded-none pointer-events-none", {
                "opacity-100 cursor-pointer pointer-events-auto": isCurrent || isCompleted,
                "bg-green-50": isCompleted,
              }),
              variant: "outline",
            })}>
            {activeTab == step.url && (
              <span className="absolute right-3 top-3 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary shadow-lg shadow-secondary/50"></span>
              </span>
            )}
            <div
              className={cn(" space-y-1 text-center px-6 py-4", {
                "text-green-600": isCompleted,
              })}>
              <p className="text-sm font-semibold">{step.name}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>

            {isCompleted && <span className="absolute bottom-0 w-full h-1 bg-green-600" />}
            {isCurrent && <span className="absolute bottom-0 w-full h-1 bg-primary animate-pulse" />}
          </li>
        );
      })}
    </ol>
  );
}

export default NewStudentSteps;
