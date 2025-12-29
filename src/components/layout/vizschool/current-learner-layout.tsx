import MaxWidthWrapper from "@/components/max-width-wrapper";
import CurrentLearnerSteps from "@/components/private/enrol-student/vizschool/current-learner-steps";
import SubmitLearnerApplicationDialog from "@/components/private/enrol-student/vizschool/submit-learner-application-dialog";
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
import { Button, buttonVariants } from "@/components/ui/button";
import EnrolCurrentLearnerContextProvider, {
  useEnrolCurrentLearnerContext,
} from "@/context/vizschool/enrol-current-learner-context";
import { useSelectAcademicYear, useSelectSchoolFee } from "@/zustand-store";
import { ArrowLeft, OctagonAlert } from "lucide-react";
import { useCallback, useEffect, useTransition } from "react";
import { Outlet, useNavigate, useSearchParams } from "react-router";

function CurrentLearnerLayout() {
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
    <EnrolCurrentLearnerContextProvider>
      <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 flex items-center border-b">
        <MaxWidthWrapper className="w-full max-w-screen-2xl flex items-center justify-between px-4 md:px-6">
          <ExitApplicationDialog />
          <SubmitLearnerApplicationDialog />
        </MaxWidthWrapper>
      </div>

      <MaxWidthWrapper className="max-w-screen-2xl ">
        <div className="min-h-dvh w-full flex flex-col md:gap-12 items-center justify-start">
          <div className="w-full overflow-x-auto">
            <CurrentLearnerSteps />
          </div>
          <div className="w-full">
            {isPending ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-50 animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-indigo-100"></div>
                    <div className="absolute h-12 w-12 animate-spin rounded-full border-6 border-transparent border-t-indigo-600"></div>
                  </div>

                  <div className="space-y-1 text-center">
                    <p className="font-bold text-slate-800 tracking-tight">Preparing Enrolment</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest animate-pulse">
                      Updating Information...
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </EnrolCurrentLearnerContextProvider>
  );
}

function ExitApplicationDialog() {
  const { clearState } = useEnrolCurrentLearnerContext();
  const clearSchoolFeeState = useSelectSchoolFee((state) => state.clearState);
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);

  function exitApplication() {
    clearSchoolFeeState();
    clearState();
    clearAcademicYearState();
    sessionStorage.clear();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link" className="gap-2 font-bold">
          <ArrowLeft />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="items-center">
          <AlertDialogTitle className="font-black">
            <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <OctagonAlert className="h-7 w-7 text-destructive" />
            </div>
            Exit Application?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs md:text-sm text-center font-medium">
            Are you sure you want to exit this page? Both saved and unsaved information will be removed and cannot be
            recovered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={exitApplication}
            className={buttonVariants({ variant: "destructive", className: "font-bold" })}>
            Exit Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CurrentLearnerLayout;
