import { getSectionCardsDetails } from "@/actions/private";
import { getDraftRows } from "@/components/private/drafts/draft-ticket";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewReportCardButton } from "@/components/view-report-card";
import { tryAcademicYearFromEnroleeNumber } from "@/config/academic-years";
import useSession from "@/hooks/use-session";
import { cn, getCurrentDayState } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, CheckCircle2, FileClock, FilePen, GraduationCap, Info, UserPlus, Users } from "lucide-react";
import { Link } from "react-router";

export function SectionCards() {
  const { session } = useSession();
  const { data, isPending } = useQuery({
    queryKey: ["section-cards", session?.user.email],
    queryFn: getSectionCardsDetails,
    enabled: session != null,
  });

  const nameParts = session?.user.user_metadata.fullName.replace(/,/g, "").split(" ");

  const greet = `${session?.user.user_metadata.relationship === "mother" ? "Ms." : "Mr."} ${nameParts[1]}`;

  const btnStyles =
    "group gap-2 shadow-xl bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white !rounded-xl border-b-4 border-blue-900 hover:brightness-110 hover:-translate-y-0.5 active:border-b-0 active:translate-y-0 transition-all duration-150 !font-bold uppercase tracking-wider";

  return (
    <div className="space-y-6 md:space-y-8 py-4">
      <div className="flex flex-col lg:flex-row justify-between items-start xl:items-center gap-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Good {getCurrentDayState()}, <span className="capitalize text-primary">{greet}!</span>
            </h1>

            <span className="text-2xl lg:text-3xl inline-block">👋</span>
          </div>

          <p className="text-slate-500 text-sm md:text-base font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Welcome back to your enrolment portal. Ready to continue?
          </p>
        </div>

        <div className="w-full lg:max-w-sm flex flex-col gap-2">
          <Link
            to="/enrol-student"
            className={buttonVariants({
              size: "lg",
              className: `text-sm w-full flex xl:hidden py-8 ${btnStyles}`,
            })}>
            Enrol Student
            <UserPlus className="size-4 group-hover:scale-110 transition-transform" />
          </Link>

          <Link
            to="/enrol-student"
            className={buttonVariants({
              size: "lg",
              className: `!hidden xl:!flex order-1 xl:order-last h-max w-full py-8 ${btnStyles}`,
            })}>
            Enrol Student
            <UserPlus className="size-6 group-hover:rotate-12 transition-transform" />
          </Link>

          <ViewReportCardButton />
        </div>
      </div>
      <div className="py-4">
        {isPending ? (
          <Loader />
        ) : (
          <DashboardCards
            totalEnrollments={data?.totalEnrollments ?? 0}
            pendingTasks={data?.pendingTasks.pendingTasks ?? []}
            currentEnrolledStudents={data?.currentEnrolledStudents?.length ?? 0}
          />
        )}
      </div>
    </div>
  );
}

function DashboardCards({ currentEnrolledStudents, pendingTasks, totalEnrollments }: DashboardCardsProps) {
  const draftCount = getDraftRows().length;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div
        className={cn("w-full max-w-full grid lg:grid-cols-2 gap-4", {
          "lg:grid-cols-3": draftCount > 0,
        })}>
        {draftCount > 0 && <DraftCountWidget count={draftCount} />}

        <StatCard
          icon={<GraduationCap className="stroke-white size-5" />}
          label="Enrolled Students"
          value={currentEnrolledStudents}
          badge={`A.Y. ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`}
          description="Enrolled this academic year"
          className="w-full h-full "
        />
        <StatCard
          icon={<Users className="stroke-white size-5" />}
          label="Total Enrollments"
          value={totalEnrollments}
          className="w-full h-full"
          description="Total applications recorded"
        />
      </div>

      <StatCard
        icon={<FileClock className="stroke-white size-5" />}
        label="Your Pending Actions"
        value={pendingTasks}
      />
    </div>
  );
}

