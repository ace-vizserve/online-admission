import { studentReuploadDocuments } from "@/actions/private";
import fileSvg from "@/assets/file.svg";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PassportInput } from "@/components/ui/passport-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import StatusBadge, { StatusProps } from "@/components/ui/status-badge";
import { studentPassTypes } from "@/data";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { StudentDocument, StudentDocumentUpdatePayload, StudentReuploadProps } from "@/types";
import { Label } from "@radix-ui/react-dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDate } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CalendarIcon, Download, EllipsisVertical, Eye, EyeClosed, RotateCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

const form12Url = import.meta.env.VITE_FORM_12_URL as string;
const medicalExamurl = import.meta.env.VITE_MEDICAL_EXAM_FORM_URL as string;

function StudentFiles({ label, documents }: { label: string; documents: StudentDocument }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const academicYear = searchParams.get("academicYear");
  const passportDocument = documents.documentsThatExpire[0];
  const passDocument = documents.documentsThatExpire[1];

  const idPicture = documents.permanentDocuments[0];
  const form12Document = documents.permanentDocuments[1];
  const medicalCertDocument = documents.permanentDocuments[2];
  const birthCertDocument = documents.permanentDocuments[3];
  const eduCertDocument = documents.permanentDocuments[4];

  return (
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      <h2 className="font-bold text-lg">Documents That Expire</h2>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {Object.values(passDocument).every((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Pass</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge
                className="absolute -top-2"
                status={passDocument.passStatus ? (passDocument.passStatus as StatusProps) : "Missing"}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                    <EllipsisVertical />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Student Pass</h4>
                      <p className="text-xs text-muted-foreground">See the details of the Student's Pass.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Pass Type</Label>
                        <Input
                          id="passType"
                          defaultValue={passDocument.passType ? passDocument.passType?.replace("_", " ") : "N/A"}
                          className="col-span-2 h-8 capitalize"
                          tabIndex={-1}
                          readOnly
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Expires at</Label>
                        {passDocument.passExpiry ? (
                          <Input
                            id="passExpirationDate"
                            defaultValue={formatDate(new Date(passDocument.passExpiry), "dd/MM/yyyy")}
                            className="col-span-2 h-8"
                            tabIndex={-1}
                            readOnly
                          />
                        ) : (
                          <Input
                            id="passExpirationDate"
                            defaultValue={"N/A"}
                            className="col-span-2 h-8"
                            tabIndex={-1}
                            readOnly
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Pass</p>

            <div className="flex flex-col gap-2 w-full">
              {passDocument.pass ? (
                <Link
                  to={passDocument.pass}
                  target="_blank"
                  className={buttonVariants({
                    className: "gap-2 text-xs  w-full",
                    variant: "secondary",
                  })}>
                  View document <Eye />
                </Link>
              ) : (
                <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                  View document <EyeClosed />
                </Button>
              )}

              <StudentFileUploaderDialog
                status={passDocument?.passStatus ?? "Missing"}
                academicYear={academicYear!}
                documentType="pass"
                enroleeNumber={params.id!}
                label="Student's Pass"
                payload={{
                  pass: passDocument.pass!,
                  passExpiry: passDocument.passExpiry! as Date,
                  passType: passDocument.passType!,
                }}
              />
            </div>
          </div>
        )}

        {Object.values(passportDocument).every((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Passport</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge
                className="absolute -top-2"
                status={passportDocument.passportStatus ? (passportDocument.passportStatus as StatusProps) : "Missing"}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                    <EllipsisVertical />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="grid gap-4">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Student Passport</h4>
                      <p className="text-xs text-muted-foreground">See the details of the Student's Passport.</p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Passport #</Label>
                        <div className="flex items-center col-span-2 ">
                          <PassportInput defaultValue={passportDocument.passportNumber ?? "N/A"} readOnly />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label className="text-xs">Expires at</Label>
                        {passportDocument.passportExpiry ? (
                          <Input
                            id="passportExpiry"
                            defaultValue={formatDate(new Date(passportDocument.passportExpiry), "dd/MM/yyyy")}
                            className="col-span-2 h-8"
                            tabIndex={-1}
                            readOnly
                          />
                        ) : (
                          <Input
                            id="passportExpiry"
                            defaultValue={"N/A"}
                            className="col-span-2 h-8"
                            tabIndex={-1}
                            readOnly
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Passport</p>

            <div className="flex flex-col gap-2 w-full">
              {passportDocument.passport ? (
                <Link
                  to={passportDocument.passport!}
                  target="_blank"
                  className={buttonVariants({
                    className: "gap-2 text-xs  w-full",
                    variant: "secondary",
                  })}>
                  View document <Eye />
                </Link>
              ) : (
                <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                  View document <EyeClosed />
                </Button>
              )}

              <StudentFileUploaderDialog
                status={passportDocument?.passportStatus ?? "Missing"}
                academicYear={academicYear!}
                documentType="passport"
                enroleeNumber={params.id!}
                label="Student's Passport"
                payload={{
                  passport: passportDocument.passport!,
                  passportExpiry: passportDocument.passportExpiry! as Date,
                  passportNumber: passportDocument.passportNumber!,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      <h2 className="font-bold text-lg">Permanent Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4">
        {Object.values(idPicture).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">ID Picture</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={idPicture.idPictureStatus as StatusProps} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">ID Picture</p>

            <div className="flex flex-col gap-2 w-full">
              <Link
                to={idPicture.idPicture!}
                target="_blank"
                className={buttonVariants({
                  className: "gap-2 text-xs  w-full",
                  variant: "secondary",
                })}>
                View document <Eye />
              </Link>

              <StudentFileUploaderDialog
                status={idPicture.idPictureStatus!}
                academicYear={academicYear!}
                documentType="idPicture"
                enroleeNumber={params.id!}
                label="Student's ID Picture"
                payload={{
                  idPicture: idPicture.idPicture!,
                }}
              />
            </div>
          </div>
        )}

        {Object.values(form12Document).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Form 12</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={form12Document.form12Status as StatusProps} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Form 12</p>

            <div className="flex flex-col gap-2 w-full">
              <Link
                to={form12Document.form12!}
                target="_blank"
                className={buttonVariants({
                  className: "gap-2 text-xs  w-full",
                  variant: "secondary",
                })}>
                View document <Eye />
              </Link>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        )}

        {Object.values(medicalCertDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Medical Exam</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={medicalCertDocument.medicalStatus as StatusProps} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Medical Exam</p>

            <div className="flex flex-col gap-2 w-full">
              <Link
                to={medicalCertDocument.medical!}
                target="_blank"
                className={buttonVariants({
                  className: "gap-2 text-xs  w-full",
                  variant: "secondary",
                })}>
                View document <Eye />
              </Link>

              <StudentFileUploaderDialog
                status={medicalCertDocument.medicalStatus!}
                academicYear={academicYear!}
                documentType="medical"
                enroleeNumber={params.id!}
                label="Student's Medical"
                payload={{
                  medical: medicalCertDocument.medical!,
                }}
              />
            </div>
          </div>
        )}

        {Object.values(birthCertDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Birth Certificate</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={birthCertDocument.birthCertStatus as StatusProps} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Birth Certificate</p>

            <div className="flex flex-col gap-2 w-full">
              <Link
                to={birthCertDocument.birthCert!}
                target="_blank"
                className={buttonVariants({
                  className: "gap-2 text-xs  w-full",
                  variant: "secondary",
                })}>
                View document <Eye />
              </Link>

              <StudentFileUploaderDialog
                status={birthCertDocument.birthCertStatus!}
                academicYear={academicYear!}
                documentType="birthCert"
                enroleeNumber={params.id!}
                label="Student's Birth Certificate"
                payload={{
                  birthCert: birthCertDocument.birthCert!,
                }}
              />
            </div>
          </div>
        )}

        {Object.values(eduCertDocument).some((v) => v == null) ? (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={"Missing"} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Transcript of Records</p>

            <div className="flex flex-col gap-2 w-full">
              <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
                View document <EyeClosed />
              </Button>
              <Button disabled className="gap-2 text-xs w-full">
                Reupload <RotateCcw />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
            <div className="w-full flex relative">
              <StatusBadge className="absolute -top-2" status={eduCertDocument.educCertStatus as StatusProps} />

              <div className="pt-6 w-max mx-auto">
                <img src={fileSvg} className="size-10" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium text-sm">Transcript of Records</p>

            <div className="flex flex-col gap-2 w-full">
              <Link
                to={eduCertDocument.educCert!}
                target="_blank"
                className={buttonVariants({
                  className: "gap-2 text-xs  w-full",
                  variant: "secondary",
                })}>
                View document <Eye />
              </Link>

              <StudentFileUploaderDialog
                status={eduCertDocument?.educCertStatus ?? "Missing"}
                academicYear={academicYear!}
                documentType="educCert"
                enroleeNumber={params.id!}
                label="Student's Transcript of Records"
                payload={{
                  educCert: eduCertDocument.educCert!,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StudentFileUploaderDialog({
  status,
  academicYear,
  documentType,
  enroleeNumber,
  label,
}: StudentReuploadProps & { label: string; status: string }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: StudentDocumentUpdatePayload) => {
      return await studentReuploadDocuments({ academicYear, documentType, enroleeNumber, payload });
    },
    onSuccess() {
      setIsOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["student-documents", enroleeNumber],
      });
    },
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [idPicture, setIdPicture] = useState("");

  const [pass, setPass] = useState("");
  const [passType, setPassType] = useState("");
  const [passExpiry, setPassExpiry] = useState<Date | undefined>();

  const [passport, setPassport] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState<Date | undefined>();

  const [birthCert, setBirthCert] = useState("");

  const [form12, setForm12] = useState("");

  const [medical, setMedical] = useState("");

  const [educCert, setEducCert] = useState("");

  const props = useSupabaseUpload({
    bucketName: "parent-portal",
    path: `${academicYear}/documents`,
    allowedMimeTypes: documentType !== "idPicture" ? ["application/pdf"] : ["image/png", "image/jpeg"],
    maxFiles: documentType !== "idPicture" ? 4 : 1,
    maxFileSize: 1000 * 1000 * 4,
    mergeFiles: documentType !== "idPicture" ? true : false,
  });

  useEffect(() => {
    if (!props.isSuccess) return;

    if (documentType == "idPicture") {
      setIdPicture(props.successes[0]);
    }

    if (documentType == "pass") {
      setPass(props.successes[0]);
    }

    if (documentType == "passport") {
      setPassport(props.successes[0]);
    }

    if (documentType == "birthCert") {
      setBirthCert(props.successes[0]);
    }

    if (documentType == "form12") {
      setForm12(props.successes[0]);
    }

    if (documentType == "medical") {
      setMedical(props.successes[0]);
    }

    if (documentType == "educCert") {
      setEducCert(props.successes[0]);
    }
  }, [documentType, props.isSuccess, props.successes]);

  function submitReupload(e: FormEvent) {
    e.preventDefault();

    let filePayload: Record<string, unknown> | null = null;

    switch (documentType) {
      case "pass":
        if (!pass) {
          toast.error("Please upload the pass document.");
          return;
        }
        if (passType === "") {
          toast.error("Please select a pass type.");
          return;
        }
        if (!passExpiry) {
          toast.error("Please provide a pass expiry date.");
          return;
        }
        filePayload = {
          pass,
          passType,
          passExpiry: passExpiry.toISOString(),
        };
        break;

      case "passport":
        if (!passport) {
          toast.error("Please upload the passport document.");
          return;
        }
        if (passportNumber.trim() === "") {
          toast.error("Please enter a passport number.");
          return;
        }
        if (!passportExpiry) {
          toast.error("Please provide a passport expiry date.");
          return;
        }
        filePayload = {
          passport,
          passportNumber,
          passportExpiry: passportExpiry.toISOString(),
        };
        break;

      case "birthCert":
        if (!birthCert) {
          toast.error("Please upload the birth certificate.");
          return;
        }
        filePayload = {
          birthCert,
        };
        break;

      case "form12":
        if (!form12) {
          toast.error("Please upload Form 12.");
          return;
        }
        filePayload = {
          form12,
        };
        break;

      case "medical":
        if (!medical) {
          toast.error("Please upload the medical exam.");
          return;
        }
        filePayload = {
          medical,
        };
        break;

      case "educCert":
        if (!educCert) {
          toast.error("Please upload the educational certificate.");
          return;
        }
        filePayload = {
          educCert,
        };
        break;

      case "idPicture":
        if (!idPicture) {
          toast.error("Please upload the Student ID Picture.");
          return;
        }
        filePayload = {
          idPicture,
        };
        break;
    }

    mutate({ ...filePayload });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={status == "Valid" || status == "Uploaded" || isPending} className="gap-2 text-xs w-full">
          Reupload <RotateCcw />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-3xl">
        <form onSubmit={submitReupload} className="grid grid-cols-1 items-center space-y-4">
          <DialogHeader className="text-start">
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Upload a clear and recent document in{" "}
              <strong>{documentType == "idPicture" ? "PNG, JPG, or JPEG" : "PDF"}</strong> format.
            </DialogDescription>
          </DialogHeader>

          {documentType !== "idPicture" && (
            <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
              Upload up to 4 PDF documents. Provide all necessary information, then click Upload Files and Save Changes.
            </Badge>
          )}

          {documentType === "form12" && (
            <Link
              to={form12Url}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 w-max mx-auto text-xs",
                variant: "outline",
              })}>
              Download Form 12 Form <Download />
            </Link>
          )}

          {documentType === "medical" && (
            <Link
              to={medicalExamurl}
              target="_blank"
              className={buttonVariants({
                className: "gap-2 w-max mx-auto text-xs",
                variant: "outline",
              })}>
              Download Medical Exam Form <Download />
            </Link>
          )}

          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {documentType === "pass" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <Select onValueChange={setPassType} defaultValue={passType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pass type" />
                </SelectTrigger>
                <SelectContent>
                  {studentPassTypes.map((passType) => (
                    <SelectItem key={passType.value} value={passType.value}>
                      {passType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !passExpiry && "text-muted-foreground")}>
                    {passExpiry ? format(passExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={passExpiry}
                    onSelect={setPassExpiry}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {documentType === "passport" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <PassportInput
                required
                placeholder="Enter passport number"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
              />

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !passportExpiry && "text-muted-foreground")}>
                    {passportExpiry ? format(passportExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={passportExpiry}
                    onSelect={setPassportExpiry}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full gap-2" type="submit">
              {isPending ? (
                <>
                  Saving <DotPulse size="30" speed="1.3" color="white" />
                </>
              ) : (
                <>
                  Save changes
                  <Save />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StudentFiles;
