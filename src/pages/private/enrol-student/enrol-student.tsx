import { getEnrolledStudents, lookupNewEnrolledStudent } from "@/actions/private";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import EnrollmentStepper from "@/components/private/enrol-student/enrollment-stepper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ENROL_NEW_STUDENT_TITLE_DESCRIPTION } from "@/data";
import useSession from "@/hooks/use-session";
import { canEnrollStudent, cn } from "@/lib/utils";
import { EnrolledStudent } from "@/types";
import { useSelectAcademicYear } from "@/zustand-store";
import { Field, Radio, RadioGroup } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { DotPulse, Tailspin } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { ArrowLeft, ArrowUpRight, UserPlus2, UserRoundPlus } from "lucide-react";
import { motion } from "motion/react";
import { memo, useCallback, useState, useTransition } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import AcademicYearSelector from "./academic-year-selector";

function EnrolStudent() {
  const { session } = useSession();
  const [showEnrollmentProcess, setShowEnrollmentProcess] = useState<boolean>(true);
  const { title, description } = ENROL_NEW_STUDENT_TITLE_DESCRIPTION;
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState<boolean>(false);
  const navigate = useNavigate();
  const { data, isPending } = useQuery({
    queryKey: ["enrolled-students", session?.user.email],
    queryFn: getEnrolledStudents,
    enabled: session != null,
  });
  const [selected, setSelected] = useState<EnrolledStudent | null>(data?.studentsList[0] ?? null);
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);
  const clearState = useSelectAcademicYear((state) => state.clearState);

  const [isLoading, setTransition] = useTransition();

  const selectStudent = useCallback((student: EnrolledStudent) => {
    setSelected(student);
  }, []);

  function goBack() {
    setTransition(() => {
      clearState();
      sessionStorage.clear();
    });
  }

  async function checkEnrollmentExists() {
    if (!selected) return;
    try {
      setIsCheckingEnrollment(true);
      const result = await lookupNewEnrolledStudent({
        studentNumber: selected.studentNumber,
        academicYear,
      });

      if (result) {
        toast.warning("Student already enrolled!", {
          description: `A matching student record is already enrolled for A.Y. ${academicYear.split("y")[1]}`,
        });
        return;
      }

      const isEligibleForEnrollment = await canEnrollStudent(selected.enroleeNumber);

      if (!isEligibleForEnrollment) {
        toast.info("Enrolment not allowed!", {
          description: "The student has completed Secondary 4, the final year of secondary school",
        });
        return;
      }

      navigate(`/enrol-student/${selected?.enroleeNumber}/student-info?academicYear=${academicYear}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <DotPulse size="50" speed="1.3" color="#1F45C7" />
      </div>
    );
  }

  return (
    <>
      <PageMetaData title={title} description={description} />

      <div className={"w-full fixed top-0 z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b"}>
        <MaxWidthWrapper className="w-full max-w-screen-2xl">
          <Link
            onClick={goBack}
            to={"/admission/dashboard"}
            className={buttonVariants({
              variant: "link",
              className: "gap-2",
            })}>
            <ArrowLeft /> Go back
          </Link>
        </MaxWidthWrapper>
      </div>
      {academicYear === "" ? (
        <AcademicYearSelector setSelectedAy={setAcademicYear} />
      ) : (
        <div className="w-full h-screen overflow-hidden pt-16 md:pt-20 flex items-center justify-center bg-muted">
          {showEnrollmentProcess ? (
            <EnrollmentStepper academicYear={academicYear} setShowEnrollmentProcess={setShowEnrollmentProcess} />
          ) : (
            <motion.div
              initial={{
                y: 30,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 14,
                duration: 0.1,
              }}
              className="w-full">
              <Card className="rounded-none w-full max-w-full sm:max-w-lg sm:mx-auto sm:rounded-xl">
                <CardHeader className="text-center px-2">
                  <CardTitle className="text-lg">Select a student</CardTitle>
                  <CardDescription className="text-sm">
                    Only <strong>2025</strong> enrolees are listed. Select a student to continue.
                  </CardDescription>
                  <AcademicYearDropdown />
                </CardHeader>
                <Separator />
                <CardContent className="px-2">
                  <ScrollArea className="h-60">
                    {isPending ? (
                      <div className="flex h-72 w-full flex-col gap-2 items-center justify-center rounded-md border border-dashed bg-muted text-muted-foreground">
                        <p className="text-xs text-muted-foreground animate-pulse">Fetching students...</p>
                        <Tailspin size="20" stroke="3" speed="0.9" color="#262E40" />
                      </div>
                    ) : data?.studentsList != null && data.studentsList.length > 0 ? (
                      <StudentsList selected={selected} setSelected={selectStudent} studentList={data.studentsList} />
                    ) : (
                      <NoStudents />
                    )}
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex items-center flex-col gap-2 px-4">
                  <Button
                    disabled={isCheckingEnrollment}
                    onClick={async () => await checkEnrollmentExists()}
                    variant={"outline"}
                    size={"lg"}
                    className={cn("gap-2 w-full cursor-pointer", {
                      "opacity-70 pointer-events-none": selected == null,
                    })}>
                    {isCheckingEnrollment ? (
                      <DotPulse size="30" speed="1.3" color="#1F45C7" />
                    ) : (
                      <>
                        Enrol student <ArrowUpRight />
                      </>
                    )}
                  </Button>

                  <Link
                    to={`/enrol-student/new/student-info?academicYear=${academicYear}`}
                    className={buttonVariants({
                      size: "lg",
                      className: "gap-2 w-full",
                    })}>
                    Add new student <UserPlus2 />
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
};

const StudentsList = memo(function ({ selected, setSelected, studentList }: StudentsListProps) {
  return (
    <RadioGroup
      value={selected}
      onChange={(value) => {
        if (!value) return;
        setSelected(value);
      }}
      className="flex flex-col gap-2 w-full p-2 pr-4">
      {studentList.map((student) => (
        <Field key={student.enroleeNumber}>
          <Radio
            value={student}
            className="border border-muted-foreground/30 w-full group relative flex justify-between items-center cursor-pointer rounded-lg p-3 transition data-[checked]:outline-2 data-[checked]:outline-primary data-[checked]:hover:shadow-none hover:shadow-lg">
            <div className="flex gap-3">
              <Avatar className="size-11">
                <AvatarImage
                  className="object-cover"
                  src={student.enroleePhoto ?? "https://github.com/shadcn.png"}
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm capitalize">{student.enroleeFullName}</span>
                <span className="text-xs text-muted-foreground font-medium capitalize">{student.levelApplied}</span>
              </div>
            </div>
          </Radio>
        </Field>
      ))}
    </RadioGroup>
  );
});

function AcademicYearDropdown() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);

  return (
    <Select value={academicYear} onValueChange={setAcademicYear}>
      <SelectTrigger className="text-primary mt-2 w-max mx-auto text-xs font-semibold" size="sm">
        <Label className="text-xs font-semibold">Academic Year</Label>
        <SelectValue placeholder="Choose academic year" />
      </SelectTrigger>
      <SelectContent className="[&_div:focus]:text-primary">
        <SelectItem className="text-xs font-semibold" value="ay2025">
          2025
        </SelectItem>
        <SelectItem className="text-xs font-semibold" value="ay2026">
          2026
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function NoStudents() {
  return (
    <div className="flex h-72 w-full flex-col items-center justify-center rounded-md border border-dashed bg-muted text-muted-foreground">
      <UserRoundPlus className="mb-4 h-10 w-10 text-primary" />
      <div className="text-center space-y-1">
        <p className="font-medium">No enrolled students found</p>
        <p className="text-xs text-muted-foreground">Start by clicking the button below to enrol a child.</p>
      </div>
    </div>
  );
}

export default EnrolStudent;
