import { VIZSCHOOL_ACADEMIC_YEARS } from "@/config/academic-years";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import EnrolCurrentLearnerContextProvider, {
  useEnrolCurrentLearnerContext,
} from "@/context/vizschool/enrol-current-learner-context";
import { useSelectAcademicYear, useSelectSchoolFee } from "@/zustand-store";
import { ArrowLeft, OctagonAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Outlet, useNavigate, useSearchParams } from "react-router";

const academicYears = VIZSCHOOL_ACADEMIC_YEARS;

function CurrentLearnerLayout() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const academicYearParams = searchParams.get("academicYear");
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!academicYears.includes(academicYear)) {
      setIsPending(true);

      const timeout = setTimeout(() => {
        navigate("/admission/dashboard");
      }, 1500);

      return () => clearTimeout(timeout);
    }

    if (academicYearParams !== academicYear) {
      setSearchParams({ academicYear });
    }

    setIsPending(false);
  }, [academicYear, navigate]);

  return (
    <EnrolCurrentLearnerContextProvider>
      <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
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
                    <p className="font-bold text-slate-800 tracking-tight">Loading Enrolment</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest animate-pulse">
                      Preparing Information...
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
  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  function exitApplication() {
    clearSchoolFeeState();
    clearState();
    clearAcademicYearState();
    sessionStorage.clear();
  }

  if (!isDesktop) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="link" className="gap-2 font-bold">
            <ArrowLeft />
            Cancel
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="items-center text-center">
            <DrawerTitle className="font-black">
              <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <OctagonAlert className="h-7 w-7 text-destructive" />
              </div>
              Exit Application?
            </DrawerTitle>
            <DrawerDescription className="text-xs md:text-sm text-center font-medium">
              Are you sure you want to exit this page? Both saved and unsaved information will be removed and cannot be
              recovered.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="mt-2 !flex-col sm:justify-center gap-4">
            <DrawerClose asChild>
              <Button className="font-bold" variant={"outline"}>
                Cancel
              </Button>
            </DrawerClose>
            <DrawerClose>
              <Button
                variant="destructive"
                className="font-bold w-full sm:w-auto"
                onClick={async () => await exitApplication()}>
                Exit Anyway
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
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
