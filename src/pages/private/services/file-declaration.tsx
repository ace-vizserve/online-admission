import { EVIDENCE_ACCEPT, MAX_EVIDENCE_BYTES, fileDeclaration, uploadEvidence } from "@/actions/declarations";
import { toDeclarationPayload, type DeclarationFormValues } from "@/actions/declaration-payload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from "@/components/ui/file-input";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useEnrolledStudents } from "@/hooks/use-enrolled-students";
import { formatDeclarationDateRange } from "@/lib/declaration-dates";
import { MAX_DAYS_AHEAD, MAX_DAYS_IN_PAST, MAX_NOTE_LENGTH, singaporeDate } from "@/lib/declaration-rules";
import { fieldsForStep, visibleSteps } from "@/lib/declaration-steps";
import { classifySubmitFailure, type SubmitFailure } from "@/lib/declaration-submit-failure";
import { cn } from "@/lib/utils";
import { declarationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parseISO, subDays } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  CloudUpload,
  ListChecks,
  Loader2,
  Paperclip,
  Plane,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

/** Which wizard field each SIS `issues[].path` belongs to, so a 400 lands under the right input. */
const ISSUE_FIELD: Record<string, keyof DeclarationFormValues> = {
  studentNumbers: "studentNumbers",
  startDate: "startDate",
  endDate: "endDate",
  withMedical: "withMedical",
  evidencePath: "evidencePath",
  evidenceUrl: "evidenceUrl",
  destinationCountry: "destinationCountry",
  destinationCity: "destinationCity",
  parentNote: "parentNote",
};

const DEFAULTS: DeclarationFormValues = {
  declarationType: "absence",
  studentNumbers: [],
  startDate: "",
  endDate: "",
  withMedical: false,
  evidencePath: "",
  evidenceUrl: "",
  destinationCountry: "",
  destinationCity: "",
  parentNote: "",
};

/** Date-only, formatted from the LOCAL date — `toISOString()` would shift the day in SGT. */
const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

