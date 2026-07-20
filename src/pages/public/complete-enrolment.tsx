import { RecoverySection, RecoveryTokenState, getRecoveryToken, signRecoveryUpload, submitRecovery } from "@/actions/recovery";
import PageMetaData from "@/components/page-metadata";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/client";
import { cn } from "@/lib/utils";
import {
  campusDevelopmentFeePrimary,
  campusDevelopmentFeeSecondary,
  classLevels,
  medicalConditions,
  preferredPaymentMethod,
  preferredPaymentScheme,
  PRIMARY_CLASS_LEVELS,
  religions,
  SECONDARY_SDF_CLASS_LEVELS,
} from "@/data";
import { RecoveryFormInput, RecoveryFormOutput, recoveryFormSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CircleAlert, CircleCheck, Loader2, Send, TriangleAlert, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { Control, Controller, FieldValues, Path, Resolver, useFieldArray, useForm } from "react-hook-form";
import { useParams } from "react-router";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Standalone, zero-login "complete my application" form. Deliberately NOT built on the
 * authenticated wizard's leaf components (student-details.tsx etc.) — those call
 * `useSaveApplication` directly, which writes to a global draft store keyed by
 * `session.user.id` and navigates to `/admission/dashboard` on save. There's no session
 * here, so this reuses only the Zod schemas (for identical validation, see
 * `recoveryFormSchema` in zod-schema.ts) and a fresh, compact set of fields — see that
 * schema's comment for the scope this deliberately leaves out (VizSchool categories,
 * discounts, referrer, learning needs, PDF-merge uploads). The level↔classType↔schedule↔fee
 * business rules ARE ported (see classTypeOptionsForLevel/scheduleOptionsForLevel/
 * feeOptionsForLevel/contractSignatoryOptions below and the guard-rails in onSubmit),
 * mirroring src/pages/private/enrol-student/new/enrollment-information.tsx exactly. The
 * visual language (numbered stepper, plain uppercase FormLabels, no per-field Card boxing,
 * soft-tint Alert banner) mirrors that same wizard + new-student-steps.tsx, rather than the
 * more compact admin-tool style used elsewhere in this app — this page is parent-facing.
 */

/** DB dates arrive over JSON as ISO strings — revive any `*Day`/`*Expiry` key back into a
 * real `Date` before handing existingData to `form.reset()` (the DateField component checks
 * `instanceof Date`). */
function reviveDates<T>(value: T): T {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(reviveDates) as unknown as T;
  if (typeof value === "object" && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] =
        typeof v === "string" && (key.endsWith("Day") || key.endsWith("Expiry")) && /^\d{4}-\d{2}-\d{2}/.test(v)
          ? new Date(v)
          : reviveDates(v);
    }
    return result as T;
  }
  return value;
}

const SECTION_ORDER: RecoverySection[] = ["studentInfo", "familyInfo", "enrollmentInfo", "uploads"];
const SECTION_LABEL: Record<RecoverySection, string> = {
  studentInfo: "Student Info",
  familyInfo: "Family Info",
  enrollmentInfo: "Enrollment",
  uploads: "Documents",
};

// Class-level → classType/schedule/fee business rules, ported verbatim from the authenticated
// wizard's enrollment-info step (src/pages/private/enrol-student/new/enrollment-information.tsx)
// so a level applied here maps to the exact same allowed class types, schedules, and fees.
const MORNING_AFTERNOON_CLASS_LEVEL = [
  "YoungStarter Little Star",
  "YoungStarter Junior Star",
  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",
  "Secondary One",
  "Secondary Two",
  "Secondary Three",
  "Secondary Four",
  "HFSE International Education Programme – Year 1 (equivalent to K2)",
  "HFSE International Education Programme – Year 2 (equivalent to Primary One)",
];
const WHOLE_DAY_CLASS_LEVEL = [
  "HFSE International Education Programme – Year 8",
  "HFSE International Education Programme – Year 9",
  "HFSE International Education Programme – Year 10",
];
const ENRICHMENT_CLASS_LEVELS = ["YoungStarter Little Star", "YoungStarter Junior Star"];
const CAMBRIDGE_YEAR_1_LEVELS = ["HFSE International Education Programme – Year 1 (equivalent to K2)"];
const CAMBRIDGE_YEAR_2_LEVELS = ["HFSE International Education Programme – Year 2 (equivalent to Primary One)"];
const CAMBRIDGE_SECONDARY_LEVELS = [
  "HFSE International Education Programme – Year 8",
  "HFSE International Education Programme – Year 9",
  "HFSE International Education Programme – Year 10",
];
const CAMBRIDGE_YEAR_2_CLASS_TYPES = [
  "Global Class-Cambridge (ENGLISH+FILIPINO)",
  "Global Class-Cambridge (ENGLISH+MANDARIN)",
  "Global Class-Cambridge (ENGLISH+FRENCH)",
];
const GLOBAL_LANGUAGE_LEVELS = ["Primary Two", "Primary Three", "Primary Four", "Primary Five", "Primary Six"];
const STANDARD_CLASS_LEVELS = [
  "Primary One",
  "Primary Two",
  "Primary Three",
  "Primary Four",
  "Primary Five",
  "Primary Six",
  "Secondary One",
  "Secondary Two",
  "Secondary Three",
  "Secondary Four",
];

