import { Button } from "@/components/ui/button";

import { lookupNewEnrolledStudent, submitEnrollment } from "@/actions/private";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { EnrolNewStudentFormState } from "@/types";
import { parentGuardianUploadRequirementsSchema, ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { useSelectAcademicYear } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import "ldrs/react/Tailspin.css";
import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ParentGuardianFileUploaderDialog from "./parent-guardian-file-uploader-dialog";

function ParentGuardianUpload() {
  const navigate = useNavigate();
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const { formState, setFormState } = useEnrolNewStudentContext();
  const { mutate, isPending } = useMutation({
    mutationFn: async (enrollmentDetails: EnrolNewStudentFormState) => {
      return await submitEnrollment(enrollmentDetails, academicYear);
    },
    onSuccess() {
      navigate("/application-submitted", {
        replace: true,
      });
    },
  });

  const [fatherPassport, setFatherPassport] = useState<File[] | null>(null);
  const [motherPassport, setMotherPassport] = useState<File[] | null>(null);
  const [guardianPassport, setGuardianPassport] = useState<File[] | null>(null);
  const [fatherPass, setFatherPass] = useState<File[] | null>(null);
  const [motherPass, setMotherPass] = useState<File[] | null>(null);
  const [guardianPass, setGuardianPass] = useState<File[] | null>(null);

  const form = useForm<ParentGuardianUploadRequirementsSchema>({
    resolver: zodResolver(parentGuardianUploadRequirementsSchema),
    defaultValues: {
      ...formState.uploadRequirements?.parentGuardianUploadRequirements,
    },
  });

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      mutate(formState as EnrolNewStudentFormState);
    }
  }, [form.formState.isSubmitSuccessful, formState, mutate]);

  async function onSubmit(values: ParentGuardianUploadRequirementsSchema) {
    if (
      !Object.keys(formState.uploadRequirements?.studentUploadRequirements ?? {}).length &&
      !formState.uploadRequirements!.studentUploadRequirements.isValid
    ) {
      toast.warning("Student Documents is missing!", {
        description: "Please fill out all required fields to move proceed.",
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      form.setError("root", {});
      return;
    }

    const enroleeFullName = `${formState.studentInfo?.studentDetails.lastName}, ${
      formState.studentInfo?.studentDetails.firstName
    }, ${formState.studentInfo?.studentDetails.middleName ?? ""}`;
    const birthDay = formState.studentInfo!.studentDetails.birthDay;
    const motherEmail = formState.familyInfo!.motherInfo.motherEmail;
    const fatherEmail = formState.familyInfo?.fatherInfo.fatherEmail;
    const result = await lookupNewEnrolledStudent({
      enroleeFullName,
      birthDay,
      motherEmail,
      fatherEmail,
      academicYear,
    });

    if (result) {
      toast.error("Enrollment Already Exists!", {
        description: "A matching student and parent record is already enrolled",
      });
      return;
    }

    setFormState({
      ...formState,
      uploadRequirements: {
        studentUploadRequirements: {
          ...formState.uploadRequirements!.studentUploadRequirements,
        },
        parentGuardianUploadRequirements: { ...values },
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:space-y-8 w-full mx-auto">
        <h1 className="max-w-4xl mx-auto font-semibold uppercase">Mother Documents</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
          <ParentGuardianFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Passport Copy"
            description="Upload scanned passport copy"
            form={form}
            name="motherPassport"
            value={motherPassport}
            onValueChange={setMotherPassport}
          />

          <ParentGuardianFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Singapore Pass"
            description="Upload the type of Pass the mother holds."
            form={form}
            name="motherPass"
            value={motherPass}
            onValueChange={setMotherPass}
          />
        </div>

        {formState.uploadRequirements?.parentGuardianUploadRequirements.hasFatherInfo && (
          <>
            <Separator />
            <h1 className="max-w-4xl mx-auto font-semibold uppercase">Father Documents</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Passport Copy"
                description="Upload scanned passport copy"
                form={form}
                name="fatherPassport"
                value={fatherPassport}
                onValueChange={setFatherPassport}
              />

              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Singapore Pass"
                description="Upload the type of Pass the father holds."
                form={form}
                name="fatherPass"
                value={fatherPass}
                onValueChange={setFatherPass}
              />
            </div>
          </>
        )}

        {formState.uploadRequirements?.parentGuardianUploadRequirements.hasGuardianInfo && (
          <>
            <Separator />
            <h1 className="max-w-4xl mx-auto font-semibold uppercase">Guardian Documents</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Passport Copy"
                description="Upload scanned passport copy"
                form={form}
                name="guardianPassport"
                value={guardianPassport}
                onValueChange={setGuardianPassport}
              />

              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Singapore Pass"
                description="Upload the type of Pass the guardian holds."
                form={form}
                name="guardianPass"
                value={guardianPass}
                onValueChange={setGuardianPass}
              />
            </div>
          </>
        )}

        <Button
          disabled={isPending}
          size="lg"
          className="bg-green-500 hover:bg-green-600 hidden lg:flex w-full max-w-3xl mx-auto p-8 gap-2 uppercase mt-8"
          type="submit">
          {isPending ? (
            <>
              Submitting
              <DotPulse size="30" speed="1.3" color="white" />
            </>
          ) : (
            <>
              Submit Application
              <Send className="w-6 h-6" />
            </>
          )}
        </Button>

        <Button
          disabled={isPending}
          className="bg-green-500 hover:bg-green-600 flex lg:hidden w-full p-6 gap-2 uppercase mt-8"
          type="submit">
          {isPending ? (
            <>
              Submitting
              <DotPulse size="30" speed="1.3" color="white" />
            </>
          ) : (
            <>
              Submit Application
              <Send className="w-6 h-6" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default ParentGuardianUpload;