export default function FileDeclaration() {
  const queryClient = useQueryClient();
  const { data: children, isPending: loadingChildren } = useEnrolledStudents();

  const [stepIndex, setStepIndex] = useState(0);
  const [filed, setFiled] = useState<{ alreadyFiled: boolean } | null>(null);
  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  const [uploading, setUploading] = useState(false);
  const [certificate, setCertificate] = useState<File[] | null>(null);

  // `isPending` only flips after a re-render, so a same-tick double click could otherwise fire
  // the mutation twice. The SIS de-duplicates, but this keeps the second request from happening.
  const submitInFlight = useRef(false);

  const form = useForm<DeclarationFormValues>({
    resolver: zodResolver(declarationSchema),
    defaultValues: DEFAULTS,
  });

  const values = form.watch();
  const steps = useMemo(() => visibleSteps(values), [values]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isReview = step === "review";

  // An only child is preselected: most parents have one, and the step becomes a confirmation
  // rather than a choice. Done during render off the query result so it survives a late load.
  const onlyChild = children?.length === 1 ? children[0].studentNumber : null;
  if (onlyChild && values.studentNumbers.length === 0) {
    form.setValue("studentNumbers", [onlyChild]);
  }

  const { mutate: submit, isPending: submitting } = useMutation({
    mutationFn: async () => {
      submitInFlight.current = true;
      return await fileDeclaration(toDeclarationPayload(form.getValues()));
    },
    onSettled: () => {
      submitInFlight.current = false;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["declarations"] });
      // A 200 carrying alreadyFiled is SUCCESS — a double-tapped submit on a bad connection
      // returns the filing that already exists rather than creating a second one.
      setFiled({ alreadyFiled: response.alreadyFiled === true });
    },
    onError: (error) => {
      const next = classifySubmitFailure(error);
      setFailure(next);

      if (next.kind === "fields") {
        // The SIS writes these for parents and maintains them — shown verbatim, never rewritten.
        let firstStep: number | null = null;
        for (const issue of next.issues) {
          const field = ISSUE_FIELD[issue.path];
          if (!field) continue;
          form.setError(field, { message: issue.message });

          const owning = steps.findIndex((s) => fieldsForStep(s).includes(field));
          if (owning >= 0 && (firstStep === null || owning < firstStep)) firstStep = owning;
        }
        // Without this the parent sits on the review step and never sees the message.
        if (firstStep !== null) setStepIndex(firstStep);
        toast.error("Check the highlighted answer");
        return;
      }

      // The dates are what must change, so put the parent back on them. Nothing in the status
      // list helps here, unlike a clash.
      if (next.kind === "datesClosed") {
        const owning = steps.indexOf("when");
        if (owning >= 0) setStepIndex(owning);
        toast.warning("The school is closed for those dates");
        return;
      }

      // A clash is not the parent's mistake — the school simply already has those days.
      if (next.kind === "conflict") {
        toast.warning("Already told the school about those days");
        return;
      }

      // Neither 401 body is written for a parent, so nothing from it reaches the screen.
      if (next.kind === "signedOut") return;

      if (next.kind === "rateLimited") {
        toast.warning(next.message);
        return;
      }

      toast.error(next.kind === "forbidden" ? "That child cannot be filed for" : "Could not send this");
    },
  });

  async function goNext() {
    const valid = await form.trigger(fieldsForStep(step) as never);
    if (!valid) return;
    if (isReview) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setFailure(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  /** Staging only — picking a file no longer sends it. A medical certificate is health data
   * leaving for the SIS, so it waits behind an explicit Upload the same way every other document
   * in the app does; a mis-picked file can be removed before it ever leaves the browser. */
  function onPickCertificate(files: File[] | null) {
    setCertificate(files);

    // Changing or clearing the selection invalidates whatever was uploaded before, or a swapped
    // (or removed) certificate would still be filed under the previous file's path.
    form.setValue("evidencePath", "", { shouldValidate: form.formState.isSubmitted });
  }

  async function onUploadCertificate() {
    const file = certificate?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const path = await uploadEvidence(file);
      form.setValue("evidencePath", path, { shouldValidate: true });
    } catch (error) {
      // The SIS's size and type sentences are already written for a parent.
      toast.error(error instanceof Error ? error.message : "That file could not be uploaded.");
      setCertificate(null);
    } finally {
      setUploading(false);
    }
  }

  if (failure?.kind === "signedOut") return <Navigate to="/login" replace />;

  if (filed) return <Filed alreadyFiled={filed.alreadyFiled} />;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 mt-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Tell the school</h1>
        <p className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <div className="flex gap-1.5 pt-2" aria-hidden="true">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= stepIndex ? "bg-primary" : "bg-muted")}
            />
          ))}
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-5">
          {step === "who" && (
            <StepWho
              form={form}
              children={children}
              loading={loadingChildren}
              selected={values.studentNumbers}
            />
          )}
          {step === "type" && <StepType form={form} value={values.declarationType} />}
          {step === "when" && <StepWhen form={form} values={values} />}
          {step === "certificate" && <StepCertificate form={form} value={values.withMedical} />}
          {step === "attach" && (
            <StepAttach
              form={form}
              values={values}
              uploading={uploading}
              certificate={certificate}
              onPickFiles={onPickCertificate}
              onUpload={onUploadCertificate}
            />
          )}
          {step === "destination" && <StepDestination form={form} values={values} />}
          {step === "note" && <StepNote form={form} value={values.parentNote} />}
          {step === "review" && <StepReview values={values} childNames={namesFor(values.studentNumbers, children)} />}
        </CardContent>
      </Card>

      {failure && <SubmitNotice failure={failure} onRetry={() => submit()} busy={submitting} />}

      <div className="flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <Button type="button" variant="ghost" onClick={goBack} className="gap-2">
            <ArrowLeft className="size-4" /> Back
          </Button>
        ) : (
          <Button type="button" variant="ghost" asChild className="gap-2">
            <Link to="/admission/services/declarations">
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        )}

        {isReview ? (
          <Button
            type="button"
            className="gap-2 font-bold"
            disabled={submitting || uploading}
            onClick={() => {
              if (submitInFlight.current) return;
              setFailure(null);
              submit();
            }}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Submit
          </Button>
        ) : (
          <Button type="button" className="gap-2 font-bold" disabled={uploading} onClick={goNext}>
            Continue <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * What went wrong, told at the weight it deserves.
 *
 * A clash with an existing filing is the common case and is NOT a breakage — the school simply
 * already has those days — so it reads as a caution pointing at the status list, not as a fault.
 * Destructive styling is reserved for a refusal or a fault, and a retry is offered only where
 * pressing submit again could plausibly work.
 */
function SubmitNotice({
  failure,
  onRetry,
  busy,
}: {
  failure: SubmitFailure;
  onRetry: () => void;
  busy: boolean;
}) {
  const CAUTIONS: SubmitFailure["kind"][] = ["conflict", "rateLimited", "datesClosed"];
  const isCaution = CAUTIONS.includes(failure.kind);

  const HEADINGS: Record<SubmitFailure["kind"], string> = {
    fields: "Check the highlighted answer",
    datesClosed: "The school is closed for those dates",
    conflict: "Already sent to the school",
    rateLimited: "Sent too many just now",
    forbidden: "That child cannot be filed for",
    signedOut: "Please sign in again",
    failed: "Could not send this",
  };

  const Icon = failure.kind === "conflict" || failure.kind === "datesClosed" ? CalendarClock : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        isCaution ? "border-amber-500/30 bg-amber-500/5" : "border-destructive/30 bg-destructive/5",
      )}>
      <Icon className={cn("size-5 shrink-0", isCaution ? "text-amber-600" : "text-destructive")} />

      <div className="min-w-0 flex-1 space-y-2">
        <p className={cn("text-sm font-bold tracking-tight", isCaution ? "text-amber-700" : "text-destructive")}>
          {HEADINGS[failure.kind]}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{failure.message}</p>

        {/* The SIS sentence names only the FIRST clash, so a submission covering siblings would
            otherwise under-report as one child. */}
        {failure.overlapping.length > 1 && (
          <ul className="space-y-1 border-l-2 border-amber-500/30 pl-3">
            {failure.overlapping.map((clash) => (
              <li key={`${clash.studentName}-${clash.startDate}-${clash.endDate}`} className="text-sm">
                <span className="font-semibold">{clash.studentName}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {formatDeclarationDateRange(clash.startDate, clash.endDate)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {(failure.showsStatusList || failure.retryable) && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {failure.showsStatusList && (
              <Button asChild size="sm" variant="outline" className="gap-1.5 font-semibold">
                <Link to="/admission/services/declarations">
                  <ListChecks className="size-3.5" /> My declarations
                </Link>
              </Button>
            )}
            {failure.retryable && (
              <Button size="sm" variant="outline" disabled={busy} onClick={onRetry} className="gap-1.5 font-semibold">
                <RotateCcw className="size-3.5" /> Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Display names for the chosen student numbers, falling back to the number itself. */
function namesFor(studentNumbers: string[], children?: { studentNumber: string; name: string }[]) {
  return studentNumbers.map((n) => children?.find((c) => c.studentNumber === n)?.name ?? n);
}

type FormApi = ReturnType<typeof useForm<DeclarationFormValues>>;

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm font-medium text-destructive">{message}</p>;
}

function StepWho({
  form,
  children,
  loading,
  selected,
}: {
  form: FormApi;
  children?: { studentNumber: string; name: string; className: string }[];
  loading: boolean;
  selected: string[];
}) {
  function toggle(studentNumber: string, checked: boolean) {
    const next = checked
      ? [...selected, studentNumber]
      : selected.filter((n) => n !== studentNumber);
    form.setValue("studentNumbers", next, { shouldValidate: form.formState.isSubmitted });
  }

  return (
    <Question title="Who is this about?" hint="Several children on one declaration is fine — siblings catch the same thing.">
      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      )}

      {!loading && children?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          The school has no enrolled children on your account, so there is nothing to declare yet.
        </p>
      )}

      <div className="space-y-2">
        {children?.map((child) => (
          <label
            key={child.studentNumber}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
              selected.includes(child.studentNumber) ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            )}>
            <Checkbox
              checked={selected.includes(child.studentNumber)}
              onCheckedChange={(checked) => toggle(child.studentNumber, checked === true)}
              aria-label={`${child.name} — ${child.className}`}
            />
            <span>
              <span className="block text-sm font-bold">{child.name}</span>
              <span className="block text-xs text-muted-foreground">{child.className}</span>
            </span>
          </label>
        ))}
      </div>

      <FieldError message={form.formState.errors.studentNumbers?.message} />
    </Question>
  );
}

function StepType({ form, value }: { form: FormApi; value: DeclarationFormValues["declarationType"] }) {
  return (
    <Question title="Absence or travel?">
      <RadioGroup
        value={value}
        onValueChange={(v) => form.setValue("declarationType", v as DeclarationFormValues["declarationType"])}
        className="space-y-2">
        {[
          { value: "absence", label: "Absence", hint: "Unwell, or away for another reason", icon: CalendarOff },
          { value: "travel", label: "Travel", hint: "Going overseas", icon: Plane },
        ].map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
              value === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            )}>
            <RadioGroupItem value={option.value} aria-label={option.label} />
            <option.icon className="size-4 text-muted-foreground" />
            <span>
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </Question>
  );
}

function StepWhen({ form, values }: { form: FormApi; values: DeclarationFormValues }) {
  // Anchored to Singapore's day, matching the window the SIS enforces — a parent filing from
  // another timezone would otherwise be offered a day the server then refuses.
  const singaporeToday = parseISO(singaporeDate());
  const selected: DateRange | undefined = values.startDate
    ? { from: new Date(`${values.startDate}T00:00:00`), to: values.endDate ? new Date(`${values.endDate}T00:00:00`) : undefined }
    : undefined;

  function onSelect(range: DateRange | undefined) {
    // Clicking a single day gives `{ from }` with no `to`. That IS the common case — one day —
    // so it is mirrored into both ends rather than left as an incomplete range.
    const from = range?.from;
    const to = range?.to ?? range?.from;
    form.setValue("startDate", from ? toIsoDate(from) : "", { shouldValidate: form.formState.isSubmitted });
    form.setValue("endDate", to ? toIsoDate(to) : "", { shouldValidate: form.formState.isSubmitted });
  }

  return (
    <Question title="When?" hint="Tap one day for a single absence, or tap a second day for a range.">
      <div className="flex justify-center">
        {/* Bounded to the window the SIS accepts, so an out-of-range day is never offered rather
            than rejected after the parent has filled in the rest. Past days INSIDE the window stay
            selectable — declaring a sick day after the fact is the common case. */}
        <Calendar
          mode="range"
          selected={selected}
          onSelect={onSelect}
          numberOfMonths={1}
          disabled={[
            { before: subDays(singaporeToday, MAX_DAYS_IN_PAST) },
            { after: addDays(singaporeToday, MAX_DAYS_AHEAD) },
          ]}
        />
      </div>

      {values.startDate && (
        <p className="text-center text-sm font-semibold">
          {formatDeclarationDateRange(values.startDate, values.endDate || values.startDate)}
        </p>
      )}

      <FieldError message={form.formState.errors.startDate?.message ?? form.formState.errors.endDate?.message} />
    </Question>
  );
}

function StepCertificate({ form, value }: { form: FormApi; value: boolean }) {
  return (
    <Question title="Is there a medical certificate?">
      <RadioGroup
        value={value ? "yes" : "no"}
        onValueChange={(v) => form.setValue("withMedical", v === "yes")}
        className="space-y-2">
        {[
          { value: "yes", label: "With medical certificate" },
          { value: "no", label: "Without" },
        ].map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
              (value ? "yes" : "no") === option.value ? "border-primary bg-primary/5" : "hover:bg-muted/50",
            )}>
            <RadioGroupItem value={option.value} aria-label={option.label} />
            <span className="text-sm font-bold">{option.label}</span>
          </label>
        ))}
      </RadioGroup>
    </Question>
  );
}

