import { MAX_UPLOAD_FILE_SIZE, deleteFile, parentGuardianReuploadDocuments, studentReuploadDocuments } from "@/actions/private";
import { sendEmailNotification } from "@/actions/send-email-notification";
import { DocumentConfig, siblingFields } from "@/components/private/shared/upload-requirements/document-config";
import useSession from "@/hooks/use-session";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

/** `cfg.name` for every parent/guardian document is `${role}Pass`/`${role}Passport` — the document
 * owner role the reupload actions need is always recoverable from the config, so callers never
 * have to pass it in separately (and can't accidentally pass the wrong one). */
function documentOwnerRole(cfg: DocumentConfig): string | undefined {
  if (cfg.group !== "parentGuardian") return undefined;
  return cfg.name.replace(/(Passport|Pass)$/, "");
}

type UseReuploadDialogArgs = {
  cfg: DocumentConfig;
  academicYear: string;
  enroleeNumber: string;
  /** The currently-stored file URL (if any) — deleted from storage once the reupload succeeds, so
   * reuploading doesn't orphan the previous file in the bucket forever. */
  existingFileUrl?: string | null;
  queryKeysToInvalidate: unknown[][];
  emailSection: "Student Documents" | "Parent/Guardian Documents";
};

/**
 * The one hook behind every reupload dialog on the post-submission "update application / reupload
 * documents" page — replaces the near-identical `StudentFileUploaderDialog`/
 * `ParentGuardianFileUploaderDialog` state (per-document-type `useState` triples + a
 * `switch(documentType)` duplicated 12 times across `student-files.tsx`/`family-files.tsx`),
 * driven by the same `DocumentConfig` policy table the enrollment wizard already uses.
 */
export function useReuploadDialog({
  cfg,
  academicYear,
  enroleeNumber,
  existingFileUrl,
  queryKeysToInvalidate,
  emailSection,
}: UseReuploadDialogArgs) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { type, number, expiry } = siblingFields(cfg);

  const [mainValue, setMainValue] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [expiryValue, setExpiryValue] = useState<Date | undefined>();

  const uploadProps = useSupabaseUpload({
    bucketName: "parent-portal",
    path: `${academicYear}/documents`,
    allowedMimeTypes: Object.keys(cfg.accept),
    maxFiles: cfg.maxFiles,
    maxFileSize: MAX_UPLOAD_FILE_SIZE,
    mergeFiles: cfg.maxFiles > 1,
  });

  useEffect(() => {
    if (!uploadProps.isSuccess) return;
    setMainValue(uploadProps.successes[0]);
  }, [uploadProps.isSuccess, uploadProps.successes]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (cfg.group === "student") {
        return studentReuploadDocuments({
          academicYear,
          documentType: cfg.name,
          enroleeNumber,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: payload as any,
        });
      }
      return parentGuardianReuploadDocuments({
        role: documentOwnerRole(cfg)!,
        academicYear,
        documentType: cfg.name,
        enroleeNumber,
        payload,
      });
    },
    onSuccess: async () => {
      // Only reachable when the mutation actually resolved without throwing — `studentReuploadDocuments`/
      // `parentGuardianReuploadDocuments` re-throw after their own toast on any failure (ownership,
      // session, or DB error), so this branch is a real success: safe to close the dialog, refresh
      // the page's data, clean up the old file, and tell the other parent what changed.
      setIsOpen(false);
      queryKeysToInvalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

      if (existingFileUrl) {
        try {
          await deleteFile(existingFileUrl, academicYear);
        } catch {
          // The new document is already saved — a failed cleanup of the OLD file is a storage-
          // hygiene concern, not a reason to make this look like a failed reupload to the user.
          toast.warning("The previous file couldn't be removed from storage, but your new document was saved.");
        }
      }

      await sendEmailNotification({
        parentEmail: session?.user.email as string,
        // The logged-in user's OWN relationship — not the document's owner (mother/father/guardian
        // documents are all visible on this page regardless of who's logged in, so inferring the
        // "who made this change" role from the document type instead of the session would mislabel
        // the notification whenever a parent reuploads a document that isn't their own).
        role: session?.user.user_metadata.relationship as string,
        updatedSections: [cfg.label],
        section: emailSection,
        academicYear,
        enroleeNumber,
      });
    },
  });

  function submitReupload(e: FormEvent) {
    e.preventDefault();

    if (!mainValue) {
      toast.error(`Please upload the ${cfg.label.toLowerCase()}.`);
      return;
    }

    const payload: Record<string, unknown> = { [cfg.name]: mainValue };

    if (type) {
      if (!typeValue) {
        toast.error("Please select a pass type.");
        return;
      }
      payload[type] = typeValue;
    }

    if (number) {
      if (!numberValue.trim()) {
        toast.error("Please enter the passport number.");
        return;
      }
      payload[number] = numberValue;
    }

    if (expiry) {
      if (!expiryValue) {
        toast.error(`Please provide a ${type ? "pass" : "passport"} expiry date.`);
        return;
      }
      payload[expiry] = expiryValue.toISOString();
    }

    mutate(payload);
  }

  // `mainValue` is only ever set by the `isSuccess` effect above, so it is exactly "the file has
  // finished uploading to storage" — the same condition `submitReupload` bails on. Exposed so the
  // dialog can disable Save changes instead of letting parents click it into a validation toast.
  const canSave = Boolean(mainValue);

  return {
    isOpen,
    setIsOpen,
    uploadProps,
    typeValue,
    setTypeValue,
    numberValue,
    setNumberValue,
    expiryValue,
    setExpiryValue,
    submitReupload,
    isPending,
    canSave,
    siblingFieldNames: { type, number, expiry },
  };
}
