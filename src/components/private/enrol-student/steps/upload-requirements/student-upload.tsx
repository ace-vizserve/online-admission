import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useEnrolNewStudentContext } from "@/context/enrol-new-student-context";
import { studentUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import StudentFileUploaderDialog from "./student-file-uploader-dialog";

function StudentUpload() {
  const { formState, setFormState } = useEnrolNewStudentContext();
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

  function onSubmit(values: StudentUploadRequirementsSchema) {
    toast.success("Student documents saved!", {
      description: "You're now ready to upload the Parent/Guardian documents.",
    });

    setFormState({
      ...formState,
      uploadRequirements: {
        studentUploadRequirements: values,
        parentGuardianUploadRequirements: {
          pass: "",
          passExpiryDate: new Date(),
          passport: "",
          passportExpiryDate: new Date(),
          passportNumber: "",
          passType: "",
        },
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <StudentFileUploaderDialog
            label="Student ID Picture"
            description="Upload a recent photo of the student"
            form={form}
            name="idPicture"
            value={idPicture}
            onValueChange={setIdPicture}
          />

          <StudentFileUploaderDialog
            label="Student Birth Certificate"
            description="Upload a recent copy of birth certificate"
            form={form}
            name="birthCertificate"
            value={birthCertificate}
            onValueChange={setBirthCertificate}
          />

          <StudentFileUploaderDialog
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
            label="Form 12"
            description="Upload Form 12 copy"
            form={form}
            name="form12"
            value={form12}
            onValueChange={setForm12}
          />

          <StudentFileUploaderDialog
            label="Medical Examination"
            description="Upload recent medical result of student"
            form={form}
            name="medicalExam"
            value={medicalExam}
            onValueChange={setMedicalExam}
          />

          <StudentFileUploaderDialog
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

export default StudentUpload;
