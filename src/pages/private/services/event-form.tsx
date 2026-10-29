import ChildHeader from "@/components/private/events/child-header";
import {
  buildBody,
  firstName,
  initialState,
  isEditing,
  stepOfError,
  validateStep,
  type FieldErrors,
  type RegistrationState,
} from "@/components/private/events/registration-state";
import SectionQuestions from "@/components/private/events/section-questions";
import EventStepper, { type StepperItem } from "@/components/private/events/stepper";
import WhoStep from "@/components/private/events/who-step";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { mapRegistrationErrors } from "@/actions/events";
import { useEvent, useSaveRegistration } from "@/hooks/use-events";
import { buildSteps, type Step } from "@/lib/event-form";
import { SisError } from "@/lib/sis";
import type { AnswerValue, Consent, ParentEventDetail } from "@/types/events";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarX2, Loader2, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const LIST = "/admission/services/events";
const CLOSED = "Registration for this event has closed.";
const FALLBACK = "Something went wrong. Please try again.";

function BackToEvents() {
  return (
    <Link to={LIST} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Events
    </Link>
  );
}

/** One event's form, a step at a time: who is joining, each joining child, then the family's answers. */
export default function EventFormPage() {
  const { slug } = useParams();
  const { data, isPending, error } = useEvent(slug);

  if (error instanceof SisError && error.status === 401) return <Navigate to="/login" replace />;

  if (isPending) {
    return (
      <div className="mx-auto mt-2 w-full max-w-2xl space-y-4 px-4 py-6">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    const missing = error instanceof SisError && error.status === 404;
    return (
      <div className="mx-auto mt-2 w-full max-w-2xl space-y-4 px-4 py-6">
        <BackToEvents />
        <div className="rounded-xl border bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            {missing
              ? "This event is not open for your children."
              : error instanceof SisError
                ? error.message
                : FALLBACK}
          </p>
        </div>
      </div>
    );
  }

  return <EventFormBody key={data.event.slug} detail={data} />;
}

function eventWhen(event: ParentEventDetail["event"]) {
  const start = parseISO(event.startsOn);
  const days =
    event.endsOn && event.endsOn !== event.startsOn
      ? `${format(start, "EEE d MMM")} – ${format(parseISO(event.endsOn), "EEE d MMM yyyy")}`
      : format(start, "EEE d MMM yyyy");
  return event.timeLabel ? `${days}, ${event.timeLabel}` : days;
}

