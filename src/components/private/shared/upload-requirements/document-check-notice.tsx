import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";

import { DocumentCheck } from "./use-document-check";

/**
 * What goes inside the upload box once a file is chosen: a spinner while the OCR check reads, then how
 * it went. The box stays put through the whole step, so the parent never loses their place.
 */
export function DocumentCheckStatus({ check }: { check: DocumentCheck }) {
  const { state, docName, readFields } = check;
  const read = readFields.length > 0;

  // Idle too: that's the moment between choosing the file and the read starting.
  if (state.phase === "checking" || state.phase === "idle") {
    return (
      <div className="flex w-full flex-col items-center justify-center p-8 text-center">
        <Loader2 className="mb-2 size-10 animate-spin text-primary" />
        <p className="text-sm font-semibold">Reading your {docName}…</p>
        <p className="text-xs text-muted-foreground">This can take a little while. Please keep this open.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center p-8 text-center">
      {read ? (
        <CheckCircle2 className="mb-2 size-10 text-success" />
      ) : (
        <TriangleAlert className="mb-2 size-10 text-warning" />
      )}
      <p className="text-sm font-semibold">{read ? `We read your ${docName}` : `Enter your ${docName} details`}</p>
      <p className="text-xs text-muted-foreground">
        {read ? "Check the details below are correct." : "We couldn't read them from the file."}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="font-semibold">Click</span> or drag and drop to add another page
      </p>
    </div>
  );
}

/**
 * The read-then-confirm step under the upload box: the parent's own editable detail fields (passed in
 * as `children`, pre-filled and hinted), saying why the upload is held when the details disagree with
 * the document. Nothing until the read finishes.
 */
export function DocumentCheckCard({ check, children }: { check: DocumentCheck; children?: ReactNode }) {
  const { state, docName, readFields, blocked, severalPassports } = check;
  if (state.phase === "idle" || state.phase === "checking") return null;

  const blurry = state.phase === "done" && state.result.poorQuality;

  return (
    <div className="flex flex-col gap-3">
      {children}

      {blocked && (
        <Alert variant="destructive" className="py-2">
          <TriangleAlert />
          <AlertDescription>
            {readFields.some((field) => field.status === "expired")
              ? `This ${docName} has expired. Please upload the current one.`
              : `These details don't match the ${docName} you uploaded. Correct them, or upload the right ${docName}.`}
          </AlertDescription>
        </Alert>
      )}

      {severalPassports && !blocked && (
        <Alert variant="warning" className="py-2">
          <TriangleAlert />
          <AlertDescription>
            This file has more than one {docName}. Enter the details for the person this upload is for.
          </AlertDescription>
        </Alert>
      )}

      {blurry && (
        <Alert variant="warning" className="py-2">
          <TriangleAlert />
          <AlertDescription>The scan looks blurry. Check the details carefully, or upload a sharper scan.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
