import { Button } from "@/components/ui/button";

import { getCurrentParentGuardianDocuments } from "@/actions/private";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import {
  parentGuardianUploadRequirementsSchema,
  ParentGuardianUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import "ldrs/react/Tailspin.css";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import ParentGuardianFileUploaderDialog from "./parent-guardian-file-uploader-dialog";

function ParentGuardianUpload() {
  const params = useParams();
  const { formState, setFormState } = useEnrolOldStudentContext();
  const { data, isFetching, isSuccess } = useQuery({
    queryKey: ["parent-guardian-documents", params.id],
    queryFn: async () => {
      return await getCurrentParentGuardianDocuments(params.id!);
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
        studentUploadRequirements: {
          ...(formState.uploadRequirements?.studentUploadRequirements as StudentUploadRequirementsSchema),
        },
        parentGuardianUploadRequirements: {
          ...(data!.parentGuardianUploadRequirements as ParentGuardianUploadRequirementsSchema),
        },
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

  function onSubmit(values: ParentGuardianUploadRequirementsSchema) {
    setFormState({
      ...formState,
      uploadRequirements: {
        studentUploadRequirements: {
          ...formState.uploadRequirements!.studentUploadRequirements,
        },
        parentGuardianUploadRequirements: { ...values },
      },
    });

    toast.success("Parent/Guardian documents saved!", {
      description: "Make sure to double check everything",
    });
  }

  if (isFetching) {
    return <Loader />;
  }

  if (Object.keys(formState.uploadRequirements?.parentGuardianUploadRequirements ?? {}).length < 1) {
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
            description="Upload the type of Pass the student holds."
            form={form}
            name="motherPass"
            value={motherPass}
            onValueChange={setMotherPass}
          />
        </div>
        {(Object.keys(formState.familyInfo?.fatherInfo ?? {}).length > 0 ||
          Object.keys(formState.uploadRequirements?.parentGuardianUploadRequirements ?? {}).filter((key) =>
            key.includes("father")
          ).length > 0) && (
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
        {(Object.keys(formState.familyInfo?.guardianInfo ?? {}).length > 0 ||
          Object.keys(formState.uploadRequirements?.parentGuardianUploadRequirements ?? {}).filter((key) =>
            key.includes("guardian")
          ).length > 0) && (
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

function Loader() {
  return (
    <div className="h-72 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <p className="text-sm text-muted-foreground animate-pulse">Fetching documents...</p>
      <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
    </div>
  );
}

export default ParentGuardianUpload;