function EventFormBody({ detail }: { detail: ParentEventDetail }) {
  const navigate = useNavigate();
  const save = useSaveRegistration(detail.event.slug);
  const editing = isEditing(detail);
  const consentMode = detail.event.answerMode === "consent";

  const [state, setState] = useState<RegistrationState>(() => initialState(detail));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [closed, setClosed] = useState(!detail.event.canRegister);
  const [formError, setFormError] = useState<string | null>(null);

  const steps = buildSteps(detail.form, detail.children, state.consent);
  const current = Math.min(stepIndex, steps.length - 1);
  const step = steps[current];
  const isLast = current === steps.length - 1;
  const disabled = closed || save.isPending;
  const sectionsById = new Map(detail.form.sections.map((s) => [s.id, s]));
  const childOf = (sn: string) => detail.children.find((c) => c.studentNumber === sn);

  function clearError(key: string) {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function goTo(index: number) {
    setStepIndex(index);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // Not every environment scrolls; the step still changes.
    }
  }

  function setConsent(sn: string, consent: Consent) {
    setState((s) => ({ ...s, consent: { ...s.consent, [sn]: consent } }));
    clearError(`${sn}.consent`);
  }

  function setChildAnswer(sn: string, questionId: string, value: AnswerValue) {
    setState((s) => ({
      ...s,
      childAnswers: { ...s.childAnswers, [sn]: { ...(s.childAnswers[sn] ?? {}), [questionId]: value } },
    }));
    clearError(`${sn}.${questionId}`);
  }

  function setFamilyAnswer(questionId: string, value: AnswerValue) {
    setState((s) => ({ ...s, familyAnswers: { ...s.familyAnswers, [questionId]: value } }));
    clearError(questionId);
  }

  function setSignature(questionId: string, name: string) {
    setState((s) => ({ ...s, signatureName: name }));
    clearError(questionId);
  }

  /** Every step's errors; the parent is sent to the first step that has any. */
  function checkFrom(from: number): boolean {
    for (let i = from; i < steps.length; i++) {
      const errs = validateStep(steps[i], detail, state);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        if (i !== current) goTo(i);
        return false;
      }
    }
    return true;
  }

  function onContinue() {
    const errs = validateStep(step, detail, state);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    goTo(current + 1);
  }

  function onSubmit() {
    if (!checkFrom(0)) return;
    setErrors({});
    setFormError(null);
    save.mutate(buildBody(detail, state), {
      onSuccess: () => {
        toast.success(editing ? "Changes saved" : "Registered");
        navigate(LIST);
      },
      onError: (err) => {
        if (err instanceof SisError && err.status === 409) {
          setClosed(true);
          return;
        }
        if (err instanceof SisError && err.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        const mapped = mapRegistrationErrors(err);
        const keys = Object.keys(mapped.fields);
        if (keys.length > 0) {
          setErrors(mapped.fields);
          goTo(Math.min(...keys.map((k) => stepOfError(k, steps))));
        }
        setFormError(err instanceof SisError ? (mapped.form ?? FALLBACK) : FALLBACK);
      },
    });
  }

  const stepperItems: StepperItem[] = steps.map((s) => stepperItem(s, detail, state, sectionsById, childOf, consentMode));
  const next = steps[current + 1];
  const nextLabel =
    next?.kind === "child" ? `Continue to ${firstName(childOf(next.studentNumber)?.name ?? "")}` : "Continue";

  return (
    <div className="mx-auto mt-2 w-full max-w-2xl space-y-4 px-4 py-6">
      <BackToEvents />

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-primary" />
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-xl font-black tracking-tight">{detail.event.title}</h1>
            <p className="text-[13px] text-muted-foreground">
              {[eventWhen(detail.event), detail.event.venue].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="w-fit shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[12px] font-bold text-amber-800">
            {closed ? "Registration closed" : `Register by ${format(parseISO(detail.event.closesAt), "EEE d MMM")}`}
          </p>
        </div>
        {current === 0 && detail.event.description && (
          <p className="whitespace-pre-line border-t px-6 py-4 text-[13px] leading-relaxed text-slate-700">
            {detail.event.description}
          </p>
        )}
      </div>

      {closed && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <CalendarX2 className="size-5 shrink-0 text-destructive" />
          <p className="text-sm font-bold text-destructive">{CLOSED}</p>
        </div>
      )}

      {steps.length > 1 && <EventStepper items={stepperItems} current={current} onSelect={goTo} />}

      {step.kind === "who" && (
        <WhoStep
          detail={detail}
          state={state}
          errors={errors}
          disabled={disabled}
          onContact={(field, value) => {
            setState((s) => ({ ...s, [field]: value }));
            clearError(field);
          }}
          onConsent={setConsent}
          onReason={(sn, reason) => {
            setState((s) => ({ ...s, reasons: { ...s.reasons, [sn]: reason } }));
            clearError(`${sn}.reason`);
          }}
        />
      )}

      {step.kind === "child" && (() => {
        const child = childOf(step.studentNumber);
        if (!child) return null;
        return (
          <div className="rounded-xl border bg-white shadow-sm">
            <ChildHeader
              child={child}
              badge={
                <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {consentMode ? "Allowing" : "Coming"}
                </span>
              }
            />
            <SectionQuestions
              form={detail.form}
              sections={step.sectionIds.map((id) => sectionsById.get(id)!).filter(Boolean)}
              answers={state.childAnswers[child.studentNumber] ?? {}}
              onAnswer={(qid, v) => setChildAnswer(child.studentNumber, qid, v)}
              errors={errors}
              errorPrefix={`${child.studentNumber}.`}
              idPrefix={`q-${child.studentNumber}`}
              disabled={disabled}
            />
          </div>
        );
      })()}

      {step.kind === "family" && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-3">
            <p className="text-sm font-bold">For the family</p>
            <p className="text-xs text-muted-foreground">Answered once, whichever children are joining.</p>
          </div>
          <SectionQuestions
            form={detail.form}
            sections={step.sectionIds.map((id) => sectionsById.get(id)!).filter(Boolean)}
            answers={state.familyAnswers}
            onAnswer={setFamilyAnswer}
            errors={errors}
            errorPrefix=""
            idPrefix="q-family"
            signatureName={state.signatureName}
            onSignatureChange={(name) => {
              const sig = detail.form.sections.flatMap((s) => s.questions).find((q) => q.type === "signature");
              setSignature(sig?.id ?? "", name);
            }}
            disabled={disabled}
          />
        </div>
      )}

      {formError && !closed && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-3">
          <TriangleAlert className="size-4 shrink-0 text-destructive" />
          <p className="text-sm font-medium text-destructive">{formError}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        {current > 0 ? (
          <Button type="button" variant="outline" className="h-9 gap-1.5 rounded-lg px-4" onClick={() => goTo(current - 1)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        ) : (
          <Button asChild variant="outline" className="h-9 gap-1.5 rounded-lg px-4">
            <Link to={LIST}>
              <ArrowLeft className="size-4" /> Back
            </Link>
          </Button>
        )}
        <div className="flex items-center gap-3">
          <p className="text-right text-xs text-muted-foreground">
            Step {current + 1} of {steps.length}
            <span className="hidden sm:inline"> · your answers are kept if you go back</span>
          </p>
          {isLast ? (
            <Button type="button" className="h-9 gap-2 px-5 font-bold" disabled={disabled} onClick={onSubmit}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Register"}
            </Button>
          ) : (
            <Button type="button" className="h-9 gap-2 px-5 font-bold" disabled={disabled} onClick={onContinue}>
              {nextLabel} <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function stepperItem(
  step: Step,
  detail: ParentEventDetail,
  state: RegistrationState,
  sectionsById: Map<string, ParentEventDetail["form"]["sections"][number]>,
  childOf: (sn: string) => ParentEventDetail["children"][number] | undefined,
  consentMode: boolean,
): StepperItem {
  if (step.kind === "who") {
    const total = detail.children.length;
    const joining = detail.children.filter((c) => state.consent[c.studentNumber] === "allowing").length;
    const undecided = detail.children.some((c) => !state.consent[c.studentNumber]);
    const hint = undecided
      ? "Choose for each child"
      : total === 1
        ? joining === 1
          ? "Joining"
          : "Not joining"
        : joining === total
          ? total === 2
            ? "Both joining"
            : "All joining"
          : `${joining} of ${total} joining`;
    return { key: "who", label: consentMode ? "Who’s joining" : "Who’s coming", hint };
  }
  if (step.kind === "child") {
    return {
      key: `child-${step.studentNumber}`,
      label: firstName(childOf(step.studentNumber)?.name ?? ""),
      hint: sectionsById.get(step.sectionIds[0])?.title ?? "",
    };
  }
  return {
    key: "family",
    label: sectionsById.get(step.sectionIds[0])?.title || "Sign",
    hint: "Once for the family",
  };
}
