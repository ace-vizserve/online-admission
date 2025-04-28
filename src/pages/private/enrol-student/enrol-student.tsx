import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ENROL_NEW_STUDENT_TITLE_DESCRIPTION } from "@/data";
import { Field, Radio, RadioGroup } from "@headlessui/react";
import { ArrowLeft, ArrowRight, UserPlus2, UserRoundPlus } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Link } from "react-router";

const studentList = [
  {
    id: "std001",
    name: "Jane Cruz",
    yearLevel: "Grade 3",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    id: "std002",
    name: "Luke Reyes",
    yearLevel: "Grade 5",
    avatar: "https://i.pravatar.cc/100?img=5",
  },
  {
    id: "std003",
    name: "Mia Santos",
    yearLevel: "Grade 6",
    avatar: "https://i.pravatar.cc/100?img=8",
  },
  {
    id: "std004",
    name: "Ethan Lim",
    yearLevel: "Grade 4",
    avatar: "https://i.pravatar.cc/100?img=14",
  },
  {
    id: "std005",
    name: "Sofia Dela Cruz",
    yearLevel: "Grade 2",
    avatar: "https://i.pravatar.cc/100?img=20",
  },
  {
    id: "std006",
    name: "Noah Garcia",
    yearLevel: "Grade 1",
    avatar: "https://i.pravatar.cc/100?img=33",
  },
];

function EnrolStudent() {
  const { title, description } = ENROL_NEW_STUDENT_TITLE_DESCRIPTION;
  const [selected, setSelected] = useState<(typeof studentList)[number]>(studentList[0]);

  const selectStudent = useCallback((student: (typeof studentList)[number]) => {
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
              {studentList.length > 0 ? (
                <StudentsList selected={selected} setSelected={selectStudent} />
              ) : (
                <NoStudents />
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 px-4">
            <Link
              to={`/enrol-student/${selected.id}/student-info`}
              className={buttonVariants({
                size: "lg",
                variant: "outline",
                className: "gap-2 w-full",
              })}>
              Enrol Student <ArrowRight />
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
  selected: (typeof studentList)[number];
  setSelected: (student: (typeof studentList)[number]) => void;
};

const StudentsList = memo(function ({ selected, setSelected }: StudentsListProps) {
  return (
    <RadioGroup
      value={selected}
      onChange={(value) => setSelected(value)}
      className="flex flex-col gap-2 w-full p-2 pr-4">
      {studentList.map((student) => (
        <Field key={student.name}>
          <Radio
            value={student}
            className="border border-muted-foreground/30 w-full group relative flex cursor-pointer rounded-lg p-3 transition data-[checked]:outline-2 data-[checked]:outline-primary data-[checked]:hover:shadow-none hover:shadow-lg">
            <div className="flex gap-3">
              <Avatar className="size-11">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm">{student.name}</span>
                <span className="text-xs text-muted-foreground">{student.yearLevel}</span>
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
