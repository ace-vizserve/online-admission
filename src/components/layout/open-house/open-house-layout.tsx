import { SubmitFailureDialog } from "@/components/private/enrol-student/submit-failure-dialog";
import { useSubmitFailure } from "@/hooks/use-submit-failure";
import { ArrowLeft, CheckCircle2, OctagonAlert, Send } from "lucide-react";
import { Outlet, useNavigate } from "react-router";

import { userRegister } from "@/actions/auth";
import { submitEnrollment, submitVizSchoolEnrollment } from "@/actions/private";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import OpenHouseSteps from "@/components/private/open-house/open-house-steps";
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
import OpenHouseContextProvider, { useOpenHouseContext } from "@/context/open-house/open-house-student-context";
import { safeSessionStorage } from "@/lib/safe-storage";
import { getStepValidity } from "@/lib/step-validity";
import useSession from "@/hooks/use-session";
import { OpenHouseFormState } from "@/types";
import {
  useEnrolNewStudentTabStateStore,
  useOpenHouseCredentialsStore,
  usePassTypeStore,
  usePreCourseAcknowledgementStore,
  useSelectAcademicYear,
  useSelectOpenHouseInstitution,
} from "@/zustand-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { toast } from "sonner";

function OpenHouseLayout() {
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const institution = useSelectOpenHouseInstitution((state) => state.institution);
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (!academicYear) {
      setIsPending(true);

      const timeout = setTimeout(() => {
        navigate("/open-house-registration");
      }, 1500);

      return () => clearTimeout(timeout);
    }

    setIsPending(false);
  }, [academicYear, navigate]);

  return (
    <OpenHouseContextProvider>
      <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
        <MaxWidthWrapper className="w-full flex justify-between items-center max-w-screen-2xl px-4 md:px-6">
          <ExitApplicationDialog />
          <SubmitApplicationDialog academicYear={academicYear} institution={institution} />
        </MaxWidthWrapper>
      </div>
      <MaxWidthWrapper className="max-w-screen-2xl">
        <div className="min-h-dvh w-full flex flex-col md:gap-12 items-center justify-start">
          <div className="w-full overflow-x-auto">
            <OpenHouseSteps />
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
    </OpenHouseContextProvider>
  );
}

function SubmitApplicationDialog({ academicYear, institution }: { academicYear: string; institution: string }) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { session } = useSession();
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const preCourseAnswer = usePreCourseAcknowledgementStore((state) => state.preCourseAnswer) as string;
  const preCourseDate = usePreCourseAcknowledgementStore((state) => state.preCourseDate) as Date;
  const clearCredentials = useOpenHouseCredentialsStore((state) => state.clearState);
  const { formState } = useOpenHouseContext();
  const { failure, reportFailure, dismissFailure } = useSubmitFailure();

  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: OpenHouseFormState) => {
      const { email, firstName, lastName, relationship } = enrollmentDetails.accountInfo;
      const { password, confirmPassword } = useOpenHouseCredentialsStore.getState();

      await userRegister({
        firstName,
        lastName,
        email,
        password,
        relationship,
        confirmPassword,
        isOpenHouseRegistration: true,
      });

      // Deliberately unguarded: a throw here has to reach `onError`, which is the only place
      // that tells the parent their application did not go through. This used to be wrapped in
      // a try/catch that toasted and returned undefined, so a failed submit reached `onSuccess`
      // with no data and was silently dropped.
      if (institution === "vizschool") {
        return await submitVizSchoolEnrollment(enrollmentDetails, academicYear, "", "VizSchool New");
      }

      return await submitEnrollment(enrollmentDetails, academicYear, {
        preCourseAnswer,
        preCourseDate,
        preCourseAcknowledgedAt: new Date(),
      });
    },
    onSuccess(data) {
      if (!data?.generatedEnroleeNumber) return;

      navigate("/open-house-registration-submitted", {
        state: {
          academicYear,
          enroleeNumber: data.generatedEnroleeNumber,
        },
      });
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
      clearCredentials();
      safeSessionStorage.clear();
    },
    onError(error) {
      void reportFailure(error);
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

    mutate({ ...(formState as OpenHouseFormState) });
  }

  const v = getStepValidity(formState, "open-house");
  const allValid = v.studentInfo && v.familyInfo && v.enrollmentInfo && v.uploadRequirements;

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={!allValid || isPending}
            className="gap-2 bg-green-600 hover:bg-green-500 font-bold">
            {isPending ? (
              <>
                Sending
                <DotPulse size="30" speed="1.3" color="white" />
              </>
            ) : (
              <>
                Send Registration <Send />
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
      <SubmitFailureDialog failure={failure} onDismiss={dismissFailure} />
    </>
  );
}

function ExitApplicationDialog() {
  const { clearState } = useOpenHouseContext();
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);
  const clearPassType = usePassTypeStore((state) => state.clearState);
  const clearPreCourse = usePreCourseAcknowledgementStore((state) => state.clearState);
  const clearInstitution = useSelectOpenHouseInstitution((state) => state.clearState);
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const clearCredentials = useOpenHouseCredentialsStore((state) => state.clearState);

  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  function exitApplication() {
    clearState();
    clearAcademicYearState();
    clearEnrolNewStudentTabState();
    clearPassType();
    clearCredentials();
    clearPreCourse();
    clearInstitution();
    safeSessionStorage.clear();
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

export default OpenHouseLayout;
