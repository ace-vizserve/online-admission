import { parentGuardianReuploadDocuments } from "@/actions/private";
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
import StatusBadge, { type StatusProps } from "@/components/ui/status-badge";
import { parentGuardianPassTypes } from "@/data";
import useSession from "@/hooks/use-session";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { FamilyDocument, ParentGuardianDocumentUpdatePayload, ParentGuardianReuploadProps } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { DotPulse } from "ldrs/react";
import { CalendarIcon, Eye, EyeClosed, FileText, Heart, RotateCcw, Save, User, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

function RenderFamilyDocCard({
  label,
  fileUrl,
  status,
  expiry,
  typeLabel,
  role,
  payload,
  documentType,
}: {
  label: string;
  fileUrl?: string;
  status?: string;
  expiry?: string;
  typeLabel?: string;
  role: string;
  documentType: string;
  payload: Record<string, unknown>;
}) {
  const { session } = useSession();
  const isMissing = !fileUrl || status === "To follow";
  const params = useParams();
  const [searchParams] = useSearchParams();
  const academicYear = searchParams.get("academicYear");

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl gap-4 transition-all hover:border-slate-300">
      {/* Left Side: Icon & Info */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "size-11 shrink-0 rounded-xl flex items-center justify-center",
            isMissing ? "bg-slate-100 text-slate-400" : "bg-primary text-white shadow-sm"
          )}>
          {isMissing ? <EyeClosed size={20} /> : <FileText size={20} />}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{label}</h3>
            <StatusBadge status={status ? (status as StatusProps) : "Missing"} className="text-[10px] font-bold uppercase" />
          </div>

          <div className="flex flex-col gap-0.5">
            {expiry ? (
              <p className="text-[11px] text-slate-500 font-bold tracking-tight">
                Expires: {format(new Date(expiry), "dd MMM yyyy")}
              </p>
            ) : (
              <p
                className={cn(
                  "text-[11px] font-bold uppercase tracking-tighter",
                  isMissing ? "text-amber-600" : "text-slate-400"
                )}>
                {isMissing ? "Action Required" : "Record Verified"}
              </p>
            )}
            {typeLabel && (
              <span className="text-[10px] text-slate-400 font-medium truncate italic">Ref: {typeLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Actions & Info Popover */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t border-slate-50 pt-3 sm:pt-0 sm:border-0 sm:ml-auto">
        {fileUrl && (
          <Link
            to={fileUrl}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className:
                "flex-1 sm:flex-none h-9 gap-2 text-[11px] !font-bold border-slate-200 hover:bg-slate-50 text-slate-600",
            })}>
            <Eye size={14} /> <span>View</span>
          </Link>
        )}

        <div className="flex-1 sm:flex-none">
          <ParentGuardianFileUploaderDialog
            parentEmail={session?.user.email as string}
            role={role}
            status={status!}
            academicYear={academicYear!}
            documentType={documentType}
            enroleeNumber={params.id!}
            label={label!}
            payload={{ ...payload }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className={cn("p-2 bg-indigo-50 rounded-lg", color)}>{icon}</div>
      <h2 className="font-bold text-lg text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

function FamilyFiles({
  label,
  documents,
  noFatherInfo,
  noGuardianInfo,
}: {
  label: string;
  documents?: FamilyDocument;
  noFatherInfo?: boolean;
  noGuardianInfo?: boolean;
}) {
  const motherCards = [
    {
      role: "mother",
      label: "Mother's Passport",
      fileUrl: documents?.motherPassport ?? undefined,
      status: documents?.motherPassportStatus ?? undefined,
      expiry: documents?.motherPassportExpiry ?? undefined,
      typeLabel: documents?.motherPassportNumber ?? undefined,
      documentType: "motherPassport",
      payload: {
        motherPassport: documents?.motherPassport,
        motherPassportNumber: documents?.motherPassportNumber,
        motherPassportExpiry: documents?.motherPassportExpiry,
      },
    },
    {
      role: "mother",
      label: "Mother's Pass",
      fileUrl: documents?.motherPass ?? undefined,
      status: documents?.motherPassStatus ?? undefined,
      expiry: documents?.motherPassExpiry ?? undefined,
      typeLabel: documents?.motherPassType ?? undefined,
      documentType: "motherPass",
      payload: {
        motherPass: documents?.motherPass,
        motherPassType: documents?.motherPassType,
        motherPassExpiry: documents?.motherPassExpiry,
      },
    },
  ];

  const fatherCards = [
    {
      role: "father",
      label: "Father's Passport",
      fileUrl: documents?.fatherPassport ?? undefined,
      status: documents?.fatherPassportStatus ?? undefined,
      expiry: documents?.fatherPassportExpiry ?? undefined,
      typeLabel: documents?.fatherPassportNumber ?? undefined,
      documentType: "fatherPassport",
      payload: {
        fatherPassport: documents?.fatherPassport,
        fatherPassportNumber: documents?.fatherPassportNumber,
        fatherPassportExpiry: documents?.fatherPassportExpiry,
      },
    },
    {
      role: "father",
      label: "Father's Pass",
      fileUrl: documents?.fatherPass ?? undefined,
      status: documents?.fatherPassStatus ?? undefined,
      expiry: documents?.fatherPassExpiry ?? undefined,
      typeLabel: documents?.fatherPassType ?? undefined,
      documentType: "motherPass",
      payload: {
        fatherPass: documents?.fatherPass,
        fatherPassType: documents?.fatherPassType,
        fatherPassExpiry: documents?.fatherPassExpiry,
      },
    },
  ];

  const guardianCards = [
    {
      role: "guardian",
      label: "Guardian's Passport",
      fileUrl: documents?.guardianPassport ?? undefined,
      status: documents?.guardianPassportStatus ?? undefined,
      expiry: documents?.guardianPassportExpiry ?? undefined,
      typeLabel: documents?.guardianPassportNumber ?? undefined,
      documentType: "guardianPassport",
      payload: {
        guardianPassport: documents?.guardianPassport,
        guardianPassportNumber: documents?.guardianPassportNumber,
        guardianPassportExpiry: documents?.guardianPassportExpiry,
      },
    },
    {
      role: "guardian",
      label: "Guardian's Pass",
      fileUrl: documents?.guardianPass ?? undefined,
      status: documents?.guardianPassStatus ?? undefined,
      expiry: documents?.guardianPassExpiry ?? undefined,
      typeLabel: documents?.guardianPassType ?? undefined,
      documentType: "guardianPass",
      payload: {
        guardianPass: documents?.guardianPass,
        guardianPassType: documents?.guardianPassType,
        guardianPassExpiry: documents?.guardianPassExpiry,
      },
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="space-y-1">
        <h1 className="font-black text-2xl md:text-4xl text-slate-900 tracking-tight">{label}</h1>
        <p className="text-sm font-medium text-slate-500">
          This section includes details about the student's parens/guardian documents for this current school year.
        </p>
      </div>

      <section className="space-y-6">
        <SectionHeader title="Mother Documents" icon={<Heart className="size-5" />} color="text-rose-500" />

        <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4 mb-6">
          {motherCards.map((props, idx) => (
            <RenderFamilyDocCard key={idx} {...props} />
          ))}
        </div>
      </section>

      {noFatherInfo ? null : (
        <section className="space-y-6">
          <SectionHeader title="Father Documents" icon={<User className="size-5" />} color="text-blue-600" />
          <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4 mb-6">
            {fatherCards.map((props, idx) => (
              <RenderFamilyDocCard key={idx} {...props} />
            ))}
          </div>
        </section>
      )}
      {noGuardianInfo ? null : (
        <section className="space-y-6">
          <SectionHeader title="Guardian's Details" icon={<Users className="size-5" />} color="text-indigo-600" />
          <div className="w-full grid grid-cols-1 gap-x-3 gap-y-4">
            {guardianCards.map((props, idx) => (
              <RenderFamilyDocCard key={idx} {...props} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ParentGuardianFileUploaderDialog({
  parentEmail,
  role,
  status,
  academicYear,
  documentType,
  enroleeNumber,
  label,
}: ParentGuardianReuploadProps & { label: string; status: string; role: string; parentEmail: string }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: ParentGuardianDocumentUpdatePayload) => {
      return await parentGuardianReuploadDocuments({ academicYear, documentType, enroleeNumber, payload, role });
    },
    onSuccess: async () => {
      setIsOpen(false);
      queryClient.invalidateQueries();

      await sendEmailNotification({
        parentEmail,
        role,
        updatedSections: [label],
        section: "Parent/Guardian Documents",
        academicYear,
        enroleeNumber,
      });
    },
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [motherPass, setMotherPass] = useState("");
  const [motherPassType, setMotherPassType] = useState("");
  const [motherPassExpiry, setMotherPassExpiry] = useState<Date>();

  const [motherPassport, setMotherPassport] = useState("");
  const [motherPassportNumber, setMotherPassportNumber] = useState("");
  const [motherPassportExpiry, setMotherPassportExpiry] = useState<Date>();

  const [fatherPass, setFatherPass] = useState("");
  const [fatherPassType, setFatherPassType] = useState("");
  const [fatherPassExpiry, setFatherPassExpiry] = useState<Date>();

  const [fatherPassport, setFatherPassport] = useState("");
  const [fatherPassportNumber, setFatherPassportNumber] = useState("");
  const [fatherPassportExpiry, setFatherPassportExpiry] = useState<Date>();

  const [guardianPass, setGuardianPass] = useState("");
  const [guardianPassType, setGuardianPassType] = useState("");
  const [guardianPassExpiry, setGuardianPassExpiry] = useState<Date>();

  const [guardianPassport, setGuardianPassport] = useState("");
  const [guardianPassportNumber, setGuardianPassportNumber] = useState("");
  const [guardianPassportExpiry, setGuardianPassportExpiry] = useState<Date>();

  const props = useSupabaseUpload({
    bucketName: "parent-portal",
    path: `${academicYear}/documents`,
    allowedMimeTypes: ["application/pdf"],
    maxFiles: 4,
    maxFileSize: 1000 * 1000 * 4,
    mergeFiles: true,
  });

  useEffect(() => {
    if (!props.isSuccess) return;
    const uploadedFile = props.successes[0];

    if (documentType === "motherPass") {
      setMotherPass(uploadedFile);
    }
    if (documentType === "motherPassport") {
      setMotherPassport(uploadedFile);
    }

    if (documentType === "fatherPass") {
      setFatherPass(uploadedFile);
    }
    if (documentType === "fatherPassport") {
      setFatherPassport(uploadedFile);
    }

    if (documentType === "guardianPass") {
      setGuardianPass(uploadedFile);
    }

    if (documentType === "guardianPassport") {
      setGuardianPassport(uploadedFile);
    }
  }, [documentType, role, props.isSuccess, props.successes]);

  function submitReupload(e: FormEvent) {
    e.preventDefault();

    let filePayload: Record<string, unknown> = {};

    switch (documentType) {
      case "motherPass":
        if (!motherPass) {
          toast.error("Please upload the pass document.");
          return;
        }
        if (motherPassType === "") {
          toast.error("Please select a pass type.");
          return;
        }
        if (!motherPassExpiry) {
          toast.error("Please provide a pass expiry date.");
          return;
        }
        filePayload = {
          motherPass,
          motherPassType,
          motherPassExpiry: motherPassExpiry.toISOString(),
        };
        break;
      case "motherPassport":
        if (!motherPassport) {
          toast.error("Please upload the passport document.");
          return;
        }
        if (motherPassportNumber === "") {
          toast.error("Please enter the passport number.");
          return;
        }
        if (!motherPassportExpiry) {
          toast.error("Please provide a passport expiry date.");
          return;
        }
        filePayload = {
          motherPassport,
          motherPassportNumber,
          motherPassportExpiry: motherPassportExpiry.toISOString(),
        };
        break;
      case "fatherPass":
        if (!fatherPass) {
          toast.error("Please upload the pass document.");
          return;
        }
        if (fatherPassType === "") {
          toast.error("Please select a pass type.");
          return;
        }
        if (!fatherPassExpiry) {
          toast.error("Please provide a pass expiry date.");
          return;
        }
        filePayload = {
          fatherPass,
          fatherPassType,
          fatherPassExpiry: fatherPassExpiry.toISOString(),
        };
        break;
      case "fatherPassport":
        if (!fatherPassport) {
          toast.error("Please upload the passport document.");
          return;
        }
        if (fatherPassportNumber === "") {
          toast.error("Please enter the passport number.");
          return;
        }
        if (!fatherPassportExpiry) {
          toast.error("Please provide a passport expiry date.");
          return;
        }
        filePayload = {
          fatherPassport,
          fatherPassportNumber,
          fatherPassportExpiry: fatherPassportExpiry.toISOString(),
        };
        break;

      case "guardianPass":
        if (!guardianPass) {
          toast.error("Please upload the pass document.");
          return;
        }
        if (guardianPassType === "") {
          toast.error("Please select a pass type.");
          return;
        }
        if (!guardianPassExpiry) {
          toast.error("Please provide a pass expiry date.");
          return;
        }
        filePayload = {
          guardianPass,
          guardianPassType,
          guardianPassExpiry: guardianPassExpiry.toISOString(),
        };
        break;
      case "guardianPassport":
        if (!guardianPassport) {
          toast.error("Please upload the passport document.");
          return;
        }
        if (guardianPassportNumber === "") {
          toast.error("Please enter the passport number.");
          return;
        }
        if (!guardianPassportExpiry) {
          toast.error("Please provide a passport expiry date.");
          return;
        }
        filePayload = {
          guardianPassport,
          guardianPassportNumber,
          guardianPassportExpiry: guardianPassportExpiry.toISOString(),
        };
        break;
    }

    mutate(filePayload);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={status == "Valid" || status == "Uploaded" || isPending}
          className="gap-2 text-xs w-full font-bold">
          Reupload <RotateCcw />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-3xl">
        <form onSubmit={submitReupload} className="grid grid-cols-1 items-center space-y-4">
          <DialogHeader className="text-start">
            <DialogTitle className="font-black text-2xl">{label}</DialogTitle>
            <DialogDescription className="font-semibold">
              Upload a clear and recent document in <strong>PDF</strong> format.
            </DialogDescription>
          </DialogHeader>

          <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
            Upload up to 4 PDF documents. Provide all necessary information, then click Upload Files and Save Changes.
          </Badge>

          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {documentType === "motherPass" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <Select onValueChange={setMotherPassType} defaultValue={motherPassType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pass type" />
                </SelectTrigger>
                <SelectContent>
                  {parentGuardianPassTypes.map((passType) => (
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
                    className={cn("w-full pl-3 text-left font-normal", !motherPassExpiry && "text-muted-foreground")}>
                    {motherPassExpiry ? format(motherPassExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection date={motherPassExpiry} setDate={setMotherPassExpiry} disablePastDates />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {documentType === "motherPassport" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <PassportInput
                required
                placeholder="Enter passport number"
                value={motherPassportNumber}
                onChange={(e) => setMotherPassportNumber(e.target.value)}
              />

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !motherPassportExpiry && "text-muted-foreground"
                    )}>
                    {motherPassportExpiry ? format(motherPassportExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection
                    date={motherPassportExpiry}
                    setDate={setMotherPassportExpiry}
                    disablePastDates
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {documentType === "fatherPass" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <Select onValueChange={setFatherPassType} defaultValue={fatherPassType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pass type" />
                </SelectTrigger>
                <SelectContent>
                  {parentGuardianPassTypes.map((passType) => (
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
                    className={cn("w-full pl-3 text-left font-normal", !fatherPassExpiry && "text-muted-foreground")}>
                    {fatherPassExpiry ? format(fatherPassExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection date={fatherPassExpiry} setDate={setFatherPassExpiry} disablePastDates />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {documentType === "fatherPassport" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <PassportInput
                required
                placeholder="Enter passport number"
                value={fatherPassportNumber}
                onChange={(e) => setFatherPassportNumber(e.target.value)}
              />

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !motherPassportExpiry && "text-muted-foreground"
                    )}>
                    {fatherPassportExpiry ? format(fatherPassportExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection
                    date={fatherPassportExpiry}
                    setDate={setFatherPassportExpiry}
                    disablePastDates
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {documentType === "guardianPass" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <Select onValueChange={setGuardianPassType} defaultValue={guardianPassType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pass type" />
                </SelectTrigger>
                <SelectContent>
                  {parentGuardianPassTypes.map((passType) => (
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
                    className={cn("w-full pl-3 text-left font-normal", !guardianPassExpiry && "text-muted-foreground")}>
                    {guardianPassExpiry ? format(guardianPassExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection
                    date={guardianPassExpiry}
                    setDate={setGuardianPassExpiry}
                    disablePastDates
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {documentType === "guardianPassport" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <PassportInput
                required
                placeholder="Enter passport number"
                value={fatherPassportNumber}
                onChange={(e) => setGuardianPassportNumber(e.target.value)}
              />

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !guardianPassportExpiry && "text-muted-foreground"
                    )}>
                    {guardianPassportExpiry ? format(guardianPassportExpiry, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection
                    date={guardianPassportExpiry}
                    setDate={setGuardianPassportExpiry}
                    disablePastDates
                  />
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

export default FamilyFiles;
