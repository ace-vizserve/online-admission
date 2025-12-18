import { Button } from "@/components/ui/button";

import { getPreviousParentGuardianDocuments } from "@/actions/private";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import { documentErrors } from "@/lib/utils";
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
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import ParentGuardianFileUploaderDialog from "./parent-guardian-file-uploader-dialog";

const MAX_SKIPS = 2;

function ParentGuardianUpload() {
  const params = useParams();
  const { formState, setFormState } = useEnrolOldStudentContext();
  const { data, isPending, isSuccess, fetchStatus } = useQuery({
    queryKey: ["parent-guardian-documents", params.id],
    queryFn: async () => {
      return await getPreviousParentGuardianDocuments(params.id!);
    },
  });

  const [fatherPassport, setFatherPassport] = useState<File[] | null>(null);
  const [motherPassport, setMotherPassport] = useState<File[] | null>(null);
  const [guardianPassport, setGuardianPassport] = useState<File[] | null>(null);
  const [fatherPass, setFatherPass] = useState<File[] | null>(null);
  const [motherPass, setMotherPass] = useState<File[] | null>(null);
  const [guardianPass, setGuardianPass] = useState<File[] | null>(null);
  const hydratedRef = useRef<boolean>(false);

  const form = useForm<ParentGuardianUploadRequirementsSchema>({
    resolver: zodResolver(parentGuardianUploadRequirementsSchema),
    defaultValues: {
      ...formState.uploadRequirements?.parentGuardianUploadRequirements,
    },
  });

  const toFollowDocs = form.watch("toFollowDocs");
  const skippedDocsCount = toFollowDocs?.length ?? 0;
  const remainingSkips = MAX_SKIPS - skippedDocsCount;

  useEffect(() => {
    if (!isSuccess || !data) return;

    const parentGuardianReq = formState.uploadRequirements?.parentGuardianUploadRequirements;
    const isValid = formState.uploadRequirements?.parentGuardianUploadRequirements.isValid;

    if (parentGuardianReq != null && Object.keys(parentGuardianReq).length > 0) return;

    if (isValid) return;

    console.log("Triggered");

    setFormState({
      uploadRequirements: {
        studentUploadRequirements: {
          ...(formState.uploadRequirements?.studentUploadRequirements as StudentUploadRequirementsSchema),
        },
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements?.parentGuardianUploadRequirements,
          ...(data!.parentGuardianUploadRequirements as ParentGuardianUploadRequirementsSchema),
          hasFatherInfo:
            formState.uploadRequirements?.parentGuardianUploadRequirements.hasFatherInfo ??
            data.parentGuardianUploadRequirements.hasFatherInfo,
          hasGuardianInfo:
            formState.uploadRequirements?.parentGuardianUploadRequirements.hasGuardianInfo ??
            data.parentGuardianUploadRequirements.hasGuardianInfo,
        },
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, setFormState, data]);

  useEffect(() => {
    const parentGuardianReq = formState.uploadRequirements?.parentGuardianUploadRequirements;
    if (!parentGuardianReq || hydratedRef.current) return;

    console.log("Triggered");

    Object.entries(parentGuardianReq).forEach(([key, value]) => {
      form.setValue(key as keyof ParentGuardianUploadRequirementsSchema, value, {
        shouldValidate: true,
      });
    });
    hydratedRef.current = true;
  }, [form, formState.uploadRequirements?.parentGuardianUploadRequirements]);

  function onSubmit(values: ParentGuardianUploadRequirementsSchema) {
    setFormState({
      ...formState,
      uploadRequirements: {
        studentUploadRequirements: {
          ...formState.uploadRequirements!.studentUploadRequirements,
        },
        parentGuardianUploadRequirements: { ...values, isValid: true },
      },
    });

    toast.success("Parent/Guardian documents saved!", {
      description: "Make sure to double check everything",
    });
  }

  if (fetchStatus === "fetching" && isPending) {
    return <Loader />;
  }

  if (formState.uploadRequirements?.parentGuardianUploadRequirements == null) {
    return <Loader />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (Object.keys(errors).includes("toFollowDocs")) {
            toast.error("Too many skipped files!", {
              description: "You can only skip up to 2 documents.",
            });
          }

          const { includesPassError: includesMotherPassError, includesPassportError: includesMotherPassportError } =
            documentErrors("mother", errors);

          if (includesMotherPassportError) {
            form.setError("motherPassport", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid mother passport document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          if (includesMotherPassError) {
            form.setError("motherPass", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid mother pass document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          const { includesPassError: includesFatherPassError, includesPassportError: includesFatherPassportError } =
            documentErrors("father", errors);

          if (includesFatherPassportError) {
            form.setError("fatherPassport", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid father passport document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }
          if (includesFatherPassError) {
            form.setError("fatherPass", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid father pass document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          const { includesPassError: includesGuardianPassError, includesPassportError: includesGuardianPassportError } =
            documentErrors("guardian", errors);

          if (includesGuardianPassportError) {
            form.setError("guardianPassport", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid guardian passport document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }
          if (includesGuardianPassError) {
            form.setError("guardianPass", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid guardian pass document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          setFormState({
            uploadRequirements: {
              studentUploadRequirements: {
                ...(formState.uploadRequirements!.studentUploadRequirements ?? {}),
              },
              parentGuardianUploadRequirements: {
                ...formState.uploadRequirements?.parentGuardianUploadRequirements,
                isValid: false,
              },
            },
          });
        })}
        className="space-y-6 lg:space-y-8 w-full mx-auto">
        <div className="w-max mx-auto">
          {skippedDocsCount > 0 ? (
            <div
              className={`text-xs px-3 py-2 rounded-md ${
                remainingSkips < 1
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
              {remainingSkips < 1 ? (
                <span>
                  {skippedDocsCount} document{skippedDocsCount > 1 ? "s" : ""} marked to follow. No more can be skipped.
                </span>
              ) : (
                <span>
                  {skippedDocsCount} document{skippedDocsCount > 1 ? "s" : ""} marked to follow • {remainingSkips} skip
                  {remainingSkips > 1 ? "s" : ""} remaining
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs px-3 py-2 rounded-md bg-green-50 text-green-600 border border-slate-200">
              Up to {MAX_SKIPS} documents can be marked to submit later
            </div>
          )}
        </div>
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
        {formState.uploadRequirements.parentGuardianUploadRequirements?.hasFatherInfo && (
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
        {formState.uploadRequirements.parentGuardianUploadRequirements?.hasGuardianInfo && (
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
