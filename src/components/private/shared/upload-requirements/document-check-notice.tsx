import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TriangleAlert } from "lucide-react";
import { ReactNode } from "react";

import { DocumentCheck } from "./use-document-check";

/** Per-page numbers + the raw text the check read, for tuning the quality thresholds against real
 * uploads. On in dev, and on a deployed build only when VITE_OCR_DEBUG=true. */
const showDebug = () => import.meta.env.DEV || import.meta.env.VITE_OCR_DEBUG === "true";

/**
 * The read-then-confirm step: a spinner while the OCR check reads, then what it read, as the parent's
 * own editable detail fields (passed in as `children`, pre-filled and hinted), in one card, saying why
 * the upload is held when the details disagree with the document.
 */
export function DocumentCheckCard({ check, children }: { check: DocumentCheck; children?: ReactNode }) {
  const { state, docName, readFields, blocked, severalPassports } = check;
  if (state.phase === "idle") return null;

  const read = readFields.length > 0;
  const blurry = state.phase === "done" && state.result.poorQuality;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
      {state.phase === "checking" ? (
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Loader2 className="size-4 animate-spin" /> Reading your {docName}…
          </p>
          <p className="text-xs text-muted-foreground">This can take a little while. Please keep this open.</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold">{read ? `We read your ${docName}` : `Enter your ${docName} details`}</p>
          <p className="text-xs text-muted-foreground">
            {read ? "Check the details are correct before uploading." : `We couldn't read them from the file.`}
          </p>
        </div>
      )}

      {state.phase !== "checking" && children}

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

      {showDebug() && state.phase === "failed" && (
        <pre className="rounded-md border p-2 text-xs text-muted-foreground whitespace-pre-wrap break-words">
          OCR error: {state.error}
        </pre>
      )}

      {showDebug() && state.phase === "done" && (
        <details className="rounded-md border p-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium">OCR debug</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                poorQuality: state.result.poorQuality,
                reading: state.result.reading,
                passports: state.result.passports,
              },
              null,
              2,
            )}
            {`\n\n--- text ---\n${state.result.text}`}
          </pre>
        </details>
      )}
    </div>
  );
}
