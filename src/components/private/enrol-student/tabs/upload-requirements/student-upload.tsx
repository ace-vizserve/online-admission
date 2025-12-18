import { getPreviousStudentDocuments } from "@/actions/private";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useEnrolOldStudentContext } from "@/context/enrol-old-student-context";
import {
  ParentGuardianUploadRequirementsSchema,
  studentUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import StudentFileUploaderDialog from "./student-file-uploader-dialog";

const MAX_SKIPS = 3;

function StudentUpload() {
  const params = useParams();
  const { formState, setFormState } = useEnrolOldStudentContext();

  const { data, isPending, isSuccess } = useQuery({
    queryKey: ["student-documents", params.id],
    queryFn: async () => {
      return await getPreviousStudentDocuments(params.id!);
    },
  });

  const [idPicture, setIdPicture] = useState<File[] | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<File[] | null>(null);
  const [transcriptOfRecords, setTranscriptOfRecords] = useState<File[] | null>(null);
  const [medicalExam, setMedicalExam] = useState<File[] | null>(null);
  const [passport, setPassport] = useState<File[] | null>(null);
  const [pass, setPass] = useState<File[] | null>(null);
  const hydratedRef = useRef<boolean>(false);

  const form = useForm<StudentUploadRequirementsSchema>({
    resolver: zodResolver(studentUploadRequirementsSchema),
    defaultValues: {
      ...formState.uploadRequirements?.studentUploadRequirements,
    },
    mode: "onChange",
  });

  // compute directly from watch instead of useMemo + unstable deps
  const toFollowDocs = form.watch("toFollowDocs");
  const skippedDocsCount = toFollowDocs?.length ?? 0;
  const remainingSkips = MAX_SKIPS - skippedDocsCount;

  // hydrate context from server if context is empty/invalid
  useEffect(() => {
    if (!isSuccess || !data) return;

    const studentReq = formState.uploadRequirements?.studentUploadRequirements;
    const isValid = formState.uploadRequirements?.studentUploadRequirements.isValid;

    if (studentReq != null && Object.keys(studentReq).length > 0) return;

    if (isValid) return;

    console.log("Triggered");

    setFormState({
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements?.parentGuardianUploadRequirements,
        } as ParentGuardianUploadRequirementsSchema,
        studentUploadRequirements: {
          ...data.studentUploadRequirements,
        } as StudentUploadRequirementsSchema,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data]);

  // hydrate RHF from context only once
  useEffect(() => {
    const studentReq = formState.uploadRequirements?.studentUploadRequirements;
    if (!studentReq || hydratedRef.current) return;

    console.log("Triggered");

    Object.entries(studentReq).forEach(([key, value]) => {
      form.setValue(key as keyof StudentUploadRequirementsSchema, value, {
        shouldValidate: true,
      });
    });

    hydratedRef.current = true;
  }, [form, formState.uploadRequirements?.studentUploadRequirements]);

  function onSubmit(values: StudentUploadRequirementsSchema) {
    setFormState({
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...(formState.uploadRequirements!.parentGuardianUploadRequirements ?? {}),
        },
        studentUploadRequirements: { ...values, isValid: true },
      },
    });

    toast.success("Student documents saved!", {
      description: "Make sure to double check everything",
    });
  }

  if (isPending) {
    return <Loader />;
  }

  if (Object.keys(formState.uploadRequirements?.studentUploadRequirements ?? {}).length < 1) {
    return <Loader />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (Object.keys(errors).includes("toFollowDocs")) {
            toast.warning("Too many skipped files!", {
              description: "You can only skip up to 3 documents.",
            });
          }

          const includesIDPictureError = Object.keys(errors).filter((key) => key.includes("idPicture"));
          const includesBirthCertError = Object.keys(errors).filter((key) => key.includes("birthCert"));
          const includesEducCertError = Object.keys(errors).filter((key) => key.includes("educCert"));
          const includesMedicalError = Object.keys(errors).filter((key) => key.includes("medical"));
          const includesPassportError = Object.keys(errors).filter(
            (key) => key.includes("passportExpiry") || key.includes("passportNumber")
          );
          const includesPassError = Object.keys(errors).filter(
            (key) => key.includes("passType") || key.includes("passExpiry")
          );

          if (includesBirthCertError.length > 0) {
            form.setError("birthCert", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid Birth Certificate document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesEducCertError.length > 0) {
            form.setError("educCert", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid Transcript of Records document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesMedicalError.length > 0) {
            form.setError("medical", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid Medical Exam document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesIDPictureError.length > 0) {
            form.setError("idPicture", {
              type: "manual",
              message: "Please upload a file to continue",
            });
            toast.warning("Invalid ID picture!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesPassportError.length > 0) {
            form.setError("passport", {});
            toast.warning("Invalid student passport document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          if (includesPassError.length > 0) {
            form.setError("pass", {});
            toast.warning("Invalid student pass document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          setFormState({
            uploadRequirements: {
              parentGuardianUploadRequirements: {
                ...(formState.uploadRequirements!.parentGuardianUploadRequirements ?? {}),
              },
              studentUploadRequirements: {
                ...formState.uploadRequirements?.studentUploadRequirements,
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
                  {skippedDocsCount} document
                  {skippedDocsCount > 1 ? "s" : ""} marked to follow. No more can be skipped.
                </span>
              ) : (
                <span>
                  {skippedDocsCount} document
                  {skippedDocsCount > 1 ? "s" : ""} marked to follow • {remainingSkips} skip
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Student ID Picture"
            description="Upload a recent photo of the student"
            form={form}
            name="idPicture"
            value={idPicture}
            onValueChange={setIdPicture}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Student Birth Certificate"
            description="Upload a recent copy of birth certificate"
            form={form}
            name="birthCert"
            value={birthCertificate}
            onValueChange={setBirthCertificate}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Transcript of Records"
            description="Upload the student's copy of TOR"
            form={form}
            name="educCert"
            value={transcriptOfRecords}
            onValueChange={setTranscriptOfRecords}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Medical Examination"
            description="Upload recent medical result of student"
            form={form}
            name="medical"
            value={medicalExam}
            onValueChange={setMedicalExam}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Passport Copy"
            description="Upload scanned passport copy"
            form={form}
            name="passport"
            value={passport}
            onValueChange={setPassport}
          />

          <StudentFileUploaderDialog
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

function Loader() {
  return (
    <div className="h-72 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <p className="text-sm text-muted-foreground animate-pulse">Fetching documents...</p>
      <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
    </div>
  );
}

export default StudentUpload;
