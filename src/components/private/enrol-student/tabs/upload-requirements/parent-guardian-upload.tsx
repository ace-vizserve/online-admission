import { Button } from "@/components/ui/button";

import { Form } from "@/components/ui/form";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { wait } from "@/lib/utils";
import { parentGuardianUploadRequirementsSchema, ParentGuardianUploadRequirementsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import "ldrs/react/DotPulse.css";
import { Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router";
import { toast } from "sonner";
import ParentGuardianFileUploaderDialog from "./parent-guardian-file-uploader-dialog";

type SubmitState = "idle" | "pending" | "success";

function ParentGuardianUpload() {
  const { formState, setFormState } = useEnrolOldStudentContext();
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
        description: "Please fill out all required fields to proceed.",
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
    setFormState({});
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
          size="lg"
          className="mt-8 mb-0 hidden lg:flex w-full max-w-3xl mx-auto p-8 gap-2 uppercase"
          type="submit">
          Save
          <Save />
        </Button>

        <Button className="mt-8 mb-0 flex lg:hidden w-full p-6 gap-2 uppercase" type="submit">
          Save
          <Save />
        </Button>
      </form>
    </Form>
  );
}

export default ParentGuardianUpload;
