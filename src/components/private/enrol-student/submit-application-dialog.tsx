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
import useSession from "@/hooks/use-session";
import { EnrolOldStudentFormState } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CheckCircle2, Send } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

function SubmitApplicationDialog() {
  const params = useParams();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { formState, clearState } = useEnrolOldStudentContext();
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await submitExistingEnrollment(formState as EnrolOldStudentFormState, params.id!);
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
      clearState();
      sessionStorage.clear();
    },
    onError() {
      toast.error("Uh oh! Something went wrong", {
        description: "An unknown error occurred. Please try again.",
      });
    },
  });

  async function verifyEnrollmentDetails() {
    try {
      const { contactPersonNumber, homePhone, postalCode } = formState.studentInfo!.addressContact;

      if (isNaN(Number(contactPersonNumber))) {
        toast.warning("Invalid Contact Person Number!", {
          description: "Please enter a valid mobile or telephone number for the contact person.",
        });
        return;
      }

      if (isNaN(Number(homePhone))) {
        toast.warning("Invalid Home Phone Number!", {
          description: "Please enter a valid home phone number.",
        });
        return;
      }

      if (isNaN(Number(postalCode))) {
        toast.warning("Invalid Postal Code!", {
          description: "Please enter a valid postal code.",
        });
        return;
      }

      if (formState.familyInfo == null) {
        toast.info("Review Family Information!", {
          description: "Please double-check all family details before submitting",
        });
        return;
      }

      if (formState.enrollmentInfo == null) {
        toast.warning("Fill up the enrollment information tab!", {
          description: "Kindly double check and save your details before submitting",
        });
        return;
      }

      if (!formState.enrollmentInfo.isValid) {
        toast.warning("Please save your enrollment information!", {
          description: "Kindly double check and save your details before submitting.",
        });
        return;
      }

      if (formState.uploadRequirements?.studentUploadRequirements == null) {
        toast.warning("Please upload the required student documents", {
          description: "Kindly double check and save your details before submitting.",
        });
        return;
      }

      if (formState.uploadRequirements.studentUploadRequirements.isValid !== true) {
        toast.warning("Please review and save your student documents!", {
          description: "Kindly double check and save your details before submitting.",
        });
        return;
      }

      if (formState.uploadRequirements?.parentGuardianUploadRequirements == null) {
        toast.warning("Please upload the required parent/guardian documents", {
          description: "Kindly double check and save your details before submitting.",
        });
        return;
      }

      if (formState.uploadRequirements.parentGuardianUploadRequirements.isValid !== true) {
        toast.warning("Please review and save your parent/guardian documents!", {
          description: "Kindly double check and save your details before submitting.",
        });
        return;
      }

      const { noFatherInfo } = formState.familyInfo?.fatherInfo || {};

      const { noGuardianInfo } = formState.familyInfo?.guardianInfo || {};

      const { motherMobile } = formState.familyInfo.motherInfo;

      if (isNaN(Number(motherMobile))) {
        toast.warning("Invalid Mother Mobile!", {
          description: "Please enter a valid mobile number.",
        });
        return;
      }

      if (typeof noGuardianInfo === "boolean" && !noGuardianInfo) {
        const { guardianMobile } = formState.familyInfo.guardianInfo;

        if (isNaN(Number(guardianMobile))) {
          toast.warning("Invalid Guardian Mobile!", {
            description: "Please enter a valid mobile number.",
          });
          return;
        }
      }

      if (typeof noFatherInfo === "boolean" && !noFatherInfo) {
        const { fatherMobile } = formState.familyInfo.fatherInfo;

        if (isNaN(Number(fatherMobile))) {
          toast.warning("Invalid Father Mobile!", {
            description: "Please enter a valid mobile number.",
          });
          return;
        }
      }

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
        <Button disabled={isPending} className="gap-2 bg-green-600 hover:bg-green-500">
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
          <AlertDialogAction className="!bg-green-600 hover:!bg-green-500" onClick={() => verifyEnrollmentDetails()}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SubmitApplicationDialog;
