import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import DocumentPreviewDialog from "@/components/document-preview-dialog";
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from "@/components/ui/file-input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DotPulse } from "ldrs/react";
import "ldrs/react/DotPulse.css";
import { CloudUpload, Download, Eye, InfoIcon, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Link } from "react-router";

import fileSvg from "@/assets/file.svg";
import { DocumentConfig } from "./document-config";
import { DocumentSubFields } from "./document-sub-fields";
import { SetUploadRequirementsFn, SharedUploadFormState } from "./types";
import { useDocumentUploadDialog } from "./use-document-upload-dialog";

const medicalExamUrl = import.meta.env.VITE_MEDICAL_EXAM_FORM_URL as string;

type DocumentModalBodyProps<TFieldValues extends FieldValues> = {
  cfg: DocumentConfig;
  form: UseFormReturn<TFieldValues>;
  value: File[] | null;
  onValueChange: (files: File[] | null) => void;
  formState: SharedUploadFormState;
  setUploadRequirements: SetUploadRequirementsFn;
  dialog: ReturnType<typeof useDocumentUploadDialog<TFieldValues>>;
};

/**
 * The single, shared body of the upload dialog — rendered once and passed as `children` to
 * `ResponsiveModal`, so the desktop Dialog and mobile Drawer can never drift apart (previously
 * each layout re-wrote this ~800 lines of near-identical JSX by hand, and the mobile copy had
 * quietly lost the pass/passport field labels and descriptions the desktop copy still had).
 */
export function DocumentModalBody<TFieldValues extends FieldValues>({
  cfg,
  form,
  value,
  onValueChange,
  formState,
  setUploadRequirements,
  dialog,
}: DocumentModalBodyProps<TFieldValues>) {
  const {
    dropZoneConfig,
    isPending,
    uploadFile,
    isChangingDocument,
    confirmOpen,
    setConfirmOpen,
    requestChangeDocument,
    confirmChangeDocument,
    removeSelectedFile,
    toggleToFollow,
    isUploaded,
    isToFollow,
    sliceValue,
  } = dialog;

  const showToFollowSwitch = !isUploaded && cfg.toFollowEligible && !cfg.optional;

  return (
    <>
      {cfg.maxFiles > 1 && (
        <Badge className="text-center !whitespace-normal mx-auto text-xs bg-amber-600/10 hover:bg-amber-600/10 text-amber-500 shadow-none">
          Upload up to {cfg.maxFiles} PDF documents. Provide all necessary information, then click Upload Files and
          Save Changes.
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

      {isUploaded ? (
        <div className="relative w-full flex items-center justify-center flex-col gap-4 border-dashed bg-muted border-2 rounded-lg py-6">
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              disabled={isChangingDocument}
              onClick={requestChangeDocument}
              size={"sm"}
              className="text-xs absolute right-4 top-4 font-bold">
              {isChangingDocument && <Loader2 className="size-4 animate-spin" />}
              Change document
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the uploaded {cfg.label.toLowerCase()} so you can upload a replacement. This can't
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void confirmChangeDocument()}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="p-6 bg-white rounded-full">
            <img src={fileSvg} alt="" className="size-14" />
          </div>
          <p className="text-muted-foreground font-medium text-sm">{cfg.label} has been uploaded</p>

          {sliceValue && (
            <DocumentPreviewDialog
              source={sliceValue}
              trigger={
                <button
                  type="button"
                  className={buttonVariants({ className: "gap-2 text-xs hover:bg-white", variant: "outline" })}>
                  View document <Eye className="size-4" />
                </button>
              }
            />
          )}
        </div>
      ) : (
        <FormField
          control={form.control}
          name={cfg.name as Path<TFieldValues>}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <FileUploader
                  value={value}
                  onValueChange={onValueChange}
                  dropzoneOptions={dropZoneConfig}
                  className="relative bg-background rounded-lg cursor-no-drop">
                  <FileInput
                    {...field}
                    id="fileInput"
                    className={cn("bg-muted border-2 border-dashed pointer-events-auto", {
                      "opacity-70 cursor-not-allowed pointer-events-none": isToFollow,
                    })}>
                    <div className="flex items-center justify-center flex-col p-8 w-full">
                      <CloudUpload className="text-gray-500 w-10 h-10" />
                      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                    </div>
                  </FileInput>

                  <FileUploaderContent>
                    {value &&
                      value.length > 0 &&
                      value.map((file, i) => (
                        <FileUploaderItem
                          removeBtn={(onRemove) => (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onRemove();
                                removeSelectedFile();
                              }}
                              className="cursor-pointer p-1 rounded hover:bg-destructive/10 text-destructive">
                              <span className="sr-only">Remove {file.name}</span>
                              <Trash2 className="!h-5 !w-5" />
                            </button>
                          )}
                          key={i}
                          index={i}>
                          <DocumentPreviewDialog
                            source={file}
                            trigger={
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 truncate text-left hover:underline">
                                <Paperclip className="h-4 w-4 shrink-0 stroke-current" />
                                <span className="truncate">{file.name}</span>
                                <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              </button>
                            }
                          />
                        </FileUploaderItem>
                      ))}
                  </FileUploaderContent>
                </FileUploader>
              </FormControl>
              {value && value.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  These {value.length} files will be combined into one PDF, in the order shown above.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {value != null && value.length > 0 && (
        <Button disabled={isPending} onClick={uploadFile} className="gap-2 font-bold">
          {isPending ? (
            <>
              Uploading <DotPulse size="30" speed="1.3" color="white" />
            </>
          ) : (
            <>
              Upload file <Upload />
            </>
          )}
        </Button>
      )}

      {showToFollowSwitch && (
        <FormField
          control={form.control}
          name={"toFollowDocs" as Path<TFieldValues>}
          render={() => (
            <FormItem className="flex items-center justify-end gap-3 pt-2">
              <div className="flex items-center gap-2">
                <FormLabel>Document to follow</FormLabel>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-sm">
                      Enable this if you don't have the document ready now. You can submit it after enrollment is
                      complete.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormControl>
                <Switch checked={isToFollow} onCheckedChange={toggleToFollow} />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      <DocumentSubFields cfg={cfg} form={form} formState={formState} setUploadRequirements={setUploadRequirements} />

      {/* Announces status changes (uploaded/expired/missing) to assistive tech — the visible
          status text lives in the row outside this modal, so screen-reader users get the same
          information without needing sighted access to the color-coded badge. */}
      <span aria-live="polite" className="sr-only">
        {dialog.docDescription.status || dialog.docDescription.description}
      </span>
    </>
  );
}
