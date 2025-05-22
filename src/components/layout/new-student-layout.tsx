import EnrolNewStudentContextProvider, { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import NewStudentSteps from "../private/enrol-student/new-student-steps";
import { buttonVariants } from "../ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSelectAcademicYear } from "@/zustand-store";
import { OctagonAlert } from "lucide-react";
import { useEffect } from "react";
import BeforeUnloadWarning from "../private/enrol-student/before-unload-warning";

function NewStudentLayout() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const academicYearParams = searchParams.get("academicYear");

    if (!academicYearParams) {
      navigate("/admission/dashboard");
    }

    if (academicYearParams != academicYear) {
      setSearchParams({ academicYear });
    }
  }, [academicYear, navigate, searchParams, setSearchParams]);

  return (
    <>
      <BeforeUnloadWarning />
      <EnrolNewStudentContextProvider>
        <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b">
          <MaxWidthWrapper className="w-full max-w-screen-2xl">
            <ExitApplicationDialog />
          </MaxWidthWrapper>
        </div>
        <MaxWidthWrapper className="max-w-screen-2xl bg-grainy">
          <div className="min-h-screen max-w-screen-2xl mx-auto flex flex-col md:gap-12 items-center justify-center">
            <div className="w-full overflow-x-auto">
              <NewStudentSteps />
            </div>
            <Outlet />
          </div>
        </MaxWidthWrapper>
      </EnrolNewStudentContextProvider>
    </>
  );
}

function ExitApplicationDialog() {
  const { setFormState } = useEnrolNewStudentContext();
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);

  function exitApplication() {
    setFormState({});
    setAcademicYear("");
    sessionStorage.removeItem("enrolNewStudentFormState");
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link" className="gap-2">
          <ArrowLeft />
          Go back
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <OctagonAlert className="h-7 w-7 text-destructive" />
            </div>
            Exit Application?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs md:text-sm text-center">
            Are you sure you want to exit this page? Both saved and unsaved information will be removed and cannot be
            recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={exitApplication} className={buttonVariants({ variant: "destructive" })}>
            Exit Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default NewStudentLayout;
