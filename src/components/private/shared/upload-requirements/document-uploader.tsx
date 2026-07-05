import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ResponsiveModal from "@/components/ui/responsive-modal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EyeClosed, FileClock, FileText, FileX } from "lucide-react";
import { FieldValues, UseFormReturn } from "react-hook-form";

import { DocumentConfig } from "./document-config";
import { DocumentModalBody } from "./document-modal-body";
import { ResetStrategy, SetUploadRequirementsFn, SharedUploadFormState } from "./types";
import { useDocumentUploadDialog } from "./use-document-upload-dialog";

export type DocumentUploaderProps<TFieldValues extends FieldValues> = {
  cfg: DocumentConfig;
  form: UseFormReturn<TFieldValues>;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: SharedUploadFormState;
  setFormState: SetUploadRequirementsFn;
  resetStrategy?: ResetStrategy;
};

/**
 * One row + upload dialog for a single document. Replaces `student-file-uploader-dialog.tsx` /
 * `parent-guardian-file-uploader-dialog.tsx` and their 4 per-flow physical copies — a single,
 * config-driven implementation shared by all 5 enrollment flows and both document groups.
 */
export function DocumentUploader<TFieldValues extends FieldValues>({
  cfg,
  form,
  value,
  onValueChange,
  formState,
  setFormState,
  resetStrategy,
}: DocumentUploaderProps<TFieldValues>) {
  const dialog = useDocumentUploadDialog({ cfg, form, value, onValueChange, formState, setFormState, resetStrategy });
  const { hasError, isToFollow, isUploaded, isValid, docDescription } = dialog;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 w-full transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "bg-slate-100 text-slate-400 size-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
            {
              "bg-primary text-primary-foreground shadow-sm": isUploaded,
              "bg-destructive text-white": hasError && isUploaded,
              "bg-amber-600 text-white": isToFollow,
            },
          )}>
          {isUploaded ? (
            <FileText className="stroke-white size-6" />
          ) : hasError && isUploaded ? (
            <FileX className="size-6" />
          ) : isToFollow ? (
            <FileClock className="size-6" />
          ) : (
            <EyeClosed className="size-6" />
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-bold uppercase">{cfg.label}</span>
            <span
              className={cn("uppercase font-bold text-[10px]", {
                "text-green-600": isValid || isUploaded,
                "text-blue-600": isToFollow,
                "text-red-600": hasError,
              })}>
              {docDescription.status}
            </span>
          </div>
          <span
            className={cn("uppercase text-muted-foreground font-bold text-xs", {
              "text-amber-600": isToFollow || docDescription.description === "Action Required",
            })}>
            {docDescription.description}
          </span>
          {docDescription.expirationDate && (
            <span className="uppercase text-muted-foreground font-bold text-xs">
              Expires: {format(new Date(docDescription.expirationDate), "d MMMM yyyy")}
            </span>
          )}
        </div>
      </div>

      <ResponsiveModal
        trigger={
          <Button className="!text-xs font-bold" variant={hasError ? "destructive" : "outline"}>
            {isUploaded ? "View" : isToFollow ? "To follow" : "Upload"}
          </Button>
        }
        title={cfg.label}
        badge={
          <Badge
            variant={"outline"}
            className={cn("uppercase font-bold text-[12px]", {
              "text-green-600": isValid || isUploaded,
              "text-amber-600": isToFollow,
              "text-red-600": hasError,
            })}>
            {docDescription.status
              ? docDescription.status
              : docDescription.description === "Marked to follow"
                ? "Marked to follow"
                : ""}
          </Badge>
        }
        description={
          <>
            {cfg.description && <span className="block">{cfg.description}</span>}
            Upload a clear and recent document in{" "}
            <strong>{cfg.maxFiles > 1 ? "PDF" : "PNG, JPG, or JPEG"}</strong> format.
          </>
        }>
        <DocumentModalBody
          cfg={cfg}
          form={form}
          value={value}
          onValueChange={onValueChange}
          formState={formState}
          setUploadRequirements={setFormState}
          dialog={dialog}
        />
      </ResponsiveModal>
    </div>
  );
}
