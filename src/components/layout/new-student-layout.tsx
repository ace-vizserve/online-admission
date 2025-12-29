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
import useSession from "@/hooks/use-session";
import { EnrolNewStudentFormState } from "@/types";
import { useEnrolNewStudentTabStateStore, useSelectAcademicYear } from "@/zustand-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { OctagonAlert } from "lucide-react";
import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";

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
        <MaxWidthWrapper className="w-full flex justify-between items-center max-w-screen-2xl px-4 md:px-6">
          <ExitApplicationDialog />
          <SubmitApplicationDialog />
        </MaxWidthWrapper>
      </div>
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="min-h-dvh w-full flex flex-col md:gap-12 items-center justify-start">
          <div className="w-full overflow-x-auto">
            <NewStudentSteps />
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
    </EnrolNewStudentContextProvider>
  );
}

function SubmitApplicationDialog() {
  const navigate = useNavigate();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const queryClient = useQueryClient();
  const { session } = useSession();
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const { formState } = useEnrolNewStudentContext();
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: EnrolNewStudentFormState) => {
      return await submitEnrollment(enrollmentDetails, academicYear);
    },
    onSuccess() {
      window.location.href = "/application-submitted";
      queryClient.invalidateQueries({
        queryKey: ["section-cards", session?.user.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["students-list", session?.user.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-enrollments-list", session?.user.email],
      });
      clearEnrolNewStudentTabState();
      sessionStorage.clear();
    },
    onError() {
      toast.error("Uh oh! Something went wrong", {
        description: "An unknown error occurred. Please try again.",
      });
    },
  });

  function submitApplication() {
    if (formState.uploadRequirements?.studentUploadRequirements == null) {
      toast.warning("Please upload the required documents in documents tab", {
        description: "Kindly double check every details before submitting",
        action: {
          label: "Edit Info",
          onClick: () => navigate(`/enrol-student/new/documents?academicYear=${academicYear}`),
        },
        actionButtonStyle: {
          backgroundColor: "#DC7609",
        },
      });
      return;
    }

    if (formState.uploadRequirements?.parentGuardianUploadRequirements == null) {
      toast.warning("Please upload the required documents in documents tab", {
        description: "Kindly double check every details before submitting",
        action: {
          label: "Edit Info",
          onClick: () => navigate(`/enrol-student/new/documents?academicYear=${academicYear}`),
        },
        actionButtonStyle: {
          backgroundColor: "#DC7609",
        },
      });
      return;
    }

    mutate(formState as EnrolNewStudentFormState);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          disabled={
            formState.uploadRequirements?.studentUploadRequirements?.isValid != true ||
            formState.uploadRequirements?.parentGuardianUploadRequirements?.isValid != true ||
            isPending
          }
          className="gap-2 bg-green-600 hover:bg-green-500 font-bold">
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
          <AlertDialogTitle className="font-black">
            <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs md:text-sm text-center font-medium">
            Please verify the details to ensure everything is correct before submitting. Inaccurate information may
            cause delays.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:justify-center">
          <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="!bg-green-600 hover:!bg-green-500 font-bold"
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

export default NewStudentLayout;
