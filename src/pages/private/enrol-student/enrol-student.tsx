import {
  getPreviousEnrolledStudents,
  lookupNewEnrolledStudent,
  vizSchoolLookupNewEnrolledStudent,
} from "@/actions/private";
import Logo from "@/components/logo";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import EnrollmentStepper from "@/components/private/enrol-student/enrollment-stepper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import VizSchoolLogo from "@/components/vizschool-logo";
import { ENROL_NEW_STUDENT_TITLE_DESCRIPTION } from "@/data";
import useSession from "@/hooks/use-session";
import { safeSessionStorage } from "@/lib/safe-storage";
import { canEnrollStudent, cn } from "@/lib/utils";
import { EnrolledStudent } from "@/types";
import { useSelectAcademicYear, useSelectSchoolFee } from "@/zustand-store";
import { Field, Radio, RadioGroup } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { DotPulse, Tailspin } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { ArrowLeft, ArrowRight, CircleCheck, Plus, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useState, useTransition } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import AcademicYearSelector from "./academic-year-selector";
import SchoolFees from "./vizschool/school-fees";

function EnrolStudent() {
  const { session } = useSession();
  const [showEnrollmentProcess, setShowEnrollmentProcess] = useState<boolean>(true);
  const { title, description } = ENROL_NEW_STUDENT_TITLE_DESCRIPTION;
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState<boolean>(false);
  const navigate = useNavigate();
  const { data, isPending, isRefetching } = useQuery({
    queryKey: ["enrolled-students", session?.user.email, academicYear],
    queryFn: async () => {
      const ay = academicYear.replace(/vizschool-/g, "");
      return await getPreviousEnrolledStudents(ay);
    },
    enabled: session != null && Boolean(academicYear),
  });
  const [selected, setSelected] = useState<EnrolledStudent | null>(data?.studentsList[0] ?? null);
  const schoolFee = useSelectSchoolFee((state) => state.schoolFee);

  const clearSchoolFeeState = useSelectSchoolFee((state) => state.clearState);
  const clearState = useSelectAcademicYear((state) => state.clearState);

  const [isLoading, setTransition] = useTransition();

  const selectStudent = useCallback((student: EnrolledStudent) => {
    setSelected(student);
  }, []);

  function goBack() {
    setTransition(() => {
      clearState();
      clearSchoolFeeState();
      safeSessionStorage.clear();
    });
  }

  async function hasVizSchoolEnrollment() {
    if (!selected) return false;

    return vizSchoolLookupNewEnrolledStudent({
      fullName: selected.enroleeFullName,
      nric: selected.nric!,
      birthDay: selected.birthDay!,
      academicYear: academicYear.replace(/vizschool-/g, ""),
    });
  }

  async function hasHFSEEnrollment() {
    if (!selected) return false;

    return lookupNewEnrolledStudent({
      studentNumber: selected.studentNumber,
      academicYear: academicYear.replace(/vizschool-/g, ""),
    });
  }

  async function checkEnrollmentAndProceed() {
    if (!selected) return;

    try {
      setIsCheckingEnrollment(true);

      const [hfseEnrolled, vizEnrolled] = await Promise.all([hasHFSEEnrollment(), hasVizSchoolEnrollment()]);

      if (hfseEnrolled) {
        toast.warning("Student already enrolled for HFSE!", {
          description: `A matching student record is already enrolled for A.Y. ${academicYear.split("y")[1]}`,
        });
        return;
      }

      if (vizEnrolled) {
        toast.warning("Student already enrolled for VizSchool!", {
          description: `A matching student record is already enrolled for A.Y. ${academicYear.split("y")[1]}`,
        });
        return;
      }

      const isEligible = await canEnrollStudent(selected.enroleeNumber, academicYear);

      if (!isEligible) {
        toast.info("Enrolment not allowed!", {
          description: "The student has completed Secondary 4, the final year of secondary school",
        });
        return;
      }

      const ay = academicYear.replace(/vizschool-/g, "");
      const isVizSchool = academicYear.startsWith("vizschool-");

      if (isVizSchool) {
        navigate(`/vizschool/enrol-student/${selected.enroleeNumber}/student-info?academicYear=${ay}`);
        return;
      }
      navigate("/enrol-student/residency-status", {
        state: {
          enroleeType: "Current",
          enroleeNumber: selected.enroleeNumber,
          currentPass: selected.pass,
        },
      });
    } catch (error) {
      const err = error as Error;
      toast.warning(err.message, {
        description: "An unknown error occurred",
      });
    } finally {
      setIsCheckingEnrollment(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <DotPulse size="50" speed="1.3" color="#1F45C7" />
      </div>
    );
  }

  return (
    <>
      <PageMetaData title={title} description={description} />

      <div
        className={"w-full sticky lg:fixed top-0 z-20 bg-background/80 h-20 md:h-24 flex items-center border-b"}>
        <MaxWidthWrapper className="flex items-center justify-between w-full max-w-screen-2xl px-4 md:px-6">
          <Link
            onClick={goBack}
            to={"/admission/dashboard"}
            className={buttonVariants({
              variant: "link",
              className: "gap-2 !font-bold",
            })}>
            <ArrowLeft /> Go back
          </Link>
        </MaxWidthWrapper>
      </div>

      {academicYear === "" ? (
        <AcademicYearSelector setSelectedAy={setAcademicYear} />
      ) : (
        <div className="w-full min-h-screen pt-0 md:pt-20 flex items-center justify-center bg-muted">
          {showEnrollmentProcess ? (
            <EnrollmentStepper academicYear={academicYear} setShowEnrollmentProcess={setShowEnrollmentProcess} />
          ) : academicYear.includes("vizschool-") && !schoolFee ? (
            <SchoolFees />
          ) : schoolFee ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              className="w-full px-4">
              <Card className="w-full sm:max-w-xl sm:mx-auto rounded-2xl border-border shadow-md overflow-hidden">
                <CardHeader className="text-center space-y-4 px-0">
                  <VizSchoolLogo className="mx-auto h-16 md:h-20" />

                  <div className="space-y-2">
                    <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-secondary">
                      Select a Learner
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
                      Choose a registered learner to continue enrolment for{" "}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider ml-1">
                        AY 2026
                      </span>
                    </CardDescription>
                  </div>
                  <Separator />
                </CardHeader>

                <CardContent className="px-2 md:px-4">
                  <ScrollArea className="h-52 md:h-64">
                    {isPending ? (
                      <div className="flex h-64 w-full flex-col gap-4 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 transition-all">
                        <Tailspin size="24" stroke="5" speed="0.9" color="#4F46E5" />
                        <p className="text-sm font-bold text-muted-foreground animate-pulse">Syncing Learners</p>
                      </div>
                    ) : data?.studentsList?.length ? (
                      <div className="space-y-3">
                        <StudentsList
                          forVizSChool={true}
                          selected={selected}
                          setSelected={selectStudent}
                          studentList={data.studentsList}
                        />
                        <div className="h-4" />
                      </div>
                    ) : (
                      <NoStudents forVizSchool />
                    )}
                  </ScrollArea>
                </CardContent>

                <CardFooter className="border-t flex flex-col gap-3 px-4">
                  <Button
                    disabled={isCheckingEnrollment || selected == null}
                    onClick={async () => await checkEnrollmentAndProceed()}
                    variant="secondary"
                    size="lg"
                    className="h-14 w-full gap-3 text-xs md:text-sm font-semibold uppercase tracking-widest">
                    {isCheckingEnrollment ? (
                      <DotPulse size="30" speed="1.3" color="#FFF" />
                    ) : (
                      <>
                        Continue Enrolment <ArrowRight size={18} strokeWidth={3} />
                      </>
                    )}
                  </Button>

                  <Link
                    to={`/vizschool/enrol-student/new/student-info?academicYear=${academicYear.replace(
                      /vizschool-/g,
                      "",
                    )}`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-14 rounded-md gap-3 font-semibold text-primary hover:text-primary hover:bg-primary/10 transition-all w-full",
                    )}>
                    <Plus size={16} strokeWidth={3} />
                    Add a new learner
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              className="w-full px-4">
              <Card className="w-full sm:max-w-xl sm:mx-auto rounded-2xl border-border shadow-md overflow-hidden">
                <CardHeader className="text-center space-y-4 px-0">
                  <Logo className="mx-auto h-12 md:16" />

                  <div className="space-y-2">
                    <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                      Select a student
                    </CardTitle>

                    <CardDescription className="text-sm font-medium text-muted-foreground leading-relaxed px-4">
                      All registered students for
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider ml-1 mr-1">
                        AY {"ay" + (parseInt(academicYear.replace("ay", ""), 10) - 1)}
                      </span>
                      are listed below.
                    </CardDescription>
                    {/* <AcademicYearDropdown /> */}
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="px-2 md:px-4">
                  <ScrollArea className="h-52 md:h-64">
                    {isRefetching || isPending ? (
                      <div className="flex h-64 w-full flex-col gap-4 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 transition-all">
                        <Tailspin size="24" stroke="5" speed="0.9" color="#4F46E5" />
                        <p className="text-sm font-bold text-muted-foreground animate-pulse">Syncing Students</p>
                      </div>
                    ) : data?.studentsList?.length ? (
                      <div className="space-y-3">
                        <StudentsList
                          forVizSChool={false}
                          selected={selected}
                          setSelected={selectStudent}
                          studentList={data.studentsList}
                        />
                        <div className="h-4" />
                      </div>
                    ) : (
                      <NoStudents forVizSchool={false} />
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="border-t flex flex-col gap-3 px-4">
                  <Button
                    disabled={isCheckingEnrollment || selected == null}
                    onClick={async () => await checkEnrollmentAndProceed()}
                    variant="cta"
                    size="lg"
                    className="h-14 w-full gap-3 text-xs md:text-sm font-semibold uppercase tracking-widest">
                    {isCheckingEnrollment ? (
                      <DotPulse size="30" speed="1.3" color="#FFF" />
                    ) : (
                      <>
                        Enrol student <ArrowRight size={18} strokeWidth={3} />
                      </>
                    )}
                  </Button>

                  <Link
                    state={{
                      enroleeType: "New",
                    }}
                    to={"/enrol-student/residency-status"}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-14 rounded-md gap-3 font-semibold text-secondary hover:text-secondary hover:bg-secondary/10 transition-all w-full",
                    )}>
                    <Plus size={16} strokeWidth={3} />
                    Add new student
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}

type StudentsListProps = {
  selected: EnrolledStudent | null;
  setSelected: (student: EnrolledStudent) => void;
  studentList: EnrolledStudent[];
  forVizSChool: boolean;
};

const StudentsList = memo(function ({ selected, setSelected, studentList, forVizSChool }: StudentsListProps) {
  return (
    <RadioGroup
      value={selected}
      onChange={(value) => {
        if (!value) return;
        setSelected(value);
      }}
      className="flex flex-col gap-4 w-full p-2">
      {studentList.map((student) => (
        <Field key={student.enroleeNumber}>
          <Radio
            value={student}
            className={cn(
              "border border-muted-foreground/30 w-full group relative flex justify-between items-center cursor-pointer rounded-xl p-3 transition data-[checked]:border-none data-[checked]:outline-2 data-[checked]:outline-primary data-[checked]:hover:shadow-none hover:shadow-lg",
              {
                "data-[checked]:outline-secondary": forVizSChool,
              },
            )}>
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center justify-center gap-3">
                <Avatar className="size-11">
                  <AvatarImage
                    className="object-cover"
                    src={student.enroleePhoto ?? "https://github.com/shadcn.png"}
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <span
                    className={cn("font-bold text-[13px] md:text-[13.5px] capitalize text-primary", {
                      "text-secondary": forVizSChool,
                    })}>
                    {student.enroleeFullName}
                  </span>
                  <span className="text-xs font-medium capitalize text-muted-foreground">{student.levelApplied}</span>
                </div>
              </div>
              <CircleCheck
                className={cn(
                  "size-6 md:size-7 fill-primary stroke-primary-foreground opacity-0 scale-50 transition group-data-[checked]:opacity-100 group-data-[checked]:scale-100",
                  {
                    "fill-secondary stroke-secondary-foreground": forVizSChool,
                  },
                )}
              />
            </div>
          </Radio>
        </Field>
      ))}
    </RadioGroup>
  );
});

// function AcademicYearDropdown() {
//   const academicYear = useSelectAcademicYear((state) => state.academicYear);
//   const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);

//   return (
//     <Select value={academicYear} onValueChange={setAcademicYear}>
//       <SelectTrigger className="text-primary mt-4 w-max mx-auto text-sm font-bold cursor-pointer">
//         <Label className="text-sm font-bold">Academic Year</Label>
//         <SelectValue placeholder="Choose academic year" />
//       </SelectTrigger>
//       <SelectContent className="[&_div:focus]:text-primary">
//         {PARENT_FACING_ACADEMIC_YEARS.map((ay) => (
//           <SelectItem key={ay.value} className="text-sm font-bold cursor-pointer" value={ay.value}>
//             {ay.label}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// }

function NoStudents({ forVizSchool = true }: { forVizSchool: boolean }) {
  return (
    <div className="flex h-72 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 transition-all">
      <div className="relative mb-6">
        <div className="relative rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
          <UserRoundPlus
            className={cn("h-8 w-8 text-primary", {
              "text-secondary": forVizSchool,
            })}
            strokeWidth={2.5}
          />
        </div>
      </div>

      <div className="text-center space-y-2 px-6">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          No {forVizSchool ? "learners" : "students"} found
        </h3>
        <p className="text-balance text-[13px] font-medium text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
          Your learner list is currently empty. Start by clicking the
          <span
            className={cn("font-bold text-primary", {
              "text-secondary": forVizSchool,
            })}>
            {" "}
            Add a new {forVizSchool ? "learner" : "student"}
          </span>{" "}
          button below.
        </p>
      </div>
    </div>
  );
}

export default EnrolStudent;
