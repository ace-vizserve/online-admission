import { parentGuardianPassTypes, studentPassTypes } from "@/data";
import { ParentGuardianUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";

/**
 * Policy table for every document a parent uploads during enrollment. This replaces the
 * hand-written `{name === "motherPass" && (...)}` / `NOT_FILE_INPUTS` / `TO_FOLLOW_DOCS` /
 * `EXPIRING_DOCS` style constants that used to be re-declared (and drift) in each of the 10
 * duplicated `*-file-uploader-dialog.tsx` files across the 5 enrollment flows. One entry here
 * drives rendering for both the student and parent/guardian shapes, in both the desktop and
 * mobile layouts, for every flow.
 */

export type DocFieldKind = "plain" | "passType+expiry" | "passportNumber+expiry";

export type DocumentGroup = "student" | "parentGuardian";

export type PassTypeOption = { label: string; value: string };

export type DocumentConfig = {
  /** The RHF/schema field name — also the key used to read the uploaded URL out of the store. */
  name: string;
  /** Row + modal title, e.g. "Passport Copy". */
  label: string;
  group: DocumentGroup;
  /** react-dropzone `accept` map. */
  accept: Record<string, string[]>;
  /** Multiple pages get merged into a single PDF server-side — see `uploadFileToBucket`. */
  maxFiles: number;
  fieldKind: DocFieldKind;
  /** Short, document-specific instruction shown above the generic file-format hint in the modal
   * (e.g. "Upload scanned passport copy"). Previously authored per call site but silently dropped
   * — the `description` prop was destructured and threaded through, never rendered. */
  description?: string;
  passTypeOptions?: readonly PassTypeOption[];
  /** Exact copy for the pass-type/passport-number sub-fields' FormDescription. */
  passDescription?: string;
  passportNumberDescription?: string;
  numberPlaceholder?: string;
  /** Can the user toggle "Document to follow" (upload later) for this document. */
  toFollowEligible: boolean;
  /** Optional documents don't count toward the required-set and get their own status copy. */
  optional: boolean;
  /** Has an expiry date and can show Valid/Expired status (passports and passes). */
  expiring: boolean;
  /** Shows the "Download Medical Exam Form" external link above the uploader. */
  showMedicalExamLink?: boolean;
};

const PDF_ACCEPT = { "application/pdf": [".pdf"] };
const IMAGE_ACCEPT = { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] };

export const STUDENT_DOCUMENTS: DocumentConfig[] = [
  {
    name: "idPicture",
    label: "ID Picture",
    group: "student",
    accept: IMAGE_ACCEPT,
    maxFiles: 1,
    fieldKind: "plain",
    toFollowEligible: true,
    optional: false,
    expiring: false,
  },
  {
    name: "birthCert",
    label: "Birth Certificate",
    group: "student",
    accept: PDF_ACCEPT,
    maxFiles: 4,
    fieldKind: "plain",
    toFollowEligible: true,
    optional: false,
    expiring: false,
  },
  {
    name: "educCert",
    label: "Transcript of Records",
    group: "student",
    accept: PDF_ACCEPT,
    maxFiles: 4,
    fieldKind: "plain",
    toFollowEligible: false,
    optional: true,
    expiring: false,
  },
  {
    name: "medical",
    label: "Medical Examination",
    group: "student",
    accept: PDF_ACCEPT,
    maxFiles: 4,
    fieldKind: "plain",
    toFollowEligible: false,
    optional: true,
    expiring: false,
    showMedicalExamLink: true,
  },
  {
    name: "passport",
    label: "Passport Copy",
    group: "student",
    accept: PDF_ACCEPT,
    maxFiles: 4,
    fieldKind: "passportNumber+expiry",
    description: "Upload a scanned copy of the student's passport.",
    passportNumberDescription: "Student's passport number.",
    numberPlaceholder: "Enter your passport number",
    toFollowEligible: true,
    optional: false,
    expiring: true,
  },
  {
    name: "pass",
    label: "Singapore Pass",
    group: "student",
    accept: PDF_ACCEPT,
    maxFiles: 4,
    fieldKind: "passType+expiry",
    passTypeOptions: studentPassTypes,
    description: "Upload the type of Pass the student holds.",
    passDescription: "Your student's pass type.",
    toFollowEligible: true,
    optional: false,
    expiring: true,
  },
];

function parentGuardianDoc(prefix: "Mother" | "Father" | "Guardian", kind: "Pass" | "Passport"): DocumentConfig {
  const name = `${prefix.toLowerCase()}${kind}`;

  if (kind === "Pass") {
    return {
      name,
      label: "Singapore Pass",
      group: "parentGuardian",
      accept: PDF_ACCEPT,
      maxFiles: 4,
      fieldKind: "passType+expiry",
      passTypeOptions: parentGuardianPassTypes,
      description: `Upload the type of Pass the ${prefix.toLowerCase()} holds.`,
      passDescription: `${prefix} pass type.`,
      toFollowEligible: true,
      optional: false,
      expiring: true,
    };
  }

  return {
    name,
    label: "Passport Copy",
    group: "parentGuardian",
    accept: PDF_ACCEPT,
    maxFiles: 4,
    fieldKind: "passportNumber+expiry",
    description: "Upload scanned passport copy",
    passportNumberDescription: `${prefix} passport number.`,
    numberPlaceholder: "Enter passport number",
    toFollowEligible: true,
    optional: false,
    expiring: true,
  };
}

export const PARENT_GUARDIAN_DOCUMENTS: DocumentConfig[] = [
  parentGuardianDoc("Mother", "Passport"),
  parentGuardianDoc("Mother", "Pass"),
  parentGuardianDoc("Father", "Passport"),
  parentGuardianDoc("Father", "Pass"),
  parentGuardianDoc("Guardian", "Passport"),
  parentGuardianDoc("Guardian", "Pass"),
];

/** Derives the sibling field names (`${name}Type`/`${name}Number`/`${name}Expiry`) a document's
 * `fieldKind` implies, instead of scattering string concatenation through JSX. */
export function siblingFields(cfg: Pick<DocumentConfig, "name" | "fieldKind">): {
  type?: string;
  number?: string;
  expiry?: string;
} {
  if (cfg.fieldKind === "passType+expiry") {
    return { type: `${cfg.name}Type`, expiry: `${cfg.name}Expiry` };
  }
  if (cfg.fieldKind === "passportNumber+expiry") {
    return { number: `${cfg.name}Number`, expiry: `${cfg.name}Expiry` };
  }
  return {};
}

/** Every sibling field name any document config produces — replaces the old hand-written
 * `NOT_FILE_INPUTS` arrays (these fields are metadata, not file-upload fields, so they're
 * excluded when writing the uploaded file's URL back into the form). */
export function notFileInputFields(configs: DocumentConfig[]): string[] {
  return configs.flatMap((cfg) => Object.values(siblingFields(cfg)));
}

export type StudentUploadFieldName = keyof StudentUploadRequirementsSchema;
export type ParentGuardianUploadFieldName = keyof ParentGuardianUploadRequirementsSchema;
