import { ParentGuardianUploadRequirementsSchema, StudentUploadRequirementsSchema } from "@/zod-schema";
import { FieldValues } from "react-hook-form";

/**
 * The two upload-requirements schemas are already shared across all 5 enrollment flows
 * (`src/zod-schema.ts`) — only the surrounding per-flow `FormState` type differs (HFSE vs
 * VizSchool). This is the narrow slice the shared uploader actually needs, so it never has to
 * know which flow it's running in.
 */
export type UploadRequirementsSlice = {
  studentUploadRequirements: StudentUploadRequirementsSchema;
  parentGuardianUploadRequirements: ParentGuardianUploadRequirementsSchema;
};

export type SharedUploadFormState = {
  uploadRequirements?: Partial<UploadRequirementsSlice>;
};

/**
 * Every real `FormState.uploadRequirements` (across all 5 flows) requires BOTH sub-slices to be
 * present whenever the property itself is set — only the top-level `uploadRequirements` key is
 * optional (via each flow's `Partial<FlowFormState>`), not its two nested keys. So the shared
 * hook's writes must always supply both keys too (never omit one), which is exactly what
 * `updateUploadRequirementsSlice` does — it reads the CURRENT value of whichever slice isn't
 * being patched and spreads it through untouched, rather than letting the store's shallow merge
 * silently drop it.
 */
export type UploadRequirementsPatch = {
  studentUploadRequirements: Partial<StudentUploadRequirementsSchema>;
  parentGuardianUploadRequirements: Partial<ParentGuardianUploadRequirementsSchema>;
};

/**
 * Every flow's real `setFormState` (e.g. `(data: Partial<EnrolNewStudentFormState>) => void`)
 * already structurally satisfies this — `{ uploadRequirements: ... }` is assignable to
 * `Partial<EnrolNewStudentFormState>` since both sides use the exact same nested schema types.
 * No per-flow adapter needed; each flow passes its own `setFormState` straight through.
 */
export type SetUploadRequirementsFn = (data: { uploadRequirements: UploadRequirementsPatch }) => void;

/**
 * HFSE clears a removed/changed field with `""`; VizSchool's near-identical copy used
 * `undefined` for the same case — the one real behavioral difference the audit found between
 * the otherwise-identical flow copies. Preserved as an explicit prop instead of a silent
 * per-flow fork.
 */
export type ResetStrategy = "empty-string" | "undefined";

/**
 * The shared uploader is generic over the concrete form-values type (`StudentUploadRequirementsSchema`
 * for the student group, `ParentGuardianUploadRequirementsSchema` for the parent/guardian group) so
 * each call site keeps full type safety for its own field names — a single `<DocumentUploader>` never
 * mixes the two groups. `name` is kept as a plain `string` at the shared-component boundary (matching
 * the dynamic, config-driven field access this replaces — the original per-flow dialogs already
 * relied on `as`/`as unknown as` casts for the same reason).
 */
export type FieldValuesConstraint = FieldValues;