export function classTypeOptionsForLevel(level: string): { label: string; value: string }[] {
  if (ENRICHMENT_CLASS_LEVELS.includes(level)) return [{ label: "Enrichment Class", value: "Enrichment Class" }];
  if (CAMBRIDGE_YEAR_2_LEVELS.includes(level)) {
    return CAMBRIDGE_YEAR_2_CLASS_TYPES.map((type) => ({ label: type, value: type }));
  }
  if (CAMBRIDGE_YEAR_1_LEVELS.includes(level)) {
    return [{ label: "Global Class-Cambridge", value: "Global Class-Cambridge" }];
  }
  if (CAMBRIDGE_SECONDARY_LEVELS.includes(level)) {
    return [{ label: "Global Class (CAMBRIDGE)", value: "Global Class (CAMBRIDGE)" }];
  }
  if (STANDARD_CLASS_LEVELS.includes(level)) {
    const options = [
      { label: "Standard Class (ENGLISH + TAGALOG)", value: "Standard Class (ENGLISH + TAGALOG)" },
    ];
    if (GLOBAL_LANGUAGE_LEVELS.includes(level)) {
      options.push(
        { label: "GLOBAL (ENGLISH + MANDARIN)", value: "GLOBAL (ENGLISH + MANDARIN)" },
        { label: "GLOBAL (ENGLISH + FRENCH)", value: "GLOBAL (ENGLISH + FRENCH)" },
        { label: "GLOBAL (ENGLISH + TAMIL)", value: "GLOBAL (ENGLISH + TAMIL)" },
      );
    }
    return options;
  }
  return [];
}

export function scheduleOptionsForLevel(level: string): string[] {
  if (WHOLE_DAY_CLASS_LEVEL.includes(level)) return ["Whole Day"];
  if (MORNING_AFTERNOON_CLASS_LEVEL.includes(level)) return ["Morning", "Afternoon"];
  return [];
}

export function feeOptionsForLevel(level: string): { label: string; value: string }[] {
  if (PRIMARY_CLASS_LEVELS.includes(level)) return [...campusDevelopmentFeePrimary];
  if (SECONDARY_SDF_CLASS_LEVELS.includes(level)) return [...campusDevelopmentFeeSecondary];
  return [{ label: "Not Applicable", value: "Not Applicable" }];
}

const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];
const STUDENT_CARE_PROGRAMS = ["Full day", "Daily"];
// Mirrors the original wizard's contract-signatory options exactly — Mother always,
// Father only when father info is actually provided; there's no Guardian option upstream.
export function contractSignatoryOptions(hasFatherInfo: boolean): { label: string; value: string }[] {
  return hasFatherInfo
    ? [
        { label: "Father", value: "Father" },
        { label: "Mother", value: "Mother" },
      ]
    : [{ label: "Mother", value: "Mother" }];
}
const STUDENT_TO_FOLLOW_LIMIT = 3;
const PARENT_TO_FOLLOW_LIMIT = 2;

const DEFAULT_VALUES: RecoveryFormInput = {
  studentInfo: {
    studentDetails: {
      firstName: "",
      middleName: "",
      lastName: "",
      preferredName: "",
      birthDay: undefined as unknown as Date,
      gender: "",
      primaryLanguage: "",
      religion: "",
      religionOther: "",
      nric: "",
      dietaryRestrictions: "",
    },
    addressContact: {
      homeAddress: "",
      postalCode: "",
      nationality: "",
      homePhone: "",
      contactPerson: "",
      contactPersonNumber: "",
      livingWithWhom: "",
      parentMaritalStatus: "",
    },
    medicalInformation: {
      medicalChecklist: {
        allergies: false,
        asthma: false,
        heartConditions: false,
        epilepsy: false,
        diabetes: false,
        eczema: false,
        foodAllergies: false,
        other: false,
        none: false,
        allergyDetails: "",
        foodAllergyDetails: "",
        otherMedicalConditions: "",
      },
      paracetamolConsent: false,
    },
  },
  familyInfo: {
    motherInfo: {
      motherFirstName: "",
      motherMiddleName: "",
      motherLastName: "",
      motherPreferredName: "",
      motherBirthDay: undefined as unknown as Date,
      motherNationality: "",
      motherReligion: "",
      motherNric: "",
      motherMobile: "",
      motherEmail: "",
      motherCompanyName: "",
      motherPosition: "",
    },
    fatherInfo: {
      noFatherInfo: false,
      fatherFirstName: "",
      fatherMiddleName: "",
      fatherLastName: "",
      fatherPreferredName: "",
      fatherBirthDay: undefined,
      fatherNationality: "",
      fatherReligion: "",
      fatherNric: "",
      fatherMobile: "",
      fatherEmail: "",
      fatherCompanyName: "",
      fatherPosition: "",
    },
    guardianInfo: {
      noGuardianInfo: true,
      guardianFirstName: "",
      guardianMiddleName: "",
      guardianLastName: "",
      guardianPreferredName: "",
      guardianBirthDay: undefined,
      guardianNationality: "",
      guardianReligion: "",
      guardianNric: "",
      guardianMobile: "",
      guardianEmail: "",
      guardianCompanyName: "",
      guardianPosition: "",
    },
    siblingsInfo: { siblings: [] },
  },
  enrollmentInfo: {
    levelApplied: "",
    classType: "",
    preferredSchedule: "",
    availSchoolBus: "",
    availStudentCare: "",
    studentCareProgram: "",
    paymentOption: "",
    contractSignatory: "",
    socialMediaConsent: false,
    preferredPaymentScheme: "",
    preferredPaymentMethod: "",
  },
  uploadRequirements: {
    studentUploadRequirements: { toFollowDocs: [] },
    parentGuardianUploadRequirements: { toFollowDocs: [], hasFatherInfo: false, hasGuardianInfo: false },
  },
};

const CAPTION_LABEL = "text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground";

// ── generic field helpers ──────────────────────────────────────────────────────────────────
// FormLabel deliberately renders with no className override — the base component
// (components/ui/form.tsx) already styles it "text-xs font-bold uppercase tracking-wider
// text-slate-500", identical to every field label across the authenticated wizard.

