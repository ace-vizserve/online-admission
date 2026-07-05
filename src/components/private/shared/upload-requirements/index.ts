export { DocumentUploader } from "./document-uploader";
export type { DocumentUploaderProps } from "./document-uploader";
export { STUDENT_DOCUMENTS, PARENT_GUARDIAN_DOCUMENTS, siblingFields, notFileInputFields } from "./document-config";
export type { DocumentConfig, DocFieldKind, DocumentGroup } from "./document-config";
export { useDocumentUploadDialog, updateUploadRequirementsSlice } from "./use-document-upload-dialog";
export {
  useCarriedParentGuardianDocuments,
  CARRIED_DOC_KEYS,
  hasCarriedDocFields,
  pickCarriedDocFields,
} from "./use-carried-parent-guardian-docs";
export type {
  UploadRequirementsSlice,
  UploadRequirementsPatch,
  SharedUploadFormState,
  SetUploadRequirementsFn,
  ResetStrategy,
} from "./types";
