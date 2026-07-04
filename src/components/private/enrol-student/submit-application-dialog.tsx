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
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const oldFormState = { ...(formState as EnrolOldStudentFormState), stpApplicationType };
      return await submitExistingEnrollment(oldFormState, params.id!, academicYear, {
        preCourseAnswer: oldFormState.preCourseAnswer as string,
        preCourseDate: oldFormState.preCourseDate,
        preCourseAcknowledgedAt: new Date(),
      });
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
      clearState();
      clearPreCourse();
      sessionStorage.clear();
    },
    onError(error) {
      console.log(error);
      toast.error("Uh oh! Something went wrong", {
        description: "An unknown error occurred. Please try again.",
      });
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

      mutate();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message, {
        description: "Please upload a valid, updated document",
      });
    }
  }

  return (
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
            className="!bg-green-600 hover:!bg-green-500 font-bold"
            onClick={() => verifyEnrollmentDetails()}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SubmitApplicationDialog;
