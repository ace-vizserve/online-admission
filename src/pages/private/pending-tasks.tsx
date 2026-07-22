import { getSectionCardsDetails } from "@/actions/private";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_ACADEMIC_YEARS, tryAcademicYearFromEnroleeNumber } from "@/config/academic-years";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

function PendingTasks() {
  const { session } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ["pending-tasks", session?.user.email],
    queryFn: getSectionCardsDetails,
    enabled: session != null,
  });

  const tasks = data?.pendingTasks.pendingTasks ?? [];

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");

  // Only years that actually have a pending task for this parent — never the full system list
  // of academic years (BACKEND_ACADEMIC_YEARS is used only to order these, not to seed them).
  const availableAcademicYears = useMemo(() => {
    const years = new Set<string>();
    tasks.forEach((task) => {
      const ay = tryAcademicYearFromEnroleeNumber(task.enroleeNumber);
      if (ay) years.add(ay);
    });
    return BACKEND_ACADEMIC_YEARS.filter((ay) => years.has(ay));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedAcademicYear === "all") return tasks;
    return tasks.filter((task) => tryAcademicYearFromEnroleeNumber(task.enroleeNumber) === selectedAcademicYear);
  }, [tasks, selectedAcademicYear]);

  if (isPending) return <PendingTasksLoader />;

  return (
    <MaxWidthWrapper className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <Link
          to="/admission/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">Document Requirements</h1>
            <p className="text-slate-500 mt-2">
              Outstanding document requirements for enrolment applications already submitted for your children.
            </p>
          </div>

          {availableAcademicYears.length >= 2 && (
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableAcademicYears.map((ay) => (
                  <SelectItem key={ay} value={ay}>
                    {`AY ${ay.slice(2)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <CheckCircle2 className="size-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-primary">All caught up!</h2>
          <p className="text-center text-balance text-sm font-medium text-slate-500 max-w-[380px] leading-snug">
            There are no outstanding document requirements for your children's enrolment at this time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const academicYear = tryAcademicYearFromEnroleeNumber(task.enroleeNumber) ?? "";

              return (
                <div key={task.enroleeNumber} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 shrink-0 rounded-full bg-amber-100 p-2">
                        <Info className="size-5 text-amber-600" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm leading-relaxed text-slate-600">
                          Enrollee{" "}
                          <Link
                            to={`/admission/enrolments/application/${task.enroleeNumber}?academicYear=${academicYear}`}
                            className="font-bold text-primary underline underline-offset-2">
                            #{task.enroleeNumber}
                          </Link>{" "}
                          &mdash; their existing{" "}
                          <span className="font-bold">{academicYear ? `AY ${academicYear.slice(2)}` : ""}</span>{" "}
                          application requires the following documents:
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.studentDocs &&
                            task.studentDocs.length > 0 &&
                            task.studentDocs.map((doc: Record<string, string>, i: number) => {
                              const [name, status] = Object.entries(doc)[0];
                              return (
                                <div
                                  key={i}
                                  className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                  <span className="font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                                  <span
                                    className={cn(
                                      "font-bold uppercase text-[10px]",
                                      status === "To follow" ? "text-primary" : "text-destructive",
                                    )}>
                                    {status}
                                  </span>
                                </div>
                              );
                            })}

                          {task.parentGuardianDocs &&
                            task.parentGuardianDocs.length > 0 &&
                            task.parentGuardianDocs.map((doc: Record<string, string>, i: number) => {
                              const [name, status] = Object.entries(doc)[0];
                              return (
                                <div
                                  key={i}
                                  className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                  <span className="font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                                  <span
                                    className={cn(
                                      "font-bold uppercase text-[10px]",
                                      status === "To follow" ? "text-primary" : "text-destructive",
                                    )}>
                                    {status}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/admission/enrolments/application/${task.enroleeNumber}?academicYear=${academicYear}`}
                      state={{
                        studentDocsActions: task.studentDocs && task.studentDocs.length > 0,
                        parentGuardianDocsActions: task.parentGuardianDocs && task.parentGuardianDocs.length > 0,
                      }}
                      className={buttonVariants({
                        className: "text-xs !font-bold",
                      })}>
                      Upload Documents
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MaxWidthWrapper>
  );
}

function PendingTasksLoader() {
  return (
    <div className="min-h-dvh w-full flex flex-col gap-4 items-center justify-center">
      <Tailspin size="40" stroke="5" speed="0.9" color="#4F46E5" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading student records...</p>
    </div>
  );
}

export default PendingTasks;