function StepAttach({
  form,
  values,
  uploading,
  certificate,
  onPickFiles,
  onUpload,
}: {
  form: FormApi;
  values: DeclarationFormValues;
  uploading: boolean;
  certificate: File[] | null;
  onPickFiles: (files: File[] | null) => void;
  onUpload: () => void;
}) {
  return (
    <Question
      title="Attach the certificate"
      hint="A photo or a PDF, a link, or both. Singapore's digital MCs come as an mc.gov.sg link.">
      <div className="space-y-2">
        {/* The app's own uploader, so this drops, previews and rejects files exactly the way the
            enrolment document uploads do — including its friendly size and type messages. */}
        <FileUploader
          value={certificate}
          onValueChange={onPickFiles}
          dropzoneOptions={{
            accept: EVIDENCE_ACCEPT,
            maxFiles: 1,
            maxSize: MAX_EVIDENCE_BYTES,
            multiple: false,
          }}
          className="relative rounded-lg bg-background">
          <FileInput className="border-2 border-dashed bg-muted">
            <div className="flex w-full flex-col items-center justify-center p-8">
              <CloudUpload className="size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Choose a file</span> or drag it here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, PNG or WEBP, up to {Math.round(MAX_EVIDENCE_BYTES / (1024 * 1024))} MB
              </p>
            </div>
          </FileInput>

          <FileUploaderContent>
            {certificate?.map((file, index) => (
              <FileUploaderItem key={file.name} index={index}>
                <Paperclip className="size-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </FileUploaderItem>
            ))}
          </FileUploaderContent>
        </FileUploader>

        {/* Staged and attached read differently on purpose: "I picked a file" is not "the school
            has it", and the gap between them is where a parent would otherwise assume they were
            done and leave without the certificate ever being sent. */}
        {certificate?.length && !values.evidencePath && !uploading ? (
          <Button type="button" onClick={onUpload} className="w-full gap-2 font-bold">
            Upload file <Upload className="size-4" />
          </Button>
        ) : null}

        {uploading && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Sending it to the school…
          </p>
        )}
        {values.evidencePath && !uploading && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <Paperclip className="size-3" /> Certificate attached
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="certificate-url">Or paste a link</Label>
        <Input
          id="certificate-url"
          inputMode="url"
          placeholder="https://mc.gov.sg/..."
          value={values.evidenceUrl}
          onChange={(e) => form.setValue("evidenceUrl", e.target.value, { shouldValidate: form.formState.isSubmitted })}
        />
      </div>

      <FieldError message={form.formState.errors.evidenceUrl?.message ?? form.formState.errors.evidencePath?.message} />
    </Question>
  );
}

