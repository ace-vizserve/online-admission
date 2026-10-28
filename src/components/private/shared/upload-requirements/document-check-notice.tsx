import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, Loader2 } from "lucide-react";

import { DocumentCheck } from "./use-document-check";

/** Per-page numbers + the raw text the check read, for tuning the quality thresholds against real
 * uploads. On in dev, and on a deployed build only when VITE_OCR_DEBUG=true. */
const showDebug = () => import.meta.env.DEV || import.meta.env.VITE_OCR_DEBUG === "true";

export function DocumentCheckNotice({ check }: { check: DocumentCheck }) {
  const { state, blockReason, notice } = check;
  if (state.phase === "idle") return null;

  return (
    <div className="flex flex-col gap-2">
      {blockReason ? (
        <Alert variant={state.phase === "checking" ? "default" : "destructive"}>
          {state.phase === "checking" ? <Loader2 className="animate-spin" /> : <AlertCircle />}
          <AlertDescription>{blockReason}</AlertDescription>
        </Alert>
      ) : (
        notice && (
          <Alert>
            <Info />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )
      )}

      {showDebug() && state.phase === "done" && (
        <details className="rounded-md border p-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium">OCR debug</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                status: state.result.status,
                reading: state.result.status === "read" ? state.result.reading : undefined,
                pages: state.result.pages,
              },
              null,
              2,
            )}
            {state.result.status === "read" && `\n\n--- text ---\n${state.result.text}`}
          </pre>
        </details>
      )}
    </div>
  );
}
