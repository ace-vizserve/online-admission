import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useOpenHouseContext } from "@/context/open-house/open-house-student-context";
import { applicationTypes } from "@/data";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  ParentGuardianUploadRequirementsSchema,
  studentUploadRequirementsSchema,
  StudentUploadRequirementsSchema,
} from "@/zod-schema";
import { usePassTypeStore } from "@/zustand-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInYears } from "date-fns";
import { AlertCircle, Clock, Info, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useBeforeUnload } from "react-router";
import { toast } from "sonner";
import StudentFileUploaderDialog from "./student-file-uploader-dialog";

const MAX_SKIPS = 3;

function StudentUpload() {
  const { formState, setFormState, setCompletedTabs } = useOpenHouseContext();

  const [idPicture, setIdPicture] = useState<File[] | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<File[] | null>(null);
  const [transcriptOfRecords, setTranscriptOfRecords] = useState<File[] | null>(null);
  const [medicalExam, setMedicalExam] = useState<File[] | null>(null);
  const [passport, setPassport] = useState<File[] | null>(null);
  const [pass, setPass] = useState<File[] | null>(null);
  const [financialSupportDocs, setFinancialSupportDocs] = useState<File[] | null>(null);
  const [icaPhoto, setIcaPhoto] = useState<File[] | null>(null);
  const [vaccinationInformation, setVaccinationInformation] = useState<File[] | null>(null);

  const stpApplicationType = usePassTypeStore((state) => state.stpApplicationType);
  const passType = usePassTypeStore((state) => state.passType);
  const birthDate = formState.studentInfo?.studentDetails.birthDay;
  const studentAge = birthDate ? differenceInYears(new Date(), new Date(birthDate)) : undefined;
  const showVaccinationInformation =
    studentAge !== undefined && studentAge <= 12 && applicationTypes.includes(stpApplicationType);

  const isStpApplication = stpApplicationType === "New Student Pass Application";

  const form = useForm<StudentUploadRequirementsSchema>({
    resolver: zodResolver(studentUploadRequirementsSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      ...formState.uploadRequirements?.studentUploadRequirements,
      isOpenHouseApplication: true,
    },
  });

  const toFollowDocs = form.watch("toFollowDocs");
  const skippedDocsCount = toFollowDocs?.length ?? 0;

  const watchedValues = form.watch();
  const debouncedValues = useDebounce(watchedValues, 150);

  useEffect(() => {
    setFormState({
      ...formState,
      uploadRequirements: {
        ...formState.uploadRequirements!,
        studentUploadRequirements: {
          ...debouncedValues,
        },
      },
    });

    form.reset(
      { ...debouncedValues },
      {
        keepErrors: true,
      },
    );
  }, [debouncedValues]);

  useEffect(() => {
    form.trigger();
  }, []);

  useBeforeUnload((e) => {
    e.preventDefault();
  });

  function onSubmit(values: StudentUploadRequirementsSchema) {
    const isPassTypeInCorrect = !isStpApplication && values.passType !== passType;

    if (isPassTypeInCorrect) {
      form.setError("pass", {
        type: "manual",
        message: "",
      });
      form.setError("passType", {
        type: "manual",
        message: "Selected pass type does not match the student’s current pass.",
      });
      toast.error("Pass type mismatch!", {
        description: "The selected pass type does not match what the student currently holds.",
      });
      return;
    }

    const isPassExpiryNull = values.passExpiry?.getFullYear() === 1970 && values.passExpiry?.getTime() === 0;

    const isPassportExpiryNull =
      values.passportExpiry?.getFullYear() === 1970 && values.passportExpiry?.getTime() === 0;

    if (isPassExpiryNull) {
      values.passExpiry = undefined;
    }

    if (isPassportExpiryNull) {
      values.passportExpiry = undefined;
    }

    setFormState({
      ...formState,
      uploadRequirements: {
        parentGuardianUploadRequirements: {
          ...(formState.uploadRequirements
            ?.parentGuardianUploadRequirements as unknown as ParentGuardianUploadRequirementsSchema),
        },
        studentUploadRequirements: {
          ...values,
          isValid: true,
        },
      },
    });

    if (formState.uploadRequirements?.parentGuardianUploadRequirements.isValid) {
      setCompletedTabs("/open-house/upload-requirements");
    }

    toast.success("Student documents saved!", {
      description: "You're now ready to upload the Parent/Guardian documents",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          if (Object.keys(errors).includes("toFollowDocs")) {
            toast.error("Too many skipped documents!", {
              description: "You can only skip up to 3 student documents.",
            });
          }

          const includesIcaPhotoError = Object.keys(errors).filter((key) => key.includes("icaPhoto"));
          const inCludesFinancialSupportDocsError = Object.keys(errors).filter((key) =>
            key.includes("financialSupportDocs"),
          );
          const includesVaccinationInformationError = Object.keys(errors).filter((key) =>
            key.includes("vaccinationInformation"),
          );
          const includesIDPictureError = Object.keys(errors).filter((key) => key.includes("idPicture"));
          const includesBirthCertError = Object.keys(errors).filter((key) => key.includes("birthCert"));
          const includesEducCertError = Object.keys(errors).filter((key) => key.includes("educCert"));
          const includesMedicalError = Object.keys(errors).filter((key) => key.includes("medical"));
          const includesPassportError = Object.keys(errors).filter(
            (key) => key === "passport" || key === "passportExpiry" || key === "passportNumber",
          );
          const includesPassError = Object.keys(errors).filter(
            (key) => key === "pass" || key === "passType" || key === "passExpiry",
          );

          if (includesIcaPhotoError.length > 0) {
            form.setError("icaPhoto", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid ICA Photo document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (inCludesFinancialSupportDocsError.length > 0) {
            form.setError("financialSupportDocs", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid Financial Support documents!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesVaccinationInformationError.length > 0) {
            form.setError("vaccinationInformation", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid Vaccination Information document!", {
              description: "Please upload a valid file to continue.",
            });
          }
          if (includesBirthCertError.length > 0) {
            form.setError("birthCert", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid Birth Certificate document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesEducCertError.length > 0) {
            form.setError("educCert", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid Transcript of Records document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesMedicalError.length > 0) {
            form.setError("medical", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid Medical Exam document!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesIDPictureError.length > 0) {
            form.setError("idPicture", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid ID picture!", {
              description: "Please upload a valid file to continue.",
            });
          }

          if (includesPassportError.length > 0) {
            form.setError("passport", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid student passport document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          if (includesPassError.length > 0) {
            form.setError("pass", {
              type: "manual",
              message: "Please upload a valid file to continue",
            });
            toast.warning("Invalid student pass document!", {
              description: "The file contains invalid information. Please check and correct it.",
            });
          }

          form.setValue("isValid", false);

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
        <Alert className="bg-blue-500/10 border-none w-full md:w-max md:max-w-[400px] mx-auto">
          <Info className="h-4 w-4 !text-blue-500" />
          <div className="space-y-1 text-pretty">
            <AlertTitle className="text-xs text-blue-700 font-bold">Important Information</AlertTitle>
            <span className="text-xs text-blue-900">
              After you upload or edit any document, please click <span className="font-bold">Save documents</span> so
              your updates are kept.
            </span>
          </div>
        </Alert>
        <DocumentSkipBadge MAX_SKIPS={MAX_SKIPS} skippedDocsCount={skippedDocsCount} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="ID Picture"
            form={form}
            name="idPicture"
            value={idPicture}
            onValueChange={setIdPicture}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Birth Certificate"
            form={form}
            name="birthCert"
            value={birthCertificate}
            onValueChange={setBirthCertificate}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Transcript of Records"
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
            form={form}
            name="medical"
            value={medicalExam}
            onValueChange={setMedicalExam}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Passport Copy"
            form={form}
            name="passport"
            value={passport}
            onValueChange={setPassport}
          />

          <StudentFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Singapore Pass"
            form={form}
            name="pass"
            value={pass}
            onValueChange={setPass}
          />
        </div>

        {applicationTypes.includes(stpApplicationType) && (
          <>
            <br />
            <br />
            <Separator />
            <br />
            <br />
            <h3 className="text-2xl font-black tracking-tight text-primary text-center">
              Documents for {stpApplicationType}{" "}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
              <StudentFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Photo for ICA Student's Pass"
                form={form}
                name="icaPhoto"
                value={icaPhoto}
                onValueChange={setIcaPhoto}
              />

              <StudentFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Financial Support Documents"
                form={form}
                name="financialSupportDocs"
                value={financialSupportDocs}
                onValueChange={setFinancialSupportDocs}
              />

              {showVaccinationInformation && (
                <StudentFileUploaderDialog
                  formState={formState}
                  setFormState={setFormState}
                  label="Vaccination Information"
                  form={form}
                  name="vaccinationInformation"
                  value={vaccinationInformation}
                  onValueChange={setVaccinationInformation}
                />
              )}
            </div>
          </>
        )}

        <br />
        <br />
        <Separator />

        <div className="flex flex-col gap-4 mb-4 max-w-4xl mx-auto">
          <Button
            size="lg"
            className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full"
            type="submit">
            Save documents
            <Save />
          </Button>

          <Button
            className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
            type="submit">
            Save documents
            <Save />
          </Button>
        </div>
      </form>
    </Form>
  );
}

function DocumentSkipBadge({ skippedDocsCount, MAX_SKIPS }: { skippedDocsCount: number; MAX_SKIPS: number }) {
  const remainingSkips = MAX_SKIPS - skippedDocsCount;

  return (
    <div className="w-max mx-auto animate-in fade-in slide-in-from-top-2 duration-500">
      {skippedDocsCount > 0 ? (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm",
            remainingSkips < 1
              ? "bg-rose-50 text-rose-600 border-rose-100"
              : "bg-amber-50 text-amber-700 border-amber-100",
          )}>
          {remainingSkips < 1 ? (
            <>
              <AlertCircle size={14} className="shrink-0" />
              <span>{skippedDocsCount} documents skipped • No more skips allowed</span>
            </>
          ) : (
            <>
              <Clock size={14} className="shrink-0 animate-pulse" />
              <span>
                {skippedDocsCount} documents to follow • {remainingSkips} skips remaining
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-500 border border-slate-200 text-[9px] md:text-[11px] font-black uppercase tracking-wider">
          <Info size={14} className="text-blue-500" />
          <span>You can choose to upload up to {MAX_SKIPS} documents later</span>
        </div>
      )}
    </div>
  );
}

export default StudentUpload;
