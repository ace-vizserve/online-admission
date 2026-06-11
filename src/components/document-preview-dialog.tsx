import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"];

function getExtension(value: string) {
  const clean = value.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : "";
}

function getDisplayName(source: File | string) {
  if (typeof source !== "string") return source.name;
  const clean = source.split("?")[0].split("#")[0];
  return decodeURIComponent(clean.slice(clean.lastIndexOf("/") + 1)) || "Document";
}

function isImageSource(source: File | string) {
  if (typeof source !== "string") return source.type.startsWith("image/");
  return IMAGE_EXTENSIONS.includes(getExtension(source));
}

type DocumentPreviewDialogProps = {
  /** A locally-selected File (before upload) or the uploaded document URL (after upload). */
  source: File | string;
  /** The element that opens the preview (e.g. the filename row or a "View document" button). */
  trigger: ReactNode;
};

/**
 * Lets parents preview a document — either one they just selected or one already uploaded —
 * in an inline modal (image or embedded PDF), with an "Open in new tab" fallback.
 *
 * Used in both the enrollment form uploaders and the post-submission reupload dialogs.
 */
const DocumentPreviewDialog = ({ source, trigger }: DocumentPreviewDialogProps) => {
  const isImage = isImageSource(source);
  const displayName = getDisplayName(source);

  // For local files we mint an object URL; for already-uploaded files the string IS the URL.
  const previewUrl = useMemo(
    () => (typeof source === "string" ? source : URL.createObjectURL(source)),
    [source],
  );

  useEffect(() => {
    return () => {
      if (typeof source !== "string") URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, source]);

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="!max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6 text-left text-base">{displayName}</DialogTitle>
          <DialogDescription className="sr-only">Preview of the document</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted">
          {isImage ? (
            <img src={previewUrl} alt={displayName} className="mx-auto h-auto w-full object-contain" />
          ) : (
            // iframe renders PDFs (and gracefully handles other inline-viewable types).
            <iframe src={previewUrl} title={displayName} className="h-[70vh] w-full bg-white" />
          )}
        </div>

        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-x-2 self-start text-sm text-muted-foreground underline transition hover:text-foreground">
          <ExternalLink className="size-4" />
          Open in new tab
        </a>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
