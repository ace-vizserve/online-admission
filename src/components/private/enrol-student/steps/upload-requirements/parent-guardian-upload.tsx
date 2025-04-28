import { Button } from "@/components/ui/button";

import { Form } from "@/components/ui/form";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { wait } from "@/lib/utils";
import { parentGuardianUploadRequirementsSchema, ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router";
import { toast } from "sonner";
import ParentGuardianFileUploaderDialog from "./parent-guardian-file-uploader-dialog";

type SubmitState = "idle" | "pending" | "success";

function ParentGuardianUpload() {
  const { formState, setFormState } = useEnrolNewStudentContext();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [passport, setPassport] = useState<File[] | null>(null);
  const [pass, setPass] = useState<File[] | null>(null);

  const form = useForm<ParentGuardianUploadRequirementsSchema>({
    resolver: zodResolver(parentGuardianUploadRequirementsSchema),
    defaultValues: {
      ...formState.uploadRequirements?.parentGuardianUploadRequirements,
    },
  });

  async function onSubmit(values: ParentGuardianUploadRequirementsSchema) {
    if (formState.uploadRequirements?.studentUploadRequirements == null) {
      toast.warning("Student Documents is missing!", {
        description: "Please fill out all required fields to move proceed.",
      });
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }
    setFormState({
      ...formState,
      uploadRequirements: {
        parentGuardianUploadRequirements: values,
        studentUploadRequirements: {
          ...formState.uploadRequirements.studentUploadRequirements,
        },
      },
    });
    setSubmitState("pending");
    await wait(2000);
    setSubmitState("success");
    sessionStorage.removeItem("enrolNewStudentFormState");
  }

  if (submitState == "success") {
    return <Navigate to={"/application-submitted"} replace />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
          <ParentGuardianFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Passport Copy"
            description="Upload scanned passport copy"
            form={form}
            name="passport"
            value={passport}
            onValueChange={setPassport}
          />

          <ParentGuardianFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Singapore Pass"
            description="Upload the type of Pass the student holds."
            form={form}
            name="pass"
            value={pass}
            onValueChange={setPass}
          />
        </div>

        <Button
          disabled={submitState == "pending"}
          size="lg"
          className="bg-green-500 hover:bg-green-600 hidden lg:flex w-full max-w-3xl mx-auto p-8 gap-2 uppercase mt-8"
          type="submit">
          {submitState == "pending" ? "Submitting" : "Submit Application"}
          {submitState == "pending" ? <DotPulse size="30" speed="1.3" color="white" /> : <Send className="w-6 h-6" />}
        </Button>

        <Button
          disabled={submitState == "pending"}
          className="bg-green-500 hover:bg-green-600 flex lg:hidden w-full p-6 gap-2 uppercase mt-8"
          type="submit">
          {submitState == "pending" ? "Submitting" : "Submit Application"}
          {submitState == "pending" ? <DotPulse size="20" speed="1.3" color="white" /> : <Send className="w-6 h-6" />}
        </Button>
      </form>
    </Form>
  );
}

export default ParentGuardianUpload;