function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} value={(field.value as string) ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DateField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const rawValue = field.value as unknown;
        const value = rawValue instanceof Date && !isNaN(rawValue.getTime()) ? rawValue : null;
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={value ? value.toISOString().slice(0, 10) : ""}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select…",
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
}) {
  const normalized = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={(field.value as string) ?? ""}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {normalized.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Inline radio pair — used for genuine binary choices (gender, yes/no questions) instead of
 * a two-item Select, which reads better as a tappable pair on mobile. */
function RadioField<T extends FieldValues>({
  control,
  name,
  label,
  options,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: { label: string; value: string }[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={(field.value as string) ?? ""}
              className="flex flex-row flex-wrap gap-x-5 gap-y-2 pt-1">
              {options.map((o) => (
                <FormItem key={o.value} className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value={o.value} />
                  </FormControl>
                  <FormLabel className="text-sm font-medium normal-case tracking-normal text-foreground">
                    {o.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Same as RadioField, but for a genuinely boolean (not string) schema field. */
function BooleanRadioField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value) => field.onChange(value === "true")}
              value={field.value === true ? "true" : field.value === false ? "false" : ""}
              className="flex flex-row flex-wrap gap-x-5 gap-y-2 pt-1">
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="true" />
                </FormControl>
                <FormLabel className="text-sm font-medium normal-case tracking-normal text-foreground">Yes</FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <RadioGroupItem value="false" />
                </FormControl>
                <FormLabel className="text-sm font-medium normal-case tracking-normal text-foreground">No</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="text-sm font-medium normal-case tracking-normal text-foreground">{label}</FormLabel>
        </FormItem>
      )}
    />
  );
}

// ── file uploads (signed URL — no session available) ──────────────────────────────────────

function useRecoveryUpload(token: string) {
  async function upload(field: string, file: File): Promise<string> {
    const signed = await signRecoveryUpload(token, field, file.name);
    const { error } = await supabase.storage.from("parent-portal").uploadToSignedUrl(signed.path, signed.token, file);
    if (error) throw new Error(error.message);
    return signed.publicUrl;
  }

  return { upload };
}

function FileUploadField<T extends FieldValues>({
  control,
  name,
  label,
  field,
  toFollowName,
  toFollowLimit,
  toFollowCount,
  onUpload,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  field: string;
  toFollowName: Path<T>;
  toFollowLimit: number;
  toFollowCount: number;
  onUpload: (field: string, file: File) => Promise<string>;
}) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: rhfField, fieldState }) => (
        <Controller
          control={control}
          name={toFollowName}
          render={({ field: toFollowField }) => {
            const skipped: string[] = (toFollowField.value as string[] | undefined) ?? [];
            const isSkipped = skipped.includes(field);

            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className={CAPTION_LABEL}>{label}</p>
                  {rhfField.value ? (
                    <Badge variant="outline" className="text-primary border-primary/30">
                      <CircleCheck className="h-3 w-3" />
                      Uploaded
                    </Badge>
                  ) : isSkipped ? (
                    <Badge variant="secondary">To follow</Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {rhfField.value ? (
                    <a
                      href={rhfField.value as string}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary underline truncate flex-1">
                      View uploaded file
                    </a>
                  ) : (
                    <label className="flex flex-1 items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-muted/40 has-disabled:cursor-not-allowed has-disabled:opacity-50">
                      <UploadCloud className="h-3.5 w-3.5 shrink-0" />
                      {isUploading ? "Uploading…" : "Choose file"}
                      <input
                        type="file"
                        className="hidden"
                        disabled={isSkipped || isUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const url = await onUpload(field, file);
                            rhfField.onChange(url);
                          } catch (err) {
                            toast.error((err as Error).message);
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground shrink-0">
                    <Checkbox
                      checked={isSkipped}
                      disabled={!isSkipped && toFollowCount >= toFollowLimit}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          toFollowField.onChange([...skipped, field]);
                          rhfField.onChange(undefined);
                        } else {
                          toFollowField.onChange(skipped.filter((k) => k !== field));
                        }
                      }}
                    />
                    To follow
                  </label>
                </div>
                {fieldState.error && <p className="text-xs font-medium text-destructive">{fieldState.error.message}</p>}
              </div>
            );
          }}
        />
      )}
    />
  );
}

// ── stepper (mirrors src/components/private/enrol-student/new-student-steps.tsx) ───────────

