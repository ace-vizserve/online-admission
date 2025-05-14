import { getCurrentStudentDocuments } from "@/actions/private";
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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import StudentFileUploaderDialog from "./student-file-uploader-dialog";

function StudentUpload() {
  const params = useParams();
  const { formState, setFormState } = useEnrolOldStudentContext();
  const { data, isFetching, isSuccess } = useQuery({
    queryKey: ["student-documents", params.id],
    queryFn: async () => {
      return await getCurrentStudentDocuments(params.id!, ["Form 12", "Medical Exam", "ID Picture"]);
    },
  });

  const [idPicture, setIdPicture] = useState<File[] | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<File[] | null>(null);
  const [transcriptOfRecords, setTranscriptOfRecords] = useState<File[] | null>(null);
  const [form12, setForm12] = useState<File[] | null>(null);
  const [medicalExam, setMedicalExam] = useState<File[] | null>(null);
  const [passport, setPassport] = useState<File[] | null>(null);
  const [pass, setPass] = useState<File[] | null>(null);

  const form = useForm<StudentUploadRequirementsSchema>({
    resolver: zodResolver(studentUploadRequirementsSchema),
    defaultValues: {
      ...formState.uploadRequirements?.studentUploadRequirements,
    },
  });

  useEffect(() => {
    if (!isSuccess || !data) return;

    setFormState({
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements?.parentGuardianUploadRequirements,
        } as ParentGuardianUploadRequirementsSchema,
        studentUploadRequirements: {
          ...(data?.studentUploadRequirements ?? {}),
        } as unknown as StudentUploadRequirementsSchema,
      },
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, setFormState, data]);

  useEffect(() => {
    if (!formState.uploadRequirements?.studentUploadRequirements) return;

    form.reset(formState.uploadRequirements.studentUploadRequirements);
  }, [form, formState.uploadRequirements?.studentUploadRequirements]);

  function onSubmit(values: StudentUploadRequirementsSchema) {
    toast.success("Student documents saved!", {
      description: "You're now ready to upload the Parent/Guardian documents.",
    });

    setFormState({
      ...formState,
      uploadRequirements: {
        studentUploadRequirements: values,
        parentGuardianUploadRequirements: {
          ...formState.uploadRequirements!.parentGuardianUploadRequirements,
        },
      },
    });
  }

  if (isFetching) {
    return <Loader />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full mx-auto">
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
            name="birthCertificate"
            value={birthCertificate}
            onValueChange={setBirthCertificate}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Transcript of Records"
            description="Upload the student's copy of TOR"
            form={form}
            name="transcriptOfRecords"
            value={transcriptOfRecords}
            onValueChange={setTranscriptOfRecords}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Form 12"
            description="Upload Form 12 copy"
            form={form}
            name="form12"
            value={form12}
            onValueChange={setForm12}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Medical Examination"
            description="Upload recent medical result of student"
            form={form}
            name="medicalExam"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
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