function StepDestination({ form, values }: { form: FormApi; values: DeclarationFormValues }) {
  return (
    <Question title="Where are they going?">
      <div className="space-y-2">
        <Label htmlFor="destination-country">Country</Label>
        {/* A picker, not free text: the SIS stores the country by name, and a typo would file a
            destination it cannot match. */}
        <CountryDropdown
          id="destination-country"
          value={values.destinationCountry}
          onChange={(country) =>
            form.setValue("destinationCountry", country.name, { shouldValidate: form.formState.isSubmitted })
          }
        />
        <FieldError message={form.formState.errors.destinationCountry?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination-city">City (optional)</Label>
        <Input
          id="destination-city"
          value={values.destinationCity}
          onChange={(e) => form.setValue("destinationCity", e.target.value)}
        />
      </div>
    </Question>
  );
}

function StepNote({ form, value }: { form: FormApi; value: string }) {
  return (
    <Question title="Anything the teacher should know?" hint="Optional.">
      <Textarea
        aria-label="Note for the teacher"
        rows={4}
        maxLength={MAX_NOTE_LENGTH}
        value={value}
        onChange={(e) => form.setValue("parentNote", e.target.value)}
      />
      <p className="text-xs text-muted-foreground text-right">
        {value.length}/{MAX_NOTE_LENGTH}
      </p>
      <FieldError message={form.formState.errors.parentNote?.message} />
    </Question>
  );
}

function StepReview({ values, childNames }: { values: DeclarationFormValues; childNames: string[] }) {
  const isTravel = values.declarationType === "travel";
  const destination = [values.destinationCity, values.destinationCountry].filter(Boolean).join(", ");

  return (
    <Question title="Check this over" hint="Nothing is sent to the school until you submit.">
      <dl className="space-y-3 text-sm">
        <Row label="Who">
          {childNames.map((name) => (
            <span key={name} className="block font-semibold">
              {name}
            </span>
          ))}
        </Row>
        <Row label="What">
          <Badge variant="secondary" className="gap-1 rounded-full text-xs font-semibold">
            {isTravel ? <Plane className="size-3" /> : <CalendarOff className="size-3" />}
            {isTravel ? "Travel" : "Absence"}
          </Badge>
        </Row>
        <Row label="When">
          <span className="font-semibold">
            {values.startDate ? formatDeclarationDateRange(values.startDate, values.endDate || values.startDate) : "—"}
          </span>
        </Row>
        {isTravel ? (
          <Row label="Where">
            <span className="font-semibold">{destination || "—"}</span>
          </Row>
        ) : (
          <Row label="Certificate">
            <span className="font-semibold">{values.withMedical ? "Attached" : "None"}</span>
          </Row>
        )}
        {values.parentNote.trim() && (
          <Row label="Note">
            <span className="italic text-muted-foreground">{values.parentNote.trim()}</span>
          </Row>
        )}
      </dl>
    </Question>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}

function Filed({ alreadyFiled }: { alreadyFiled: boolean }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 mt-8">
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-gradient-to-b from-muted/40 to-muted/10 px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mb-5">
          <div className="absolute inset-0 scale-150 rounded-full bg-emerald-500/15 blur-2xl" />
          <div className="relative rounded-2xl bg-emerald-500/10 p-4 shadow-sm ring-4 ring-background">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </div>
        </div>
        <div className="max-w-sm space-y-1.5">
          <h2 className="text-lg font-bold tracking-tight">
            {alreadyFiled ? "This was already sent" : "Sent to the school"}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {alreadyFiled
              ? "We already had this declaration, so nothing was filed twice. You can see it in your list."
              : "Your child's form class adviser will review it. You can follow it in your list."}
          </p>
        </div>
        <Button asChild className="mt-6 font-bold">
          <Link to="/admission/services/declarations">See my declarations</Link>
        </Button>
      </div>
    </div>
  );
}
