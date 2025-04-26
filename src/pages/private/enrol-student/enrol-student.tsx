import PageMetaData from "@/components/page-metadata";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ENROL_NEW_STUDENT_TITLE_DESCRIPTION } from "@/data";
import { Field, Radio, RadioGroup } from "@headlessui/react";
import { ArrowLeft, ArrowRight, UserPlus2, UserRoundPlus } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Link } from "react-router";

const studentList = [
  {
    name: "Jane Cruz",
    yearLevel: "Grade 3",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Luke Reyes",
    yearLevel: "Grade 5",
    avatar: "https://i.pravatar.cc/100?img=5",
  },
  {
    name: "Mia Santos",
    yearLevel: "Grade 6",
    avatar: "https://i.pravatar.cc/100?img=8",
  },
];

function EnrolStudent() {
  const { title, description } = ENROL_NEW_STUDENT_TITLE_DESCRIPTION;
  const [selected, setSelected] = useState(studentList[0]);

  const selectStudent = useCallback((student: (typeof studentList)[number]) => {
    setSelected(student);
  }, []);

  return (
    <>
      <PageMetaData title={title} description={description} />
      <div className="fixed top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b px-6 md:px-8">
        <Link
          to={"/admission/dashboard"}
          className={buttonVariants({
            variant: "link",
            className: "gap-2",
          })}>
          <ArrowLeft /> Back to Dashboard
        </Link>
      </div>
      <div className="min-h-screen flex items-center justify-center relative bg-muted">
        <div className="w-full px-6 md:px-0">
          <Card className="w-full max-w-xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Select a student</CardTitle>
              <CardDescription>Selecting a student will proceed with the enrolment process</CardDescription>
            </CardHeader>
            <CardContent>
              {studentList.length > 0 ? (
                <StudentsList selected={selected} setSelected={selectStudent} />
              ) : (
                <NoStudents />
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                size={"lg"}
                disabled={!studentList.length || !selected}
                className="w-full gap-2"
                variant={"outline"}>
                <ArrowRight /> Enrol Student
              </Button>
              <Link
                to={"/enrol-student/new/student-info"}
                className={buttonVariants({
                  size: "lg",
                  className: "gap-2 w-full",
                })}>
                <UserPlus2 /> Add new student
              </Link>
            </CardFooter>
          </Card>
        </div>
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
    <RadioGroup value={selected} onChange={(value) => setSelected(value)} className="flex flex-col gap-4 w-full">
      {studentList.map((student) => (
        <Field key={student.name} className="w-full flex items-center gap-2">
          <Radio
            value={student}
            className="border border-muted-foreground/30 w-full group relative flex cursor-pointer rounded-lg px-4 py-3 transition data-[checked]:outline-2 data-[checked]:outline-primary">
            <div className="flex gap-3">
              <Avatar className="size-12">
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{student.name}</span>
                <span className="leading-none text-sm text-muted-foreground">{student.yearLevel}</span>
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
