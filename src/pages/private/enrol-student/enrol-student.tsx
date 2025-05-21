import { getEnrolledStudents } from "@/actions/private";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ENROL_NEW_STUDENT_TITLE_DESCRIPTION } from "@/data";
import { cn } from "@/lib/utils";
import { EnrolledStudent } from "@/types";
import { Field, Radio, RadioGroup } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import { ArrowLeft, ChevronRight, UserPlus2, UserRoundPlus } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Link } from "react-router";

function EnrolStudent() {
  const { title, description } = ENROL_NEW_STUDENT_TITLE_DESCRIPTION;
  const { data, isPending } = useQuery({
    queryKey: ["enrolled-students"],
    queryFn: getEnrolledStudents,
  });
  const [selected, setSelected] = useState<EnrolledStudent | null>(data?.studentsList[0] ?? null);

  const selectStudent = useCallback((student: EnrolledStudent) => {
    setSelected(student);
  }, []);

  return (
    <>
      <PageMetaData title={title} description={description} />

      <div className="w-full fixed top-0 z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b">
        <MaxWidthWrapper className="w-full max-w-screen-2xl">
          <Link
            to={"/admission/dashboard"}
            className={buttonVariants({
              variant: "link",
              className: "gap-2",
            })}>
            <ArrowLeft /> Go back
          </Link>
        </MaxWidthWrapper>
      </div>
      <div className="w-full h-screen flex items-center justify-center bg-muted">
        <Card className="rounded-none w-full max-w-full sm:max-w-lg sm:mx-auto sm:rounded-xl">
          <CardHeader className="text-center px-2">
            <CardTitle className="text-lg">Select a student</CardTitle>
            <CardDescription className="text-sm">
              Selecting a student will proceed with the enrolment process
            </CardDescription>
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
            <Link
              to={`/enrol-student/${selected?.enroleeNumber}/student-info`}
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: cn("gap-2 w-full", {
                  "opacity-70 pointer-events-none": selected == null,
                }),
              })}>
              Enrol student <ChevronRight />
            </Link>
            <Link
              to={"/enrol-student/new/student-info"}
              className={buttonVariants({
                size: "lg",
                className: "gap-2 w-full",
              })}>
              Add new student <UserPlus2 />
            </Link>
          </CardFooter>
        </Card>
      </div>
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
                <span className="font-semibold text-sm capitalize">{student.studentName}</span>
                <span className="text-xs text-muted-foreground font-medium capitalize">{student.levelApplied}</span>
              </div>
            </div>
          </Radio>
        </Field>
      ))}
    </RadioGroup>
  );
});

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
