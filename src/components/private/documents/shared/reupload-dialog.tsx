import { DocumentConfig } from "@/components/private/shared/upload-requirements/document-config";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CalendarIcon, Download, RotateCcw, Save } from "lucide-react";
import { Link } from "react-router";

import { useReuploadDialog } from "./use-reupload-dialog";

const medicalExamUrl = import.meta.env.VITE_MEDICAL_EXAM_FORM_URL as string;

type ReuploadDialogProps = {
  cfg: DocumentConfig;
  /** Page-specific display title (e.g. "Student Pass", "Mother's Passport") — kept independent of
   * `cfg.label` (used by the enrollment wizard) so migrating this page onto the shared config
   * doesn't silently change copy parents are already used to seeing here. */
  title: string;
  status?: string;
  academicYear: string;
  enroleeNumber: string;
  existingFileUrl?: string | null;
  queryKeysToInvalidate: unknown[][];
  emailSection: "Student Documents" | "Parent/Guardian Documents";
};

/**
 * The one reupload Dialog — replaces `StudentFileUploaderDialog` (student-files.tsx) and
 * `ParentGuardianFileUploaderDialog` (family-files.tsx), config-driven via the same
 * `DocumentConfig` the enrollment wizard uses. Only a plain `Dialog` — neither original file had a
 * mobile `Drawer` variant, so there's no responsive-modal split to preserve here.
 */
export function ReuploadDialog({
  cfg,
  title,
  status,
  academicYear,
  enroleeNumber,
  existingFileUrl,
  queryKeysToInvalidate,
  emailSection,
}: ReuploadDialogProps) {
  const dialog = useReuploadDialog({ cfg, academicYear, enroleeNumber, existingFileUrl, queryKeysToInvalidate, emailSection });
  const { isOpen, setIsOpen, uploadProps, typeValue, setTypeValue, numberValue, setNumberValue, expiryValue, setExpiryValue, submitReupload, isPending, canSave, siblingFieldNames } = dialog;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={status === "Valid" || status === "Uploaded" || isPending}
          className="w-full gap-2 text-xs font-bold">
          Reupload <RotateCcw />
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-3xl">
        <form onSubmit={submitReupload} className="grid grid-cols-1 items-center space-y-4">
          <DialogHeader className="text-start">
            <DialogTitle className="font-black text-2xl">{title}</DialogTitle>
            <DialogDescription className="font-semibold">
              Upload a clear and recent document in <strong>{cfg.maxFiles > 1 ? "PDF" : "PNG, JPG, or JPEG"}</strong>{" "}
              format.
            </DialogDescription>
          </DialogHeader>

          {cfg.maxFiles > 1 && (
            <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
              Upload up to {cfg.maxFiles} PDF documents. Provide all necessary information, then click Upload Files
              and Save Changes.
            </Badge>
          )}

          {cfg.showMedicalExamLink && (
            <Link
              to={medicalExamUrl}
              target="_blank"
              className={buttonVariants({ className: "gap-2 w-max mx-auto text-xs", variant: "outline" })}>
              Download Medical Exam Form <Download />
            </Link>
          )}

          <Dropzone {...uploadProps}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          {siblingFieldNames.type && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <Select onValueChange={setTypeValue} value={typeValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a pass type" />
                </SelectTrigger>
                <SelectContent>
                  {cfg.passTypeOptions?.map((passType) => (
                    <SelectItem key={passType.value} value={passType.value}>
                      {passType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !expiryValue && "text-muted-foreground")}>
                    {expiryValue ? format(expiryValue, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection date={expiryValue} setDate={setExpiryValue} disablePastDates />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {siblingFieldNames.number && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <PassportInput
                required
                placeholder={cfg.numberPlaceholder}
                value={numberValue}
                onChange={(e) => setNumberValue(e.target.value)}
              />

              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={"outline"}
                    className={cn("w-full pl-3 text-left font-normal", !expiryValue && "text-muted-foreground")}>
                    {expiryValue ? format(expiryValue, "dd/MM/yyyy") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <AdvancedCalendarSelection date={expiryValue} setDate={setExpiryValue} disablePastDates />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* A disabled Save button with no explanation is its own dead end: parents read "file
              selected" as "file uploaded", so the reason has to name the button they still owe us. */}
          {!canSave && (
            <p className="text-center text-xs font-medium text-muted-foreground">
              Click <strong>Upload files</strong> above to finish uploading your document.
            </p>
          )}

          <DialogFooter>
            <Button
              disabled={!canSave || isPending}
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
