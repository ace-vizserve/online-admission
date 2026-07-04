import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import EnrolOldStudentContextProvider, { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { useHydrateReEnrollment } from "@/hooks/use-hydrate-reenrollment";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { Link, Outlet, useNavigate, useParams, useSearchParams } from "react-router";
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
import { usePassTypeStore, usePreCourseAcknowledgementStore, useSelectAcademicYear } from "@/zustand-store";
import { OctagonAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

const academicYears = BACKEND_ACADEMIC_YEARS;

function OldStudentLayout() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const academicYearParams = searchParams.get("academicYear");
  const [isPending, setIsPending] = useState<boolean>(false);
  const { isPending: isHydratingReEnrollment, isNotFound: reEnrollmentNotFound } = useHydrateReEnrollment(params.id);

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
    <EnrolOldStudentContextProvider>
      <div className="sticky top-0 w-full z-20 bg-white/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
        <MaxWidthWrapper className="w-full max-w-screen-2xl flex items-center justify-between px-4 md:px-6">
          <ExitApplicationDialog />
          <SubmitApplicationDialog />
        </MaxWidthWrapper>
      </div>

      <MaxWidthWrapper className="max-w-screen-2xl ">
        <div className="min-h-dvh w-full flex flex-col md:gap-12 items-center justify-start">
          <div className="w-full overflow-x-auto">
            <OldStudentSteps />
          </div>
          <div className="w-full">
            {isPending || isHydratingReEnrollment ? (
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
            ) : reEnrollmentNotFound ? (
              <ReEnrollmentNotFound />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </EnrolOldStudentContextProvider>
  );
}

function ExitApplicationDialog() {
  const { clearState } = useEnrolOldStudentContext();
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);
  const clearPreCourse = usePreCourseAcknowledgementStore((state) => state.clearState);
  const clearPassType = usePassTypeStore((state) => state.clearState);

  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  function exitApplication() {
    clearPassType();
    clearPreCourse();
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
            onClick={async () => await exitApplication()}
            className={buttonVariants({ variant: "destructive", className: "font-bold" })}>
            Exit Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ReEnrollmentNotFound() {
  return (
    <div className="w-full h-[70vh] flex items-center justify-center flex-col gap-6 text-center px-6">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="relative p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl">
          <FolderOpen className="size-16 text-indigo-500" />
        </div>
      </div>

      <div className="max-w-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Record Not Found</h1>
        <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
          We couldn't find an application you own for this student. It may have been moved, or this link may no
          longer be valid.
        </p>
      </div>

      <Link
        to="/admission/dashboard"
        className={buttonVariants({
          size: "lg",
          className:
            "gap-2 shadow-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white !rounded-2xl border-b-4 border-indigo-800 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all mt-2",
        })}>
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </Link>
    </div>
  );
}

export default OldStudentLayout;