function RecoveryStepper({
  sections,
  activeSection,
  onSelect,
  sectionHasError,
}: {
  sections: RecoverySection[];
  activeSection: RecoverySection;
  onSelect: (section: RecoverySection) => void;
  sectionHasError: Record<RecoverySection, boolean>;
}) {
  return (
    <nav className="w-full bg-white">
      <ol className="flex flex-col sm:flex-row max-w-screen mx-auto">
        {sections.map((section, index) => {
          const isCurrent = section === activeSection;
          const isInvalid = sectionHasError[section];

          return (
            <li
              key={section}
              onClick={() => onSelect(section)}
              className="relative flex-1 group cursor-pointer transition-all duration-300">
              <div className="flex items-center sm:flex-col sm:text-center px-4 py-4 gap-3 sm:gap-2">
                <div
                  className={cn(
                    "size-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black transition-all",
                    isCurrent
                      ? "bg-primary text-white ring-4 ring-slate-100"
                      : isInvalid
                        ? "bg-destructive text-white"
                        : "bg-slate-100 text-slate-400",
                  )}>
                  {isInvalid ? <AlertCircle size={14} strokeWidth={3} /> : index + 1}
                </div>
                <p
                  className={cn(
                    "text-xs font-black uppercase tracking-tight transition-colors",
                    isCurrent ? "text-primary" : isInvalid ? "text-destructive" : "text-slate-400",
                  )}>
                  {SECTION_LABEL[section]}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-transparent px-2">
                <div
                  className={cn(
                    "h-full w-full rounded-t-full transition-all duration-500",
                    isCurrent ? "bg-primary" : isInvalid ? "bg-destructive" : "bg-slate-100",
                  )}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── page ────────────────────────────────────────────────────────────────────────────────────

type ResolvedTokenState = Exclude<RecoveryTokenState, { complete: true }>;

export default function CompleteEnrolment() {
  const { token } = useParams<{ token: string }>();

  const {
    data: tokenState,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recovery-token", token],
    queryFn: () => getRecoveryToken(token!),
    enabled: Boolean(token),
    retry: false,
  });

  const [submitted, setSubmitted] = useState(false);

  if (!token) return <StatusScreen title="Invalid link" description="No recovery token was provided." />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <StatusScreen title="This link is no longer valid" description={(error as Error).message} />;
  }

  if (tokenState && "complete" in tokenState && tokenState.complete) {
    return (
      <StatusScreen
        title="Already complete"
        description="This application record is already complete — there's nothing left to fill in."
        success
      />
    );
  }

  if (submitted) {
    return (
      <StatusScreen
        title="Application received"
        description="Thank you — the record has been completed. You may close this page."
        success
      />
    );
  }

  if (!tokenState || "complete" in tokenState) return null;

  return <RecoveryForm token={token} tokenState={tokenState} onSubmitted={() => setSubmitted(true)} />;
}

/**
 * Mounted only once `tokenState` is resolved, so the resolver/defaultValues are built
 * correctly from the start (react-hook-form doesn't cleanly support swapping its resolver
 * after the form is created) — a fresh mount per token load is simpler than reactively
 * reconfiguring an existing form instance.
 */
function RecoveryForm({
  token,
  tokenState,
  onSubmitted,
}: {
  token: string;
  tokenState: ResolvedTokenState;
  onSubmitted: () => void;
}) {
  const { upload } = useRecoveryUpload(token);
  const sections = useMemo(() => new Set<RecoverySection>(tokenState.sections), [tokenState.sections]);
  const sectionList = useMemo(() => SECTION_ORDER.filter((s) => sections.has(s)), [sections]);
  const [activeTab, setActiveTab] = useState<RecoverySection>(sectionList[0]);

  // Tabs the admin didn't select are still submitted (as whatever they were prefilled with —
  // untouched, already-correct data), just not validated/rendered — see the "sections must be
  // ALL_SECTIONS when applications doesn't exist" guard in the edge function's `generate`
  // action, which guarantees a hidden tab always has real prefilled data to fall back on.
  const schema = useMemo(
    () =>
      z.object({
        studentInfo: sections.has("studentInfo") ? recoveryFormSchema.shape.studentInfo : z.any(),
        familyInfo: sections.has("familyInfo") ? recoveryFormSchema.shape.familyInfo : z.any(),
        enrollmentInfo: sections.has("enrollmentInfo") ? recoveryFormSchema.shape.enrollmentInfo : z.any(),
        uploadRequirements: sections.has("uploads") ? recoveryFormSchema.shape.uploadRequirements : z.any(),
      }),
    [sections],
  );

  const form = useForm<RecoveryFormInput, unknown, RecoveryFormOutput>({
    // The runtime schema is intentionally relaxed per hidden section (z.any()), but its
    // static type collapses those keys to optional — cast back to the full type, which is
    // still accurate for defaultValues/onSubmit since a hidden section always carries real
    // prefilled data (see the comment above), never an actually-missing value.
    resolver: zodResolver(schema) as unknown as Resolver<RecoveryFormInput, unknown, RecoveryFormOutput>,
    defaultValues: tokenState.existingData ? reviveDates(tokenState.existingData) : DEFAULT_VALUES,
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (values: RecoveryFormOutput) => submitRecovery(token, values),
    onSuccess: onSubmitted,
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(values: RecoveryFormOutput) {
    // Cross-field enrollment business rules — ported verbatim from the wizard's onSubmit
    // (enrollment-information.tsx). The dynamic option lists below already steer the parent
    // toward a valid combination, but a stale value from a level change (or prefilled data
    // that predates a rule) can still slip through, so this is the same safety net the
    // authenticated flow relies on.
    if (sections.has("enrollmentInfo")) {
      const { levelApplied, classType, preferredSchedule, paymentOption } = values.enrollmentInfo;

      if (levelApplied.includes("YoungStarter") && paymentOption !== "Not Applicable") {
        toast.warning("Invalid Student Development Fee!", { description: "Kindly select the option 'Not Applicable'." });
        form.setError("enrollmentInfo.paymentOption", { message: "Please select 'Not Applicable'." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (
        PRIMARY_CLASS_LEVELS.includes(levelApplied) &&
        !campusDevelopmentFeePrimary.some((fee) => fee.value === paymentOption)
      ) {
        toast.warning("Invalid Student Development Fee!", {
          description: "Kindly select the correct Student Development Fee.",
        });
        form.setError("enrollmentInfo.paymentOption", { message: "Please select the correct Student Development Fee." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (
        SECONDARY_SDF_CLASS_LEVELS.includes(levelApplied) &&
        !campusDevelopmentFeeSecondary.some((fee) => fee.value === paymentOption)
      ) {
        toast.warning("Invalid Student Development Fee!", {
          description: "Kindly select the correct Student Development Fee.",
        });
        form.setError("enrollmentInfo.paymentOption", { message: "Please select the correct Student Development Fee." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (WHOLE_DAY_CLASS_LEVEL.includes(levelApplied) && preferredSchedule !== "Whole Day") {
        toast.warning("Schedule mismatch!", {
          description: "Only 'Whole Day' schedule is available for the selected grade level.",
        });
        form.setError("enrollmentInfo.preferredSchedule", { message: "Please select your preferred schedule." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (MORNING_AFTERNOON_CLASS_LEVEL.includes(levelApplied) && preferredSchedule === "Whole Day") {
        toast.warning("Schedule not available!", { description: "'Whole Day' is only available for secondary students." });
        form.setError("enrollmentInfo.preferredSchedule", { message: "Please select your preferred schedule." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (CAMBRIDGE_YEAR_2_LEVELS.includes(levelApplied) && !CAMBRIDGE_YEAR_2_CLASS_TYPES.includes(classType)) {
        toast.warning("Class type mismatch!", {
          description: "Please select a 'Global Class-Cambridge' language track for this level.",
        });
        form.setError("enrollmentInfo.classType", { message: "Please select a 'Global Class-Cambridge' language track." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (CAMBRIDGE_YEAR_1_LEVELS.includes(levelApplied) && classType !== "Global Class-Cambridge") {
        toast.warning("Class type mismatch!", { description: "Only 'Global Class-Cambridge' is available for this level." });
        form.setError("enrollmentInfo.classType", { message: "Please select 'Global Class-Cambridge'." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (CAMBRIDGE_SECONDARY_LEVELS.includes(levelApplied) && classType !== "Global Class (CAMBRIDGE)") {
        toast.warning("Class type mismatch!", { description: "Only 'Global Class (CAMBRIDGE)' is available for this level." });
        form.setError("enrollmentInfo.classType", { message: "Please select 'Global Class (CAMBRIDGE)'." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (
        STANDARD_CLASS_LEVELS.includes(levelApplied) &&
        classType !== "Standard Class (ENGLISH + TAGALOG)" &&
        !(
          GLOBAL_LANGUAGE_LEVELS.includes(levelApplied) &&
          ["GLOBAL (ENGLISH + MANDARIN)", "GLOBAL (ENGLISH + FRENCH)", "GLOBAL (ENGLISH + TAMIL)"].includes(classType)
        )
      ) {
        toast.warning("Class type mismatch!", { description: "Please select a valid class type for this grade level." });
        form.setError("enrollmentInfo.classType", { message: "Please select a valid class type for this grade level." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (ENRICHMENT_CLASS_LEVELS.includes(levelApplied) && classType !== "Enrichment Class") {
        toast.warning("Class type mismatch!", { description: "Only 'Enrichment Class' is available for this level." });
        form.setError("enrollmentInfo.classType", { message: "Please select 'Enrichment Class' for this level." });
        setActiveTab("enrollmentInfo");
        return;
      }
      if (!ENRICHMENT_CLASS_LEVELS.includes(levelApplied) && classType === "Enrichment Class") {
        toast.warning("Class type mismatch!", { description: "'Enrichment Class' is not available for this grade level." });
        form.setError("enrollmentInfo.classType", { message: "Please select a valid class type for this grade level." });
        setActiveTab("enrollmentInfo");
        return;
      }
    }

    const payload: RecoveryFormOutput = {
      ...values,
      uploadRequirements: {
        ...values.uploadRequirements,
        parentGuardianUploadRequirements: {
          ...values.uploadRequirements.parentGuardianUploadRequirements,
          hasFatherInfo: !values.familyInfo.fatherInfo.noFatherInfo,
          hasGuardianInfo: !values.familyInfo.guardianInfo.noGuardianInfo,
        },
      },
    };
    submit(payload);
  }

  function onInvalid() {
    // Jump the parent to the first tab that actually has an error — otherwise a failed
    // submit on a hidden tab looks like nothing happened.
    const errorKeys = Object.keys(form.formState.errors);
    const sectionKey: Record<string, RecoverySection> = {
      studentInfo: "studentInfo",
      familyInfo: "familyInfo",
      enrollmentInfo: "enrollmentInfo",
      uploadRequirements: "uploads",
    };
    const firstErrorSection = errorKeys.map((k) => sectionKey[k]).find((s) => s && sections.has(s));
    if (firstErrorSection) setActiveTab(firstErrorSection);
    toast.error("Please fix the highlighted fields before submitting.");
  }

  const { fields: siblingFields, append: appendSibling, remove: removeSibling } = useFieldArray({
    control: form.control,
    name: "familyInfo.siblingsInfo.siblings",
  });

  const studentToFollow = form.watch("uploadRequirements.studentUploadRequirements.toFollowDocs") ?? [];
  const parentToFollow = form.watch("uploadRequirements.parentGuardianUploadRequirements.toFollowDocs") ?? [];
  const medicalChecklist = form.watch("studentInfo.medicalInformation.medicalChecklist");
  const religion = form.watch("studentInfo.studentDetails.religion");
  const levelApplied = form.watch("enrollmentInfo.levelApplied");
  const availStudentCare = form.watch("enrollmentInfo.availStudentCare");
  const noFatherInfo = form.watch("familyInfo.fatherInfo.noFatherInfo");
  const noGuardianInfo = form.watch("familyInfo.guardianInfo.noGuardianInfo");

  const sectionHasError: Record<RecoverySection, boolean> = {
    studentInfo: Boolean(form.formState.errors.studentInfo),
    familyInfo: Boolean(form.formState.errors.familyInfo),
    enrollmentInfo: Boolean(form.formState.errors.enrollmentInfo),
    uploads: Boolean(form.formState.errors.uploadRequirements),
  };

  return (
    <>
      <PageMetaData title="Complete Enrolment" description="Complete a partial enrolment application." />
      <div className="min-h-screen w-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-12">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {tokenState.enroleeNumber} · {tokenState.category}
            </p>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary">
              Complete {tokenState.studentName ?? "the"} application
            </h1>
          </div>

          <Alert className="bg-amber-500/10 border-none w-full md:w-max md:max-w-[520px] mx-auto mb-8">
            <CircleAlert className="h-4 w-4 !text-amber-600" />
            <div className="space-y-1 text-pretty">
              <AlertTitle className="text-xs text-amber-700 font-bold">A few things are missing</AlertTitle>
              <span className="text-xs text-amber-900">
                Fill in the tab{sectionList.length > 1 ? "s" : ""} below to complete the record:{" "}
                {sectionList.map((s) => SECTION_LABEL[s]).join(", ")}.
              </span>
            </div>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8 max-w-5xl mx-auto">
              <div className="w-full overflow-x-auto">
                <RecoveryStepper
                  sections={sectionList}
                  activeSection={activeTab}
                  onSelect={setActiveTab}
                  sectionHasError={sectionHasError}
                />
              </div>

              <Tabs value={activeTab}>
                {sections.has("studentInfo") && (
                  <TabsContent value="studentInfo" className="space-y-10 pt-2">
                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Student details</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
                        <TextField control={form.control} name="studentInfo.studentDetails.firstName" label="First name" />
                        <TextField control={form.control} name="studentInfo.studentDetails.lastName" label="Last name" />
                        <TextField
                          control={form.control}
                          name="studentInfo.studentDetails.middleName"
                          label="Middle name"
                        />
                        <TextField
                          control={form.control}
                          name="studentInfo.studentDetails.preferredName"
                          label="Preferred name"
                        />
                        <DateField control={form.control} name="studentInfo.studentDetails.birthDay" label="Birth date" />
                        <RadioField
                          control={form.control}
                          name="studentInfo.studentDetails.gender"
                          label="Gender"
                          options={[
                            { label: "Male", value: "Male" },
                            { label: "Female", value: "Female" },
                          ]}
                        />
                        <TextField
                          control={form.control}
                          name="studentInfo.studentDetails.primaryLanguage"
                          label="Primary language"
                        />
                        <SelectField
                          control={form.control}
                          name="studentInfo.studentDetails.religion"
                          label="Religion"
                          options={religions as unknown as { label: string; value: string }[]}
                        />
                        {religion === "Other" && (
                          <TextField
                            control={form.control}
                            name="studentInfo.studentDetails.religionOther"
                            label="Please specify religion"
                          />
                        )}
                        <TextField control={form.control} name="studentInfo.studentDetails.nric" label="NRIC / FIN" />
                        <TextField
                          control={form.control}
                          name="studentInfo.studentDetails.dietaryRestrictions"
                          label="Dietary restrictions"
                        />
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
                        <TextField
                          control={form.control}
                          name="studentInfo.addressContact.homeAddress"
                          label="Home address"
                        />
                        <TextField control={form.control} name="studentInfo.addressContact.postalCode" label="Postal code" />
                        <TextField
                          control={form.control}
                          name="studentInfo.addressContact.nationality"
                          label="Nationality"
                        />
                        <TextField control={form.control} name="studentInfo.addressContact.homePhone" label="Home phone" />
                        <TextField
                          control={form.control}
                          name="studentInfo.addressContact.contactPerson"
                          label="Contact person"
                        />
                        <TextField
                          control={form.control}
                          name="studentInfo.addressContact.contactPersonNumber"
                          label="Contact person's number"
                        />
                        <TextField
                          control={form.control}
                          name="studentInfo.addressContact.livingWithWhom"
                          label="Living with whom"
                        />
                        <SelectField
                          control={form.control}
                          name="studentInfo.addressContact.parentMaritalStatus"
                          label="Parents' marital status"
                          options={["Single", "Married", "Separated", "Divorced", "Widowed"]}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Medical information</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {medicalConditions.map((condition) => (
                          <CheckboxField
                            key={condition.id}
                            control={form.control}
                            name={
                              `studentInfo.medicalInformation.medicalChecklist.${condition.id}` as Path<RecoveryFormInput>
                            }
                            label={condition.label}
                          />
                        ))}
                      </div>
                      {medicalChecklist?.allergies && (
                        <TextField
                          control={form.control}
                          name="studentInfo.medicalInformation.medicalChecklist.allergyDetails"
                          label="Allergy details"
                        />
                      )}
                      {medicalChecklist?.foodAllergies && (
                        <TextField
                          control={form.control}
                          name="studentInfo.medicalInformation.medicalChecklist.foodAllergyDetails"
                          label="Food allergy details"
                        />
                      )}
                      {medicalChecklist?.other && (
                        <TextField
                          control={form.control}
                          name="studentInfo.medicalInformation.medicalChecklist.otherMedicalConditions"
                          label="Please describe"
                        />
                      )}
                      <BooleanRadioField
                        control={form.control}
                        name="studentInfo.medicalInformation.paracetamolConsent"
                        label="Consent to paracetamol administration if needed"
                      />
                    </div>
                  </TabsContent>
                )}

                {sections.has("familyInfo") && (
                  <TabsContent value="familyInfo" className="space-y-10 pt-2">
                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Mother's information</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                        <TextField
                          control={form.control}
                          name="familyInfo.motherInfo.motherFirstName"
                          label="First name"
                        />
                        <TextField control={form.control} name="familyInfo.motherInfo.motherLastName" label="Last name" />
                        <TextField
                          control={form.control}
                          name="familyInfo.motherInfo.motherMiddleName"
                          label="Middle name"
                        />
                        <TextField
                          control={form.control}
                          name="familyInfo.motherInfo.motherPreferredName"
                          label="Preferred name"
                        />
                        <DateField control={form.control} name="familyInfo.motherInfo.motherBirthDay" label="Birth date" />
                        <TextField
                          control={form.control}
                          name="familyInfo.motherInfo.motherNationality"
                          label="Nationality"
                        />
                        <SelectField
                          control={form.control}
                          name="familyInfo.motherInfo.motherReligion"
                          label="Religion"
                          options={religions as unknown as { label: string; value: string }[]}
                        />
                        <TextField control={form.control} name="familyInfo.motherInfo.motherNric" label="NRIC / FIN" />
                        <TextField control={form.control} name="familyInfo.motherInfo.motherMobile" label="Mobile" />
                        <TextField control={form.control} name="familyInfo.motherInfo.motherEmail" label="Email" />
                        <TextField
                          control={form.control}
                          name="familyInfo.motherInfo.motherCompanyName"
                          label="Company name"
                        />
                        <TextField control={form.control} name="familyInfo.motherInfo.motherPosition" label="Position" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Father's information</h2>
                      <CheckboxField
                        control={form.control}
                        name="familyInfo.fatherInfo.noFatherInfo"
                        label="No father information to provide"
                      />
                      {!noFatherInfo && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherFirstName"
                            label="First name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherLastName"
                            label="Last name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherMiddleName"
                            label="Middle name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherPreferredName"
                            label="Preferred name"
                          />
                          <DateField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherBirthDay"
                            label="Birth date"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherNationality"
                            label="Nationality"
                          />
                          <SelectField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherReligion"
                            label="Religion"
                            options={religions as unknown as { label: string; value: string }[]}
                          />
                          <TextField control={form.control} name="familyInfo.fatherInfo.fatherNric" label="NRIC / FIN" />
                          <TextField control={form.control} name="familyInfo.fatherInfo.fatherMobile" label="Mobile" />
                          <TextField control={form.control} name="familyInfo.fatherInfo.fatherEmail" label="Email" />
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherCompanyName"
                            label="Company name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.fatherInfo.fatherPosition"
                            label="Position"
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Guardian's information</h2>
                      <CheckboxField
                        control={form.control}
                        name="familyInfo.guardianInfo.noGuardianInfo"
                        label="No guardian information to provide"
                      />
                      {!noGuardianInfo && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianFirstName"
                            label="First name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianLastName"
                            label="Last name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianMiddleName"
                            label="Middle name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianPreferredName"
                            label="Preferred name"
                          />
                          <DateField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianBirthDay"
                            label="Birth date"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianNationality"
                            label="Nationality"
                          />
                          <SelectField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianReligion"
                            label="Religion"
                            options={religions as unknown as { label: string; value: string }[]}
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianNric"
                            label="NRIC / FIN"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianMobile"
                            label="Mobile"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianEmail"
                            label="Email"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianCompanyName"
                            label="Company name"
                          />
                          <TextField
                            control={form.control}
                            name="familyInfo.guardianInfo.guardianPosition"
                            label="Position"
                          />
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black tracking-tight text-foreground">Siblings</h2>
                        {siblingFields.length < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="font-bold"
                            onClick={() =>
                              appendSibling({
                                siblingFullName: "",
                                siblingBirthDay: undefined as unknown as Date,
                                siblingReligion: "",
                                siblingSchoolCompany: "",
                                siblingEducationOccupation: "",
                              })
                            }>
                            Add sibling
                          </Button>
                        )}
                      </div>
                      {siblingFields.map((sibling, index) => (
                        <div key={sibling.id} className="rounded-xl border border-border bg-slate-50 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                              Sibling {index + 1}
                            </p>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeSibling(index)}>
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                            <TextField
                              control={form.control}
                              name={`familyInfo.siblingsInfo.siblings.${index}.siblingFullName`}
                              label="Full name"
                            />
                            <DateField
                              control={form.control}
                              name={`familyInfo.siblingsInfo.siblings.${index}.siblingBirthDay`}
                              label="Birth date"
                            />
                            <SelectField
                              control={form.control}
                              name={`familyInfo.siblingsInfo.siblings.${index}.siblingReligion`}
                              label="Religion"
                              options={religions as unknown as { label: string; value: string }[]}
                            />
                            <TextField
                              control={form.control}
                              name={`familyInfo.siblingsInfo.siblings.${index}.siblingSchoolCompany`}
                              label="School / company"
                            />
                            <TextField
                              control={form.control}
                              name={`familyInfo.siblingsInfo.siblings.${index}.siblingEducationOccupation`}
                              label="Level / position"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {sections.has("enrollmentInfo") && (
                  <TabsContent value="enrollmentInfo" className="space-y-8 pt-2">
                    <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-4 lg:gap-6 w-full">
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.levelApplied"
                        label="Class level"
                        options={classLevels as unknown as { label: string; value: string }[]}
                      />
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.classType"
                        label="Class type"
                        options={classTypeOptionsForLevel(levelApplied)}
                        placeholder={levelApplied ? "Select a class type" : "Select a class level first"}
                      />
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.preferredSchedule"
                        label="Preferred schedule"
                        options={scheduleOptionsForLevel(levelApplied)}
                        placeholder={levelApplied ? "Select a schedule" : "Select a class level first"}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
                      <RadioField
                        control={form.control}
                        name="enrollmentInfo.availSchoolBus"
                        label="Avail school bus"
                        options={YES_NO_OPTIONS}
                      />
                      <div className="space-y-6">
                        <RadioField
                          control={form.control}
                          name="enrollmentInfo.availStudentCare"
                          label="Avail student care"
                          options={YES_NO_OPTIONS}
                        />
                        {availStudentCare === "Yes" && (
                          <SelectField
                            control={form.control}
                            name="enrollmentInfo.studentCareProgram"
                            label="Student care program"
                            options={STUDENT_CARE_PROGRAMS}
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.paymentOption"
                        label="Campus development fee option"
                        options={feeOptionsForLevel(levelApplied)}
                      />
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.contractSignatory"
                        label="Contract signatory"
                        options={contractSignatoryOptions(!noFatherInfo)}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 lg:gap-6 w-full">
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.preferredPaymentScheme"
                        label="Preferred payment scheme"
                        options={preferredPaymentScheme as unknown as { label: string; value: string }[]}
                      />
                      <SelectField
                        control={form.control}
                        name="enrollmentInfo.preferredPaymentMethod"
                        label="Preferred payment method"
                        options={preferredPaymentMethod as unknown as { label: string; value: string }[]}
                      />
                    </div>

                    <CheckboxField
                      control={form.control}
                      name="enrollmentInfo.socialMediaConsent"
                      label="Consent to appear in school social media / marketing materials"
                    />
                  </TabsContent>
                )}

                {sections.has("uploads") && (
                  <TabsContent value="uploads" className="space-y-10 pt-2">
                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Student documents</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.idPicture"
                          toFollowName="uploadRequirements.studentUploadRequirements.toFollowDocs"
                          label="ID picture"
                          field="idPicture"
                          toFollowLimit={STUDENT_TO_FOLLOW_LIMIT}
                          toFollowCount={studentToFollow.length}
                          onUpload={upload}
                        />
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.birthCert"
                          toFollowName="uploadRequirements.studentUploadRequirements.toFollowDocs"
                          label="Birth certificate"
                          field="birthCert"
                          toFollowLimit={STUDENT_TO_FOLLOW_LIMIT}
                          toFollowCount={studentToFollow.length}
                          onUpload={upload}
                        />
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.passport"
                          toFollowName="uploadRequirements.studentUploadRequirements.toFollowDocs"
                          label="Passport"
                          field="passport"
                          toFollowLimit={STUDENT_TO_FOLLOW_LIMIT}
                          toFollowCount={studentToFollow.length}
                          onUpload={upload}
                        />
                        <TextField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.passportNumber"
                          label="Passport number"
                        />
                        <DateField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.passportExpiry"
                          label="Passport expiry"
                        />
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.pass"
                          toFollowName="uploadRequirements.studentUploadRequirements.toFollowDocs"
                          label="Immigration pass"
                          field="pass"
                          toFollowLimit={STUDENT_TO_FOLLOW_LIMIT}
                          toFollowCount={studentToFollow.length}
                          onUpload={upload}
                        />
                        <TextField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.passType"
                          label="Pass type"
                        />
                        <DateField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.passExpiry"
                          label="Pass expiry"
                        />
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.educCert"
                          toFollowName="uploadRequirements.studentUploadRequirements.toFollowDocs"
                          label="Education certificate (optional)"
                          field="educCert"
                          toFollowLimit={STUDENT_TO_FOLLOW_LIMIT}
                          toFollowCount={studentToFollow.length}
                          onUpload={upload}
                        />
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.studentUploadRequirements.medical"
                          toFollowName="uploadRequirements.studentUploadRequirements.toFollowDocs"
                          label="Medical report (optional)"
                          field="medical"
                          toFollowLimit={STUDENT_TO_FOLLOW_LIMIT}
                          toFollowCount={studentToFollow.length}
                          onUpload={upload}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h2 className="text-lg font-black tracking-tight text-foreground">Mother's documents</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.parentGuardianUploadRequirements.motherPassport"
                          toFollowName="uploadRequirements.parentGuardianUploadRequirements.toFollowDocs"
                          label="Passport"
                          field="motherPassport"
                          toFollowLimit={PARENT_TO_FOLLOW_LIMIT}
                          toFollowCount={parentToFollow.length}
                          onUpload={upload}
                        />
                        <TextField
                          control={form.control}
                          name="uploadRequirements.parentGuardianUploadRequirements.motherPassportNumber"
                          label="Passport number"
                        />
                        <DateField
                          control={form.control}
                          name="uploadRequirements.parentGuardianUploadRequirements.motherPassportExpiry"
                          label="Passport expiry"
                        />
                        <FileUploadField
                          control={form.control}
                          name="uploadRequirements.parentGuardianUploadRequirements.motherPass"
                          toFollowName="uploadRequirements.parentGuardianUploadRequirements.toFollowDocs"
                          label="Immigration pass"
                          field="motherPass"
                          toFollowLimit={PARENT_TO_FOLLOW_LIMIT}
                          toFollowCount={parentToFollow.length}
                          onUpload={upload}
                        />
                        <TextField
                          control={form.control}
                          name="uploadRequirements.parentGuardianUploadRequirements.motherPassType"
                          label="Pass type"
                        />
                        <DateField
                          control={form.control}
                          name="uploadRequirements.parentGuardianUploadRequirements.motherPassExpiry"
                          label="Pass expiry"
                        />
                      </div>
                    </div>

                    {!noFatherInfo && (
                      <>
                        <Separator />
                        <div className="space-y-6">
                          <h2 className="text-lg font-black tracking-tight text-foreground">Father's documents</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                            <FileUploadField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.fatherPassport"
                              toFollowName="uploadRequirements.parentGuardianUploadRequirements.toFollowDocs"
                              label="Passport"
                              field="fatherPassport"
                              toFollowLimit={PARENT_TO_FOLLOW_LIMIT}
                              toFollowCount={parentToFollow.length}
                              onUpload={upload}
                            />
                            <TextField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.fatherPassportNumber"
                              label="Passport number"
                            />
                            <DateField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.fatherPassportExpiry"
                              label="Passport expiry"
                            />
                            <FileUploadField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.fatherPass"
                              toFollowName="uploadRequirements.parentGuardianUploadRequirements.toFollowDocs"
                              label="Immigration pass"
                              field="fatherPass"
                              toFollowLimit={PARENT_TO_FOLLOW_LIMIT}
                              toFollowCount={parentToFollow.length}
                              onUpload={upload}
                            />
                            <TextField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.fatherPassType"
                              label="Pass type"
                            />
                            <DateField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.fatherPassExpiry"
                              label="Pass expiry"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {!noGuardianInfo && (
                      <>
                        <Separator />
                        <div className="space-y-6">
                          <h2 className="text-lg font-black tracking-tight text-foreground">Guardian's documents</h2>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 w-full">
                            <FileUploadField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.guardianPassport"
                              toFollowName="uploadRequirements.parentGuardianUploadRequirements.toFollowDocs"
                              label="Passport"
                              field="guardianPassport"
                              toFollowLimit={PARENT_TO_FOLLOW_LIMIT}
                              toFollowCount={parentToFollow.length}
                              onUpload={upload}
                            />
                            <TextField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.guardianPassportNumber"
                              label="Passport number"
                            />
                            <DateField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.guardianPassportExpiry"
                              label="Passport expiry"
                            />
                            <FileUploadField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.guardianPass"
                              toFollowName="uploadRequirements.parentGuardianUploadRequirements.toFollowDocs"
                              label="Immigration pass"
                              field="guardianPass"
                              toFollowLimit={PARENT_TO_FOLLOW_LIMIT}
                              toFollowCount={parentToFollow.length}
                              onUpload={upload}
                            />
                            <TextField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.guardianPassType"
                              label="Pass type"
                            />
                            <DateField
                              control={form.control}
                              name="uploadRequirements.parentGuardianUploadRequirements.guardianPassExpiry"
                              label="Pass expiry"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                )}
              </Tabs>

              <Separator />

              <div className="max-w-4xl mx-auto">
                <Button
                  size="lg"
                  type="submit"
                  disabled={isPending}
                  className="p-8 uppercase rounded-xl shadow-xl shadow-indigo-200 transition-all gap-3 !text-sm md:!text-base font-bold w-full">
                  {isPending ? "Submitting…" : "Submit application"}
                  <Send />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}

function StatusScreen({ title, description, success }: { title: string; description: string; success?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-sm">
        <CardContent className="text-center space-y-3">
          {success ? (
            <CircleCheck className="h-8 w-8 text-primary mx-auto" />
          ) : (
            <TriangleAlert className="h-8 w-8 text-destructive mx-auto" />
          )}
          <h1 className="text-xl font-black text-foreground">{title}</h1>
          <p className="text-sm font-medium text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