function DraftCountWidget({ count }: { count: number }) {
  return (
    <Link to="/admission/drafts" className="block w-full">
      <Card className="w-full shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <CardHeader className="flex flex-col gap-2 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-600 p-2 text-white">
                <FilePen className="stroke-white size-5" />
              </div>
              <CardDescription className="font-bold text-black text-sm uppercase tracking-tight">
                Saved Drafts
              </CardDescription>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <CardTitle className="text-5xl font-black tabular-nums text-black">{count}</CardTitle>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {count === 1 ? "Application" : "Applications"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">Continue where you left off</p>
        </CardHeader>
      </Card>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  badge,
  className,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | PendingTasks;
  badge?: string;
  className?: string;
  description?: string;
}) {
  const isPendingTasks = Array.isArray(value);
  const count = isPendingTasks ? (value.length ?? 0) : value;

  return (
    <Card className={cn("w-full shadow-sm transition-all duration-300 hover:shadow-md", className)}>
      <CardHeader className="relative flex flex-col gap-2 p-6">
        <div className="w-full flex items-center justify-between">
          <div className="w-full flex justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2 text-white">{icon}</div>
              <CardDescription className="font-bold text-black text-sm uppercase tracking-tight">
                {label}
              </CardDescription>
            </div>

            {isPendingTasks && (
              <Link
                to={"/admission/pending-tasks"}
                className={buttonVariants({
                  variant: "link",
                  size: "sm",
                  className: "!font-bold text-[0.7rem] lg:text-xs",
                })}>
                See all actions <ArrowUpRight className="-ml-1 size-3 lg:size-4" />
              </Link>
            )}
          </div>

          {badge && <Badge className="border-none text-[0.7rem] font-bold">{badge}</Badge>}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <CardTitle className="text-5xl font-black tabular-nums text-black">{count}</CardTitle>
          {isPendingTasks && (
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {count > 1 ? "Actions" : "Action"} Required
            </span>
          )}

          {description && (
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{description}</span>
          )}
        </div>

        {isPendingTasks && count > 0 && (
          <CardContent className="mt-6 px-0 border-t border-slate-200 pt-2">
            <div className="flex flex-col">
              {value.slice(0, 2).map((pendingTask) => {
                const academicYear = tryAcademicYearFromEnroleeNumber(pendingTask.enroleeNumber) ?? "";

                return (
                  <div
                    key={pendingTask.enroleeNumber}
                    className="flex items-start justify-between gap-4 py-5 border-b border-slate-50 last:border-none">
                    <div className="flex items-start gap-4">
                      {/* PayFit Info Icon Style */}
                      <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-2">
                        <Info className="size-4 text-amber-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-[13px] leading-relaxed text-muted-foreground line-clamp-3">
                          Enrollee{" "}
                          <Link
                            to={`/admission/enrolments/application/${pendingTask.enroleeNumber}?academicYear=${academicYear}`}
                            className="font-bold text-primary underline underline-offset-2">
                            #{pendingTask.enroleeNumber}
                          </Link>{" "}
                          has pending actions for:
                          {pendingTask.studentDocs && pendingTask.studentDocs.length > 0 && (
                            <span className="ml-1">
                              <span className="font-bold text-black italic">Student Documents</span> (
                              {pendingTask.studentDocs.map((task, idx) => {
                                const [name, status] = Object.entries(task)[0];
                                return (
                                  <span key={idx}>
                                    <span className="text-black capitalize">
                                      {name.replace(/([A-Z])/g, " $1").trim()}
                                    </span>
                                    <span
                                      className={cn(
                                        "ml-1 font-bold uppercase text-[10px]",
                                        status === "To follow" ? "text-primary" : "text-destructive",
                                      )}>
                                      {status}
                                    </span>
                                    {idx < pendingTask.studentDocs!.length - 1 && ", "}
                                  </span>
                                );
                              })}
                              )
                            </span>
                          )}
                          {pendingTask.parentGuardianDocs && pendingTask.parentGuardianDocs.length > 0 && (
                            <span className="ml-1">
                              {pendingTask.studentDocs && pendingTask.studentDocs.length > 0 && "and"}{" "}
                              <span className="font-bold text-black italic">Parent/Guardian Documents</span> (
                              {pendingTask.parentGuardianDocs.map((task, idx) => {
                                const [name, status] = Object.entries(task)[0];
                                return (
                                  <span key={idx}>
                                    <span className="text-black capitalize">
                                      {name.replace(/([A-Z])/g, " $1").trim()}
                                    </span>
                                    <span
                                      className={cn(
                                        "ml-1 font-bold uppercase text-[10px]",
                                        status === "To follow" ? "text-primary" : "text-destructive",
                                      )}>
                                      {status}
                                    </span>
                                    {idx < pendingTask.parentGuardianDocs!.length - 1 && ", "}
                                  </span>
                                );
                              })}
                              )
                            </span>
                          )}
                          . Review these items to finalize enrolment.
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/admission/enrolments/application/${pendingTask.enroleeNumber}?academicYear=${academicYear}`}
                      state={{
                        studentDocsActions: pendingTask.studentDocs && pendingTask.studentDocs.length > 0,
                        parentGuardianDocsActions:
                          pendingTask.parentGuardianDocs && pendingTask.parentGuardianDocs.length > 0,
                      }}
                      className={buttonVariants({
                        className: "!text-[0.7rem] !font-bold",
                      })}>
                      Review <ArrowUpRight className="size-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}

        {isPendingTasks && !count && (
          <CardContent className="w-full mt-6 flex flex-col items-center justify-center border-t border-slate-100 py-10 text-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 scale-150 bg-emerald-100/50 blur-2xl rounded-full" />
              <div className="relative rounded-full bg-emerald-50 p-3 ring-4 ring-white shadow-sm">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-primary">All caught up!</p>
              <p className="text-[12px] font-medium text-slate-500 max-w-[180px] leading-snug">
                There are no pending actions for your children's enrolment at this time.
              </p>
            </div>
          </CardContent>
        )}
      </CardHeader>
    </Card>
  );
}

function Loader() {
  return (
    <div className="flex flex-col lg:flex-row gap-5 w-full">
      <div className="w-full max-w-full xl:max-w-[520px] flex flex-col gap-5">
        <Skeleton className="h-[160px] w-full rounded-2xl" />
        <Skeleton className="h-[160px] w-full rounded-2xl" />
      </div>

      <div className="flex-1">
        <Skeleton className="h-[340px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

type DashboardCardsProps = {
  totalEnrollments: number;
  pendingTasks: PendingTasks;
  currentEnrolledStudents: number;
};

type PendingTasks = {
  enroleeNumber?: string;
  studentDocs?: {
    [k: string]: string;
  }[];
  parentGuardianDocs?: {
    [k: string]: string;
  }[];
}[];
