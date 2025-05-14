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
import { EnrolOldStudentFormState } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { isBefore } from "date-fns";
import { CheckCircle2, Send } from "lucide-react";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

function checkExpiry(label: string, expiry: Date | null | undefined, type: "passport" | "pass") {
  if (expiry && isBefore(expiry, new Date())) {
    throw new Error(`${label}'s ${type} has expired.`);
  }
}

function SubmitApplicationDialog() {
  const navigate = useNavigate();
  const params = useParams();
  const { formState } = useEnrolOldStudentContext();
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      return await submitExistingEnrollment(formState as EnrolOldStudentFormState, params.id!);
    },
    onSuccess() {
      navigate("/application-submitted", {
        replace: true,
      });
    },
  });

  function verifyEnrollmentDetails() {
    try {
      if (formState.enrollmentInfo == null || !formState.enrollmentInfo?.isValid) {
        toast.warning("Fill up the enrollment information tab", {
          description: "Kindly double check every details before submitting",
        });
        return;
      }

      if (formState.uploadRequirements?.studentUploadRequirements == null) return;

      const { form12, medicalExam, passExpiryDate, passportExpiryDate } =
        formState.uploadRequirements.studentUploadRequirements;

      if (!form12) {
        throw new Error("Form 12 is required!");
      }

      if (!medicalExam) {
        throw new Error("Medical Exam result is required!");
      }

      if (!passExpiryDate || isBefore(passExpiryDate, new Date())) {
        throw new Error("Student's pass has expired!");
      }

      if (!passportExpiryDate || isBefore(passportExpiryDate, new Date())) {
        throw new Error("Student's passport has expired!");
      }

      if (formState.uploadRequirements?.parentGuardianUploadRequirements == null) return;

      const {
        motherPassExpiryDate,
        motherPassportExpiryDate,
        fatherPassExpiryDate,
        fatherPassportExpiryDate,
        guardianPassExpiryDate,
        guardianPassportExpiryDate,
      } = formState.uploadRequirements.parentGuardianUploadRequirements;

      checkExpiry("Mother", motherPassExpiryDate, "pass");
      checkExpiry("Mother", motherPassportExpiryDate, "passport");
      checkExpiry("Father", fatherPassExpiryDate, "pass");
      checkExpiry("Father", fatherPassportExpiryDate, "passport");
      checkExpiry("Guardian", guardianPassExpiryDate, "pass");
      checkExpiry("Guardian", guardianPassportExpiryDate, "passport");

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
        <Button className="gap-2 bg-green-600 hover:bg-green-500">
          Send Application <Send />
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
            onClick={() => verifyEnrollmentDetails()}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default SubmitApplicationDialog;
