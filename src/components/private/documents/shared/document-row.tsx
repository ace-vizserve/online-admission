import { DocumentConfig } from "@/components/private/shared/upload-requirements/document-config";
import DocumentPreviewDialog from "@/components/document-preview-dialog";
import { buttonVariants } from "@/components/ui/button";
import StatusBadge, { type StatusProps } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Eye, EyeClosed, FileText } from "lucide-react";

import { ReuploadDialog } from "./reupload-dialog";

type DocumentRowProps = {
  cfg: DocumentConfig;
  /** Page-specific display title — see `ReuploadDialog`'s note on why this stays independent of
   * `cfg.label`. */
  title: string;
  fileUrl?: string | null;
  status?: string | null;
  expiry?: string | null;
  /** Shown as "Ref: {typeLabel}" — only `family-files.tsx`'s cards used this (the pass type /
   * passport number already on file), `student-files.tsx`'s did not; kept optional per row rather
   * than forced on both to avoid changing either page's existing copy. */
  typeLabel?: string | null;
  /** Text shown once uploaded with no expiry to display — the two original files used slightly
   * different wording ("Record saved" vs "Record Verified"); kept as a prop instead of picking one. */
  savedLabel?: string;
  academicYear: string;
  enroleeNumber: string;
  queryKeysToInvalidate: unknown[][];
  emailSection: "Student Documents" | "Parent/Guardian Documents";
};

/**
 * The one document status-row card — replaces `DocumentRow` (student-files.tsx) and
 * `RenderFamilyDocCard` (family-files.tsx), config-driven the same way the enrollment wizard's
 * `DocumentUploader` row is.
 */
export function DocumentRow({
  cfg,
  title,
  fileUrl,
  status,
  expiry,
  typeLabel,
  savedLabel = "Record saved",
  academicYear,
  enroleeNumber,
  queryKeysToInvalidate,
  emailSection,
}: DocumentRowProps) {
  const isMissing = !fileUrl || status === "To follow";

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl gap-4 transition-all hover:border-slate-300">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "size-11 shrink-0 rounded-xl flex items-center justify-center transition-colors",
            isMissing ? "bg-slate-100 text-slate-400" : "bg-primary text-primary-foreground shadow-sm",
          )}>
          {isMissing ? <EyeClosed size={20} /> : <FileText size={20} />}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{title}</h3>
            <StatusBadge
              status={status ? (status as StatusProps) : "Missing"}
              className="text-[10px] font-bold uppercase"
            />
          </div>

          {!isMissing && expiry ? (
            <p className="text-[11px] text-slate-500 font-bold tracking-tight">
              Expires: {format(new Date(expiry), "dd MMM yyyy")}
            </p>
          ) : (
            <p
              className={cn(
                "text-[11px] font-bold uppercase tracking-tighter",
                isMissing ? "text-amber-600" : "text-slate-500",
              )}>
              {isMissing ? "Action Required" : savedLabel}
            </p>
          )}
          {typeLabel && (
            <span className="text-[10px] text-slate-400 font-medium truncate italic">Ref: {typeLabel}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 border-t border-slate-50 pt-3 sm:pt-0 sm:border-0 sm:ml-auto">
        {!isMissing && fileUrl && (
          <DocumentPreviewDialog
            source={fileUrl}
            trigger={
              <button
                type="button"
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "flex-1 sm:flex-none h-9 gap-2 text-[11px] !font-bold border-slate-200 hover:bg-slate-50 rounded-2xl",
                })}>
                <Eye size={14} />
                <span>View</span>
              </button>
            }
          />
        )}

        <div className="flex-1 sm:flex-none">
          <ReuploadDialog
            cfg={cfg}
            title={title}
            status={status ?? undefined}
            academicYear={academicYear}
            enroleeNumber={enroleeNumber}
            existingFileUrl={fileUrl}
            queryKeysToInvalidate={queryKeysToInvalidate}
            emailSection={emailSection}
          />
        </div>
      </div>
    </div>
  );
}
