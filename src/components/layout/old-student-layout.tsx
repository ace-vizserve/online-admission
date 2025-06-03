import EnrolOldStudentContextProvider, { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import OldStudentSteps from "../private/enrol-student/old-student-steps";
import SubmitApplicationDialog from "../private/enrol-student/submit-application-dialog";
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
import { cn } from "@/lib/utils";
import { useSelectAcademicYear } from "@/zustand-store";
import { OctagonAlert } from "lucide-react";
import { useCallback, useEffect, useTransition } from "react";
import BeforeUnloadWarning from "../private/enrol-student/before-unload-warning";

function OldStudentLayout() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, setTransition] = useTransition();

  const redirectToDashboard = useCallback(() => {
    setTransition(() => {
      navigate("/admission/dashboard");
    });
  }, [navigate]);

  useEffect(() => {
    const academicYearParams = searchParams.get("academicYear");

    if (!academicYearParams) {
      redirectToDashboard();
    }

    if (academicYearParams != academicYear) {
      setSearchParams({ academicYear });
    }
  }, [academicYear, redirectToDashboard, searchParams, setSearchParams]);

  return (
    <>
      <BeforeUnloadWarning />
      <EnrolOldStudentContextProvider>
        <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b">
          <MaxWidthWrapper className="w-full max-w-screen-2xl flex items-center justify-between ">
            <ExitApplicationDialog />
            <SubmitApplicationDialog />
          </MaxWidthWrapper>
        </div>

        <MaxWidthWrapper className="max-w-screen-2xl ">
          <div className="min-h-screen w-full flex flex-col md:gap-12 items-center justify-start">
            <div className="w-full overflow-x-auto">
              <OldStudentSteps />
            </div>
            <div
              className={cn("w-full opacity-100 scale-100 transition-all", {
                "scale-95 opacity-70": isPending,
              })}>
              <Outlet />
            </div>
          </div>
        </MaxWidthWrapper>
      </EnrolOldStudentContextProvider>
    </>
  );
}

function ExitApplicationDialog() {
  const { clearState } = useEnrolOldStudentContext();
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);

  function exitApplication() {
    clearState();
    clearAcademicYearState();
    sessionStorage.clear();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link" className="gap-2">
          <ArrowLeft />
          Cancel
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

export default OldStudentLayout;
