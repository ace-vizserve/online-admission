import { SubmitFailureDialog } from "./submit-failure-dialog";
import { useSubmitFailure } from "@/hooks/use-submit-failure";
import { deleteReenrolDraftRemote } from "@/actions/drafts";
import { submitExistingEnrollment } from "@/actions/private";
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
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { applicationTypes } from "@/data";
import useSession from "@/hooks/use-session";
import { EnrolOldStudentFormState } from "@/types";
import { usePassTypeStore, usePreCourseAcknowledgementStore, useSelectAcademicYear } from "@/zustand-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CheckCircle2, Send } from "lucide-react";
import { useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

function SubmitApplicationDialog() {
  const navigate = useNavigate();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const params = useParams();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { formState, clearState } = useEnrolOldStudentContext();
  const clearPreCourse = usePreCourseAcknowledgementStore((state) => state.clearState);
  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  // Hard re-entrancy guard: `isPending` only flips after a re-render, so a same-tick double
  // click on "Continue" could otherwise fire the mutation (and its insert) twice before the
  // button disables. This ref is checked-and-set synchronously, closing that window.
  const submitInFlight = useRef(false);
  const { failure, reportFailure, dismissFailure } = useSubmitFailure();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const oldFormState = { ...(formState as EnrolOldStudentFormState), stpApplicationType };
      return await submitExistingEnrollment(oldFormState, params.id!, academicYear, {
        preCourseAnswer: oldFormState.preCourseAnswer as string,
        preCourseDate: oldFormState.preCourseDate,
        preCourseAcknowledgedAt: new Date(),
      });
    },
    onSettled() {
      submitInFlight.current = false;
    },
    onSuccess(enroleeNumber) {
      navigate("/application-submitted", {
        state: {
          academicYear,
          enroleeNumber,
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
      // Clears the re-enrollment draft (now localStorage-backed, see zustand-store.ts) so a
      // submitted application can't resurface stale edits if this enrolee link is opened again.
      clearState();
      clearPreCourse();
      // Best-effort: the local draft is already cleared above regardless of whether this
      // reaches the server; a leftover DB row would otherwise let a stale draft resurrect
      // itself into a freshly-submitted (or later re-enrolled) application.
      if (params.id) deleteReenrolDraftRemote(params.id).catch(() => {});
    },
    // A failed submit is terminal and easy to walk away from, so it is surfaced as a
    // blocking dialog rather than a toast, and the cause is diagnosed rather than reported
    // as "an unknown error" - see src/lib/submit-failure.ts.
    onError(error) {
      void reportFailure(error);
    },
  });

  async function verifyEnrollmentDetails() {
    try {
      const isAddressContactInvalid =
        applicationTypes.includes(stpApplicationType) && !formState.studentInfo?.addressContact?.isValid;

      if (isAddressContactInvalid) {
        toast.warning("Review Address & Contact Information!", {
          description: "Please double-check all family details before submitting",
          action: {
            label: "View Info",
            onClick: () =>
              navigate(`/enrol-student/${params.id}/student-info?academicYear=${academicYear}`, {
                state: {
                  activeTab: "address-contact",
                },
              }),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      const { contactPersonNumber, homePhone, postalCode } = formState.studentInfo!.addressContact;

      if (isNaN(Number(contactPersonNumber))) {
        toast.warning("Invalid Contact Person Number!", {
          description: "Please enter a valid mobile or telephone number for the contact person.",
          action: {
            label: "Edit Info",
            onClick: () => navigate(`/enrol-student/${params.id}/student-info?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (isNaN(Number(homePhone))) {
        toast.warning("Invalid Home Phone Number!", {
          description: "Please enter a valid home phone number.",
          action: {
            label: "Edit Info",
            onClick: () => navigate(`/enrol-student/${params.id}/student-info?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (isNaN(Number(postalCode))) {
        toast.warning("Invalid Postal Code!", {
          description: "Please enter a valid postal code.",
          action: {
            label: "Edit Info",
            onClick: () => navigate(`/enrol-student/${params.id}/student-info?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (formState.familyInfo == null) {
        toast.info("Review Family Information!", {
          description: "Please double-check all family details before submitting",
          action: {
            label: "View Info",
            onClick: () => navigate(`/enrol-student/${params.id}/family-info?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#1F45C7",
          },
        });
        return;
      }

      if (formState.enrollmentInfo == null) {
        toast.warning("Fill up the enrollment information tab!", {
          description: "Kindly double check and save your details before submitting",
          action: {
            label: "Edit Info",
            onClick: () =>
              navigate(`/enrol-student/${params.id}/enrollment-info?academicYear=${academicYear}`, {
                state: {
                  triggerForm: true,
                },
              }),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (!formState.enrollmentInfo.isValid) {
        toast.warning("Please save your enrollment information!", {
          description: "Kindly double check and save your details before submitting.",
          action: {
            label: "Save Info",
            onClick: () =>
              navigate(`/enrol-student/${params.id}/enrollment-info?academicYear=${academicYear}`, {
                state: {
                  triggerForm: true,
                },
              }),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (formState.uploadRequirements?.studentUploadRequirements == null) {
        toast.warning("Please upload the required student documents", {
          description: "Kindly double check and save your details before submitting.",
          action: {
            label: "Edit Info",
            onClick: () => navigate(`/enrol-student/${params.id}/documents?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (formState.uploadRequirements.studentUploadRequirements.isValid !== true) {
        toast.warning("Please review and save your student documents!", {
          description: "Kindly double check and save your details before submitting.",
          action: {
            label: "View Info",
            onClick: () => navigate(`/enrol-student/${params.id}/documents?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (formState.uploadRequirements?.parentGuardianUploadRequirements == null) {
        toast.warning("Please upload the required parent/guardian documents", {
          description: "Kindly double check and save your details before submitting.",
          action: {
            label: "Edit Info",
            onClick: () => navigate(`/enrol-student/${params.id}/documents?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      if (formState.uploadRequirements.parentGuardianUploadRequirements.isValid !== true) {
        toast.warning("Please review and save your parent/guardian documents!", {
          description: "Kindly double check and save your details before submitting.",
          action: {
            label: "View Info",
            onClick: () => navigate(`/enrol-student/${params.id}/documents?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#DC7609",
          },
        });
        return;
      }

      const { noFatherInfo } = formState.familyInfo?.fatherInfo || {};

      const { noGuardianInfo } = formState.familyInfo?.guardianInfo || {};

      const { motherMobile } = formState.familyInfo.motherInfo;

      if (isNaN(Number(motherMobile))) {
        toast.warning("Invalid Mother Mobile!", {
          description: "Please enter a valid mobile number.",
          action: {
            label: "Edit Info",
            onClick: () => navigate(`/enrol-student/${params.id}/family-info?academicYear=${academicYear}`),
          },
          actionButtonStyle: {
            backgroundColor: "#1F45C7",
          },
        });
        return;
      }

      if (typeof noGuardianInfo === "boolean" && !noGuardianInfo) {
        const { guardianMobile } = formState.familyInfo.guardianInfo;

        if (isNaN(Number(guardianMobile))) {
          toast.warning("Invalid Guardian Mobile!", {
            description: "Please enter a valid mobile number.",
            action: {
              label: "Edit Info",
              onClick: () => navigate(`/enrol-student/${params.id}/family-info?academicYear=${academicYear}`),
            },
            actionButtonStyle: {
              backgroundColor: "#1F45C7",
            },
          });
          return;
        }
      }

      if (typeof noFatherInfo === "boolean" && !noFatherInfo) {
        const { fatherMobile } = formState.familyInfo.fatherInfo;

        if (isNaN(Number(fatherMobile))) {
          toast.warning("Invalid Father Mobile!", {
            description: "Please enter a valid mobile number.",
            action: {
              label: "Edit Info",
              onClick: () => navigate(`/enrol-student/${params.id}/family-info?academicYear=${academicYear}`),
            },
            actionButtonStyle: {
              backgroundColor: "#1F45C7",
            },
          });
          return;
        }
      }

      //       if (formState.createdAt) {
      //   delete formState.createdAt;
      // }

      // if (formState.draftId) {
      //   delete formState.draftId;
      // }

      if (submitInFlight.current) return;
      submitInFlight.current = true;
      mutate();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message, {
        description: "Please upload a valid, updated document",
      });
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={isPending} className="gap-2 bg-green-600 hover:bg-green-500 font-bold">
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
              onClick={() => verifyEnrollmentDetails()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SubmitFailureDialog failure={failure} onDismiss={dismissFailure} />
    </>
  );
}

export default SubmitApplicationDialog;
