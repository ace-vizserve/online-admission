import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SubmitFailure } from "@/lib/submit-failure";
import { AlertTriangle } from "lucide-react";

/**
 * Tells a parent, in a way they cannot miss, that their application did not go through.
 *
 * An AlertDialog rather than a toast: it holds the page until acknowledged, so the failure can't
 * time out while the parent is looking somewhere else. The previous toast auto-dismissed after a
 * few seconds and left nothing behind, which is how an unsubmitted application ends up being
 * reported to the school as a submitted one.
 */
export function SubmitFailureDialog({ failure, onDismiss }: { failure: SubmitFailure | null; onDismiss: () => void }) {
  return (
    // `open` is derived entirely from `failure`, so the only transition this dialog can make is
    // open -> closed. Any change therefore means "dismissed".
    <AlertDialog open={failure !== null} onOpenChange={() => onDismiss()}>
      {failure && (
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <div className="mb-2 mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-7 text-destructive" />
            </div>
            <AlertDialogTitle className="font-black text-center">{failure.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs md:text-sm text-center font-medium">
              {failure.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 sm:justify-center">
            <AlertDialogAction className="font-bold" onClick={onDismiss}>
              Back to my application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
