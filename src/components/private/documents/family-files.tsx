import { parentGuardianReuploadDocuments } from "@/actions/private";
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
import { parentGuardianPassTypes } from "@/data";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { cn } from "@/lib/utils";
import { FamilyDocument, ParentGuardianDocumentUpdatePayload, ParentGuardianReuploadProps } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDate } from "date-fns";
import { DotPulse } from "ldrs/react";
import { CalendarIcon, EllipsisVertical, Eye, EyeClosed, RotateCcw, Save } from "lucide-react";
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
  const isMissing = !fileUrl;
  const params = useParams();
  const [searchParams] = useSearchParams();
  const academicYear = searchParams.get("academicYear");

  return (
    <div className="w-full flex items-center justify-center flex-col gap-4 border shadow rounded-lg py-6 px-4">
      <div className="w-full flex relative">
        <StatusBadge className="absolute -top-2" status={status && !isMissing ? (status as StatusProps) : "Missing"} />
        {!isMissing && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="absolute right-0 -top-2" size={"icon"} variant={"outline"}>
                  <EllipsisVertical />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">{label}</h4>
                    <p className="text-xs text-muted-foreground">See the details of the {label}.</p>
                  </div>
                  <div className="grid gap-2">
                    {typeLabel && (
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="text-xs">Type/Number</span>
                        <Input
                          defaultValue={typeLabel ? typeLabel : "N/A"}
                          className="col-span-2 h-8 capitalize"
                          readOnly
                        />
                      </div>
                    )}
                    {expiry && (
                      <div className="grid grid-cols-3 items-center gap-4">
                        <span className="text-xs">Expires at</span>
                        <Input
                          tabIndex={-1}
                          defaultValue={expiry ? formatDate(new Date(expiry), "dd/MM/yyyy") : "N/A"}
                          className="col-span-2 h-8"
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
        <div className="pt-4 w-max mx-auto">
          <img src={fileSvg} className="size-10" />
        </div>
      </div>
      <p className="text-muted-foreground font-medium text-sm">{label}</p>
      {isMissing ? (
        <div className="flex flex-col gap-2 w-full">
          <Button disabled variant={"secondary"} className="gap-2 text-xs  w-full">
            View document <EyeClosed />
          </Button>
          <Button disabled className="gap-2 text-xs w-full">
            Reupload <RotateCcw />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          <Link
            to={fileUrl}
            target="_blank"
            className={buttonVariants({
              className: "gap-2 text-xs  w-full",
              variant: "secondary",
            })}>
            View document <Eye />
          </Link>
          <ParentGuardianFileUploaderDialog
            role={role}
            status={status!}
            academicYear={academicYear!}
            documentType={documentType}
            enroleeNumber={params.id!}
            label={label!}
            payload={{ ...payload }}
          />
        </div>
      )}
    </div>
  );
}

function FamilyFiles({ label, documents }: { label: string; documents?: FamilyDocument }) {
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
    <div className="space-y-8 py-6 xl:py-0">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">{label}</h1>
        <p className="text-sm text-muted-foreground">
          This section includes details about the parent and guardian documents for this current school year.
        </p>
      </div>
      <h2 className="font-bold text-lg">Mother's Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-6">
        {motherCards.map((props) => (
          <RenderFamilyDocCard {...props} />
        ))}
      </div>
      <Separator className="my-4" />
      <h2 className="font-bold text-lg">Father's Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 mb-6">
        {fatherCards.map((props) => (
          <RenderFamilyDocCard {...props} />
        ))}
      </div>
      <Separator className="my-4" />
      <h2 className="font-bold text-lg">Guardian's Documents</h2>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
        {guardianCards.map((props) => (
          <RenderFamilyDocCard {...props} />
        ))}
      </div>
    </div>
  );
}

function ParentGuardianFileUploaderDialog({
  role,
  status,
  academicYear,
  documentType,
  enroleeNumber,
  label,
}: ParentGuardianReuploadProps & { label: string; status: string; role: string }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: ParentGuardianDocumentUpdatePayload) => {
      return await parentGuardianReuploadDocuments({ academicYear, documentType, enroleeNumber, payload, role });
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: ["family-documents", enroleeNumber],
      });
    },
  });

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
    <Dialog>
      <DialogTrigger asChild>
        <Button disabled={status == "Valid" || status == "Uploaded" || isPending} className="gap-2 text-xs w-full">
          Reupload <RotateCcw />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-2xl">
        <form onSubmit={submitReupload} className="grid grid-cols-1 items-center space-y-4">
          <DialogHeader className="text-start">
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Upload a clear and recent photo. Accepted formats: PNG, JPG, or JPEG and PDF.
            </DialogDescription>
          </DialogHeader>

          <Badge className="w-max mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
            Upload all pages containing relevant details
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
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={motherPassExpiry}
                    onSelect={setMotherPassExpiry}
                  />
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
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={motherPassportExpiry}
                    onSelect={setMotherPassportExpiry}
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
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={fatherPassExpiry}
                    onSelect={setFatherPassExpiry}
                  />
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
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={fatherPassportExpiry}
                    onSelect={setFatherPassportExpiry}
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
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={guardianPassExpiry}
                    onSelect={setGuardianPassExpiry}
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
                  <Calendar
                    mode="single"
                    disabled={[
                      {
                        before: new Date(),
                      },
                    ]}
                    selected={guardianPassportExpiry}
                    onSelect={setGuardianPassportExpiry}
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

export default FamilyFiles;
