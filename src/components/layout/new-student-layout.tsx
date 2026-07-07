import EnrolNewStudentContextProvider, { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { ArrowLeft, CheckCircle2, FilePen, Send } from "lucide-react";
import { Outlet, useNavigate, useSearchParams } from "react-router";
import MaxWidthWrapper from "../max-width-wrapper";
import NewStudentSteps from "../private/enrol-student/new-student-steps";
import { buttonVariants } from "../ui/button";

import { discardDraft } from "@/actions/discard-draft";
import { submitEnrollment } from "@/actions/private";
import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
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
import { useResolveResumeDraft } from "@/hooks/use-resolve-resume-draft";
import { useSaveApplication } from "@/hooks/use-save-application";
import useSession from "@/hooks/use-session";
import { isExpired, listNewStudentDrafts } from "@/lib/draft-storage";
import { getStepValidity } from "@/lib/step-validity";
import { EnrolNewStudentDraftStore } from "@/zustand-store";
import { EnrolNewStudentFormState } from "@/types";
import {
  useApplicationDraftsDialogStore,
  useEnrolNewStudentTabStateStore,
  usePassTypeStore,
  usePreCourseAcknowledgementStore,
  useSelectAcademicYear,
} from "@/zustand-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { OctagonAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useLocation } from "react-router";
import { toast } from "sonner";
import ISSavedDraftsDialog from "../private/is-saved-drafts-list";

const academicYears = BACKEND_ACADEMIC_YEARS;

function NewStudentLayout() {
  const studentDrafts = listNewStudentDrafts("hfse-is") || [];
  const isOpen = useApplicationDraftsDialogStore((state) => state.isOpen);
  const setIsOpen = useApplicationDraftsDialogStore((state) => state.setIsOpen);
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const academicYearParams = searchParams.get("academicYear");
  const [isPending, setIsPending] = useState<boolean>(false);

  const isResumingFromDashboard = Boolean(location.state?.resumeDraftId);

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

  const hasCheckedDrafts = useRef<boolean>(false);

  useEffect(() => {
    if (hasCheckedDrafts.current) return;

    if (!isResumingFromDashboard && studentDrafts.length > 0 && academicYears.includes(academicYear)) {
      setIsOpen(true);
    }

    hasCheckedDrafts.current = true;
  }, []);

  return (
    <EnrolNewStudentContextProvider>
      <AutoResumeDraft />
      {isOpen ? (
        <ISSavedDraftsDialog />
      ) : (
        <>
          <div className="w-full sticky top-0 z-20 bg-white/70 backdrop-blur-lg h-20 md:h-24 flex items-center border-b">
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
                {isPending || isResumingFromDashboard ? (
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
        </>
      )}
    </EnrolNewStudentContextProvider>
  );
}

function AutoResumeDraft() {
  const location = useLocation();
  const navigate = useNavigate();
  const resumeDraftId = location.state?.resumeDraftId as string | undefined;
  const { setFormState, setActiveTab, setCurrentTab, setCompletedTabs } = useEnrolNewStudentContext();
  const hasRun = useRef(false);

  // Falls back to a server lookup when there's no local match — e.g. the draft was started on
  // a different browser/device (src/actions/resolve-draft.ts).
  const { data: match, isSuccess } = useResolveResumeDraft(resumeDraftId, "hfse-is");

  useEffect(() => {
    if (!isSuccess || hasRun.current) return;
    hasRun.current = true;

    if (!match) {
      navigate("/admission/drafts", { replace: true });
      return;
    }

    const state = match.state as unknown as EnrolNewStudentDraftStore;

    if (isExpired(state.expiresAt)) {
      navigate("/admission/drafts", { replace: true });
      return;
    }

    setActiveTab(state.activeTab);
    setCurrentTab(state.currentTab);
    setCompletedTabs(state.completedTabs);
    setFormState({ ...state.formState, draftId: state.draftId } as EnrolNewStudentFormState);

    navigate(`${state.activeTab}?academicYear=${state.academicYear}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, match]);

  return null;
}

function DraftApplication() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const { currentTab, completedTabs, activeTab } = useEnrolNewStudentContext();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);

  const { isLoading, saveApplication } = useSaveApplication({
    academicYear,
    activeTab,
    completedTabs,
    currentTab,
    formState,
    setFormState,
    type: "hfse-is",
  });

  return (
    <Button
      variant={"outline"}
      disabled={isLoading}
      onClick={async () => await saveApplication({ willExit: true })}
      className="gap-2 font-bold">
      {isLoading ? (
        <>
          Saving
          <DotPulse size="30" speed="1.3" color="black" />
        </>
      ) : (
        <>
          <FilePen /> Save & exit
        </>
      )}
    </Button>
  );
}

function SubmitApplicationDialog() {
  const navigate = useNavigate();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const queryClient = useQueryClient();
  const { session } = useSession();
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const { formState } = useEnrolNewStudentContext();
  const clearPreCourse = usePreCourseAcknowledgementStore((state) => state.clearState);
  // Hard re-entrancy guard: `isPending` only flips after a re-render, so a same-tick double
  // click on "Continue" could otherwise fire the mutation (and its insert) twice before the
  // button disables. This ref is checked-and-set synchronously, closing that window.
  const submitInFlight = useRef(false);
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ enrollmentDetails, draftId }: { enrollmentDetails: EnrolNewStudentFormState; draftId: string | undefined }) => {
      const result = await submitEnrollment(enrollmentDetails, academicYear, {
        preCourseAcknowledgedAt: new Date(),
        preCourseAnswer: enrollmentDetails.preCourseAnswer as string,
        preCourseDate: enrollmentDetails.preCourseDate,
      });
      return { ...result, draftId };
    },
    onSettled() {
      submitInFlight.current = false;
    },
    onSuccess(data) {
      discardDraft(data.draftId, "hfse-is");
      navigate("/application-submitted", {
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
      clearPreCourse();
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

    const draftId = formState.draftId ?? undefined;

    if (formState.createdAt) {
      delete formState.createdAt;
    }

    if (formState.draftId) {
      delete formState.draftId;
    }

    const uploadReqs = formState.uploadRequirements.studentUploadRequirements as Record<string, unknown>;
    if (uploadReqs.showVaccinationInformation) {
      delete uploadReqs.showVaccinationInformation;
    }

    if (submitInFlight.current) return;
    submitInFlight.current = true;
    mutate({ enrollmentDetails: { ...(formState as EnrolNewStudentFormState), stpApplicationType }, draftId });
  }

  const v = getStepValidity(formState, "hfse-is");
  const allValid = v.studentInfo && v.familyInfo && v.enrollmentInfo && v.uploadRequirements;

  return (
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
  const clearPreCourse = usePreCourseAcknowledgementStore((state) => state.clearState);
  const clearPassType = usePassTypeStore((state) => state.clearState);
  const { clearState } = useEnrolNewStudentContext();
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);
  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  function exitApplication() {
    clearState();
    clearAcademicYearState();
    clearEnrolNewStudentTabState();
    clearPassType();
    clearPreCourse();
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
            <DrawerDescription className="text-xs md:text-sm font-medium leading-relaxed">
              You are about to leave this application page. Any changes you have made will not be kept unless you choose
              <span className="text-black font-bold"> Save & exit</span>.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="mt-2 !flex-col sm:justify-center gap-4">
            <DraftApplication />
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
          <AlertDialogDescription className="text-xs md:text-sm text-center font-medium leading-relaxed">
            You are about to leave this application page. Any changes you have made will not be kept unless you choose
            <span className="text-black font-bold"> Save & exit</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 !flex-col sm:justify-center gap-4">
          <DraftApplication />
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

export default NewStudentLayout;
