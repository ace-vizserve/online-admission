import { Button } from "@/components/ui/button";

import { getPreviousParentGuardianDocuments } from "@/actions/private";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useEnrolCurrentLearnerContext } from "@/context/vizschool/enrol-current-learner-context";
import { cn, documentErrors } from "@/lib/utils";
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
import { AlertCircle, Clock, Info, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import ParentGuardianFileUploaderDialog from "./parent-guardian-file-uploader-dialog";

const MAX_SKIPS = 2;

function ParentGuardianUpload() {
  const params = useParams();
  const { formState, setFormState } = useEnrolCurrentLearnerContext();
  const { data, isPending, isSuccess, fetchStatus } = useQuery({
    queryKey: ["current-parent-guardian-documents", params.id],
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
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const toFollowDocs = form.watch("toFollowDocs");
  const skippedDocsCount = toFollowDocs?.length ?? 0;

  useEffect(() => {
    if (!isSuccess || !data) return;

    const parentGuardianReq = formState.uploadRequirements?.parentGuardianUploadRequirements;
    const isValid = formState.uploadRequirements?.parentGuardianUploadRequirements.isValid;

    if (parentGuardianReq != null && Object.keys(parentGuardianReq).length > 0) return;

    if (isValid) return;

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
            data.parentGuardianUploadRequirements?.hasFatherInfo,
          hasGuardianInfo:
            formState.uploadRequirements?.parentGuardianUploadRequirements.hasGuardianInfo ??
            data.parentGuardianUploadRequirements?.hasGuardianInfo,
        },
      },
    });
  }, [isSuccess, data, formState.uploadRequirements]);

  useEffect(() => {
    const parentGuardianReq = formState.uploadRequirements?.parentGuardianUploadRequirements;
    if (hydratedRef.current) return;
    if (!parentGuardianReq || Object.keys(parentGuardianReq).length < 1) return;

    form.reset(parentGuardianReq, {
      keepErrors: false,
    });

    form.trigger();

    hydratedRef.current = true;
  }, [form, formState.uploadRequirements?.parentGuardianUploadRequirements]);

  function onSubmit(values: ParentGuardianUploadRequirementsSchema) {
    const isMotherPassExpiryNull =
      values.motherPassExpiry?.getFullYear() === 1970 && values.motherPassExpiry?.getTime() === 0;
    const isMotherPassportExpiryNull =
      values.motherPassportExpiry?.getFullYear() === 1970 && values.motherPassportExpiry?.getTime() === 0;

    const isFatherPassExpiryNull =
      values.fatherPassExpiry?.getFullYear() === 1970 && values.fatherPassExpiry?.getTime() === 0;
    const isFatherPassportExpiryNull =
      values.fatherPassportExpiry?.getFullYear() === 1970 && values.fatherPassportExpiry?.getTime() === 0;

    const isGuardianPassExpiryNull =
      values.guardianPassExpiry?.getFullYear() === 1970 && values.guardianPassExpiry?.getTime() === 0;
    const isGuardianPassportExpiryNull =
      values.guardianPassportExpiry?.getFullYear() === 1970 && values.guardianPassportExpiry?.getTime() === 0;

    if (isMotherPassExpiryNull) {
      values.motherPassExpiry = undefined;
    }

    if (isMotherPassportExpiryNull) {
      values.motherPassportExpiry = undefined;
    }

    if (isFatherPassExpiryNull) {
      values.fatherPassExpiry = undefined;
    }

    if (isFatherPassportExpiryNull) {
      values.fatherPassportExpiry = undefined;
    }

    if (isGuardianPassExpiryNull) {
      values.guardianPassExpiry = undefined;
    }

    if (isGuardianPassportExpiryNull) {
      values.guardianPassportExpiry = undefined;
    }

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
            toast.error("Too many skipped documents!", {
              description: "You can only skip up to 2 parent/guardian documents.",
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

        <h1 className="max-w-4xl mx-auto font-bold uppercase">Mother Documents</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
          <ParentGuardianFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Passport Copy"
            form={form}
            name="motherPassport"
            value={motherPassport}
            onValueChange={setMotherPassport}
          />

          <ParentGuardianFileUploaderDialog
            formState={formState}
            setFormState={setFormState}
            label="Singapore Pass"
            form={form}
            name="motherPass"
            value={motherPass}
            onValueChange={setMotherPass}
          />
        </div>
        {formState.uploadRequirements.parentGuardianUploadRequirements?.hasFatherInfo && (
          <>
            <Separator />
            <h1 className="max-w-4xl mx-auto font-bold uppercase">Father Documents</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Passport Copy"
                form={form}
                name="fatherPassport"
                value={fatherPassport}
                onValueChange={setFatherPassport}
              />

              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Singapore Pass"
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
            <h1 className="max-w-4xl mx-auto font-bold uppercase">Guardian Documents</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-4 max-w-4xl mx-auto">
              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Passport Copy"
                form={form}
                name="guardianPassport"
                value={guardianPassport}
                onValueChange={setGuardianPassport}
              />

              <ParentGuardianFileUploaderDialog
                formState={formState}
                setFormState={setFormState}
                label="Singapore Pass"
                form={form}
                name="guardianPass"
                value={guardianPass}
                onValueChange={setGuardianPass}
              />
            </div>
          </>
        )}

        <Button
          variant={"secondary"}
          size="lg"
          className="hidden lg:flex p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full max-w-4xl mx-auto"
          type="submit">
          Save documents
          <Save />
        </Button>

        <Button
          variant={"secondary"}
          className="flex lg:hidden w-full p-6 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold"
          type="submit">
          Save documents
          <Save />
        </Button>
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

function Loader() {
  return (
    <div className="h-72 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
      <Tailspin size="30" stroke="5" speed="0.9" color="#4F46E5" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching documents...</p>
    </div>
  );
}

export default ParentGuardianUpload;
