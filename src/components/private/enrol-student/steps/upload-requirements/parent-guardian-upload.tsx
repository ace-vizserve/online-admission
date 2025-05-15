import { Button } from "@/components/ui/button";

import { getCurrentParentGuardianDocuments, submitEnrollment } from "@/actions/private";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { EnrolNewStudentFormState } from "@/types";
import {
  parentGuardianUploadRequirementsSchema,
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DotPulse, Tailspin } from "ldrs/react";
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
  const { formState, setFormState } = useEnrolNewStudentContext();
  const { data, isFetching, isSuccess } = useQuery({
    queryKey: ["parent-guardian-documents"],
    queryFn: async () => {
      return await getCurrentParentGuardianDocuments();
    },
    enabled:
      Object.keys(formState.uploadRequirements?.studentUploadRequirements ?? {}).length < 1 ||
      Object.keys(formState.uploadRequirements?.parentGuardianUploadRequirements ?? {}).length < 1,
  });
  const { mutate, isPending } = useMutation({
    mutationFn: submitEnrollment,
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
    if (!isSuccess || !data) return;

    setFormState({
      uploadRequirements: {
        studentUploadRequirements: {} as StudentUploadRequirementsSchema,
        parentGuardianUploadRequirements: {
          ...data?.parentGuardianUploadRequirements,
          hasFatherInfo: Object.keys(formState.familyInfo?.fatherInfo ?? {}).length > 0,
          hasGuardianInfo: Object.keys(formState.familyInfo?.guardianInfo ?? {}).length > 0,
        } as ParentGuardianUploadRequirementsSchema,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, setFormState, data]);

  useEffect(() => {
    if (!formState.uploadRequirements?.parentGuardianUploadRequirements) return;

    Object.entries(formState.uploadRequirements.parentGuardianUploadRequirements).forEach(([key, value]) => {
      form.setValue(key as keyof ParentGuardianUploadRequirementsSchema, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    });
  }, [form, formState.uploadRequirements?.parentGuardianUploadRequirements]);

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) {
      mutate(formState as EnrolNewStudentFormState);
    }
  }, [form.formState.isSubmitSuccessful, formState, mutate]);

  function onSubmit(values: ParentGuardianUploadRequirementsSchema) {
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

  if (isFetching) {
    return <Loader />;
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

function Loader() {
  return (
    <div className="h-72 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <p className="text-sm text-muted-foreground animate-pulse">Fetching documents...</p>
      <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
    </div>
  );
}

export default ParentGuardianUpload;
