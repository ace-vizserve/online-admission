import {
  EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_BYTES,
  fileDeclaration,
  uploadEvidence,
} from "@/actions/declarations";
import { toDeclarationPayload, type DeclarationFormValues } from "@/actions/declaration-payload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useEnrolledStudents } from "@/hooks/use-enrolled-students";
import { formatDeclarationDateRange } from "@/lib/declaration-dates";
import { MAX_DAYS_AHEAD, MAX_DAYS_IN_PAST, MAX_NOTE_LENGTH } from "@/lib/declaration-rules";
import { fieldsForStep, visibleSteps } from "@/lib/declaration-steps";
import { SisError } from "@/lib/sis";
import { cn } from "@/lib/utils";
import { declarationSchema } from "@/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDays, format, startOfToday, subDays } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarOff, CheckCircle2, Loader2, Paperclip, Plane } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      if (!(error instanceof SisError)) {
        setSubmitError("Something went wrong. Please try again.");
        return;
      }

      if (error.status === 400 && error.issues?.length) {
        // The SIS writes these for parents and maintains them — shown verbatim, never rewritten.
        let firstStep: number | null = null;
        for (const issue of error.issues) {
          const field = ISSUE_FIELD[issue.path];
          if (!field) continue;
          form.setError(field, { message: issue.message });

          const owning = steps.findIndex((s) => fieldsForStep(s).includes(field));
          if (owning >= 0 && (firstStep === null || owning < firstStep)) firstStep = owning;
        }
        // Without this the parent sits on the review step and never sees the message.
        if (firstStep !== null) setStepIndex(firstStep);
        setSubmitError(error.message);
        return;
      }

      if (error.status === 429) {
        const wait = error.retryAfterSeconds;
        setSubmitError(
          wait ? `Too many attempts. Please try again in ${wait} seconds.` : "Too many attempts. Please try again shortly.",
        );
        return;
      }

      setSubmitError(error.message);
    },
  });

  async function goNext() {
    const valid = await form.trigger(fieldsForStep(step) as never);
    if (!valid) return;
    if (isReview) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setSubmitError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onPickCertificate(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadEvidence(file);
      form.setValue("evidencePath", path, { shouldValidate: true });
    } catch (error) {
      // The SIS's size/type sentences are already written for a parent.
      toast.error(error instanceof Error ? error.message : "That file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

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
            <StepAttach form={form} values={values} uploading={uploading} onPickFile={onPickCertificate} />
          )}
          {step === "destination" && <StepDestination form={form} values={values} />}
          {step === "note" && <StepNote form={form} value={values.parentNote} />}
          {step === "review" && <StepReview values={values} childNames={namesFor(values.studentNumbers, children)} />}
        </CardContent>
      </Card>

      {submitError && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-destructive font-medium">{submitError}</p>
          </CardContent>
        </Card>
      )}

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
              setSubmitError(null);
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
            { before: subDays(startOfToday(), MAX_DAYS_IN_PAST) },
            { after: addDays(startOfToday(), MAX_DAYS_AHEAD) },
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
  onPickFile,
}: {
  form: FormApi;
  values: DeclarationFormValues;
  uploading: boolean;
  onPickFile: (file: File | null) => void;
}) {
  return (
    <Question
      title="Attach the certificate"
      hint="A photo or PDF, a link, or both. Singapore's digital MCs come as an mc.gov.sg link.">
      <div className="space-y-2">
        <Label htmlFor="certificate-file">Upload</Label>
        <Input
          id="certificate-file"
          type="file"
          accept={EVIDENCE_MIME_TYPES.join(",")}
          disabled={uploading}
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-xs text-muted-foreground">
          PDF, JPG, PNG or WEBP, up to {Math.round(MAX_EVIDENCE_BYTES / (1024 * 1024))} MB.
        </p>
        {uploading && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" /> Uploading…
          </p>
        )}
        {values.evidencePath && !uploading && (
          <p className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1.5">
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
