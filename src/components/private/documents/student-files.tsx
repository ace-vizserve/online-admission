import { studentReuploadDocuments } from "@/actions/private";
import { sendEmailNotification } from "@/actions/send-email-notification";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import AdvancedCalendarSelection from "@/components/ui/advanced-calendar-selection";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PassportInput } from "@/components/ui/passport-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/ui/status-badge";
import { studentPassTypes } from "@/data";
import useSession from "@/hooks/use-session";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { StudentDocument, StudentDocumentUpdatePayload, StudentReuploadProps } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CalendarIcon, Download, Eye, EyeClosed, FileText, RotateCcw, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

const medicalExamurl = import.meta.env.VITE_MEDICAL_EXAM_FORM_URL as string;

function StudentFiles({ label, documents }: { label: string; documents: StudentDocument }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { session } = useSession();
  const academicYear = searchParams.get("academicYear");

  // Grouping documents for cleaner rendering
  const expiringDocs = [
    { title: "Student Pass", type: "pass", data: documents.documentsThatExpire[1] },
    { title: "Passport", type: "passport", data: documents.documentsThatExpire[0] },
  ];

  const permanentDocs = [
    { title: "ID Picture", type: "idPicture", data: documents.permanentDocuments[0] },
    { title: "Medical Exam", type: "medical", data: documents.permanentDocuments[1] },
    { title: "Birth Certificate", type: "birthCert", data: documents.permanentDocuments[2] },
    { title: "Transcript of Records", type: "educCert", data: documents.permanentDocuments[3] },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Simple Header */}
      <div className="space-y-1">
        <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
        <p className="text-sm font-medium text-slate-500">
          This section includes details about the student's documents for this current school year.
        </p>
      </div>

      {/* Section: Expiring */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Documents that expire</h2>
        <div className="grid gap-3">
          {expiringDocs.map((doc) => (
            <DocumentRow
              key={doc.type}
              title={doc.title}
              doc={doc.data}
              type={doc.type}
              id={params.id!}
              session={session}
              year={academicYear!}
            />
          ))}
        </div>
      </div>

      {/* Section: Permanent */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Permanent documents</h2>
        <div className="grid gap-3">
          {permanentDocs.map((doc) => (
            <DocumentRow
              key={doc.type}
              title={doc.title}
              doc={doc.data}
              type={doc.type}
              id={params.id!}
              session={session}
              year={academicYear!}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ title, doc, type, id, session, year }: any) {
  const isMissing = !doc || Object.values(doc).every((v) => v == null) || doc?.[`${type}Status`] === "To follow";
  const status = doc?.[`${type}Status`] || "Missing";

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl gap-4 transition-all hover:border-slate-300">
      {/* Header Area: Icon & Text */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Icon Plate */}
        <div
          className={cn(
            "size-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
            isMissing ? "bg-slate-100 text-slate-400" : "bg-primary text-primary-foreground shadow-sm"
          )}>
          {isMissing ? <EyeClosed size={20} /> : <FileText size={20} />}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{title}</h3>
            <StatusBadge status={status} className="text-[10px] font-bold uppercase" />
          </div>

          {!isMissing && doc?.[`${type}Expiry`] ? (
            <p className="text-[11px] text-slate-500 font-bold tracking-tight">
              Expires: {format(new Date(doc[`${type}Expiry`]), "dd MMM yyyy")}
            </p>
          ) : (
            <p
              className={cn(
                "text-[11px] font-bold uppercase tracking-tighter",
                isMissing ? "text-amber-600" : "text-slate-500"
              )}>
              {isMissing ? "Action Required" : "Record saved"}
            </p>
          )}
        </div>
      </div>

      {/* Action Area: Full-width on mobile, auto-width on desktop */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t border-slate-50 pt-3 sm:pt-0 sm:border-0 sm:ml-auto">
        {!isMissing && doc?.[type] && (
          <Link
            to={doc[type]}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className:
                "flex-1 sm:flex-none h-9 gap-2 text-[11px] !font-bold border-slate-200 hover:bg-slate-50 rounded-2xl",
            })}>
            <Eye size={14} />
            <span>View</span>
          </Link>
        )}

        {/* Uploader Dialog Trigger */}
        <div className="flex-1 sm:flex-none">
          <StudentFileUploaderDialog
            parentEmail={session?.user.email}
            role={session?.user.user_metadata.relationship}
            status={status}
            academicYear={year}
            documentType={type}
            enroleeNumber={id}
            label={title}
            payload={doc}
          />
        </div>
      </div>
    </div>
  );
}

function StudentFileUploaderDialog({
  parentEmail,
  role,
  status,
  academicYear,
  documentType,
  enroleeNumber,
  label,
}: StudentReuploadProps & { label: string; status: string; parentEmail: string; role: string }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: StudentDocumentUpdatePayload) => {
      return await studentReuploadDocuments({ academicYear, documentType, enroleeNumber, payload });
    },
    onSuccess: async () => {
      setIsOpen(false);
      queryClient.invalidateQueries();

      await sendEmailNotification({
        parentEmail,
        role,
        updatedSections: [label],
        section: "Student Documents",
        academicYear,
        enroleeNumber,
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
        <Button
          disabled={status == "Valid" || status == "Uploaded" || isPending}
          className="w-full gap-2 text-xs font-bold">
          Reupload <RotateCcw />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-3xl">
        <form onSubmit={submitReupload} className="grid grid-cols-1 items-center space-y-4">
          <DialogHeader className="text-start">
            <DialogTitle className="font-black text-2xl">{label}</DialogTitle>
            <DialogDescription className="font-semibold">
              Upload a clear and recent document in{" "}
              <strong>{documentType == "idPicture" ? "PNG, JPG, or JPEG" : "PDF"}</strong> format.
            </DialogDescription>
          </DialogHeader>

          {documentType !== "idPicture" && (
            <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
              Upload up to 4 PDF documents. Provide all necessary information, then click Upload Files and Save Changes.
            </Badge>
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
                  <AdvancedCalendarSelection date={passExpiry} setDate={setPassExpiry} disablePastDates />
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
                  <AdvancedCalendarSelection date={passportExpiry} setDate={setPassportExpiry} disablePastDates />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full py-6 rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 text-base font-bold"
              type="submit">
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
