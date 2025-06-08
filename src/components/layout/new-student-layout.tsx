import EnrolNewStudentContextProvider, { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import NewStudentSteps from "../private/enrol-student/new-student-steps";
import { buttonVariants } from "../ui/button";

import { submitEnrollment } from "@/actions/private";
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
import { EnrolNewStudentFormState, EnrolOldStudentFormState } from "@/types";
import { useEnrolNewStudentTabStateStore, useSelectAcademicYear } from "@/zustand-store";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { OctagonAlert } from "lucide-react";
import { useCallback, useEffect, useTransition } from "react";

function NewStudentLayout() {
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
    <EnrolNewStudentContextProvider>
      <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b">
        <MaxWidthWrapper className="w-full flex justify-between items-center max-w-screen-2xl">
          <ExitApplicationDialog />
          <SubmitApplicationDialog />
        </MaxWidthWrapper>
      </div>
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="min-h-screen w-full flex flex-col md:gap-12 items-center justify-start">
          <div className="w-full overflow-x-auto">
            <NewStudentSteps />
          </div>
          <div
            className={cn("w-full opacity-100 scale-100 transition-all", {
              "scale-95 opacity-70": isPending,
            })}>
            <Outlet />
          </div>
        </div>
      </MaxWidthWrapper>
    </EnrolNewStudentContextProvider>
  );
}

function SubmitApplicationDialog() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);

  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const { formState } = useEnrolNewStudentContext();
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: EnrolNewStudentFormState) => {
      return await submitEnrollment(enrollmentDetails, academicYear);
    },
    onSuccess() {
      window.location.href = "/application-submitted";
    },
    onSettled() {
      clearEnrolNewStudentTabState();
      sessionStorage.clear();
    },
  });

  function submitApplication() {
    mutate(formState as EnrolOldStudentFormState);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          disabled={isPending || !formState.uploadRequirements?.parentGuardianUploadRequirements.isValid}
          className="gap-2 bg-green-600 hover:bg-green-500">
          {isPending ? (
            <>
              Sending
              <DotPulse size="30" speed="1.3" color="white" />
            </>
          ) : (
            <>
              Send Application <Send />
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle>
            <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs md:text-sm text-center">
            Please verify the details to ensure everything is correct before submitting. Inaccurate information may
            cause delays.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="!bg-green-600 hover:!bg-green-500"
            onClick={submitApplication}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ExitApplicationDialog() {
  const { clearState } = useEnrolNewStudentContext();
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);

  function exitApplication() {
    clearState();
    clearAcademicYearState();
    clearEnrolNewStudentTabState();
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

export default NewStudentLayout;
