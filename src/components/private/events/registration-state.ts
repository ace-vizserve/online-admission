import { childSectionsFor, visibleQuestionIds, type Step } from "@/lib/event-form";
import type { AnswerValue, Answers, Consent, ParentEventDetail, RegistrationBody } from "@/types/events";

// The parent's answers while they fill in the form, and the rules the page checks before Continue.
// The SIS re-checks everything on save; these only stop an obviously unfinished step.

export const REQUIRED = "This question is required.";
export const REASON_MAX = 500;

export type RegistrationState = {
  parentName: string;
  parentPhone: string;
  consent: Record<string, Consent | undefined>;
  reasons: Record<string, string>;
  childAnswers: Record<string, Answers>;
  familyAnswers: Answers;
  signatureName: string;
};

/** Errors keyed the way the SIS keys them: `<questionId>`, `<studentNumber>.<questionId>`, `<studentNumber>.reason`. */
export type FieldErrors = Record<string, string>;

/** "Ian Louise Lim" → "Ian". */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function isEditing(detail: ParentEventDetail): boolean {
  return detail.submission != null || Object.keys(detail.registrations).length > 0;
}

/** What the form opens with: the saved answers when editing, otherwise blank with the contact prefilled. */
export function initialState(detail: ParentEventDetail): RegistrationState {
  const consent: RegistrationState["consent"] = {};
  const reasons: RegistrationState["reasons"] = {};
  const childAnswers: RegistrationState["childAnswers"] = {};
  for (const child of detail.children) {
    const saved = detail.registrations[child.studentNumber];
    // A register event has no "not chosen yet": unticked already means not coming.
    consent[child.studentNumber] = saved
      ? saved.status === "registered"
        ? "allowing"
        : "not_allowing"
      : detail.event.answerMode === "register"
        ? "not_allowing"
        : undefined;
    reasons[child.studentNumber] = saved?.reason ?? "";
    childAnswers[child.studentNumber] = { ...(saved?.answers ?? {}) };
  }
  const contact = detail.submission ?? detail.prefill;
  return {
    parentName: contact.parentName,
    parentPhone: contact.parentPhone,
    consent,
    reasons,
    childAnswers,
    familyAnswers: { ...(detail.submission?.familyAnswers ?? {}) },
    signatureName: detail.submission?.signatureName ?? "",
  };
}

function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function familySections(detail: ParentEventDetail) {
  return detail.form.sections.filter((s) => s.scope === "family");
}

/** Required visible questions left blank, keyed with `prefix` (a child's student number plus a dot, or ""). */
function missingAnswers(
  detail: ParentEventDetail,
  sections: ParentEventDetail["form"]["sections"],
  answers: Answers,
  prefix: string,
  signatureName: string | null,
): FieldErrors {
  const errors: FieldErrors = {};
  const visible = visibleQuestionIds(detail.form, sections, answers);
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.type === "info" || !q.required || !visible.has(q.id)) continue;
      const blank = q.type === "signature" ? (signatureName ?? "").trim() === "" : isEmpty(answers[q.id]);
      if (blank) errors[`${prefix}${q.id}`] = REQUIRED;
    }
  }
  return errors;
}

/** What stops the parent leaving this step. Empty when it is done. */
export function validateStep(step: Step, detail: ParentEventDetail, state: RegistrationState): FieldErrors {
  const errors: FieldErrors = {};
  if (step.kind === "who") {
    if (state.parentName.trim() === "") errors.parentName = "Enter your name.";
    if (state.parentPhone.trim() === "") errors.parentPhone = "Enter your phone number.";
    for (const child of detail.children) {
      const sn = child.studentNumber;
      const consent = state.consent[sn];
      if (!consent) {
        errors[`${sn}.consent`] = `Choose whether ${firstName(child.name)} is joining.`;
        continue;
      }
      if (detail.event.answerMode === "consent" && consent === "not_allowing") {
        const reason = (state.reasons[sn] ?? "").trim();
        if (reason === "") errors[`${sn}.reason`] = "Tell us why.";
        else if (reason.length > REASON_MAX) errors[`${sn}.reason`] = "Keep this to 500 characters or fewer.";
      }
    }
    return errors;
  }
  if (step.kind === "child") {
    const sections = childSectionsFor(detail.form, "allowing");
    return missingAnswers(detail, sections, state.childAnswers[step.studentNumber] ?? {}, `${step.studentNumber}.`, null);
  }
  return missingAnswers(detail, familySections(detail), state.familyAnswers, "", state.signatureName);
}

/** Only the answers to questions the parent can see; info and signature questions hold no answer. */
function visibleAnswers(
  detail: ParentEventDetail,
  sections: ParentEventDetail["form"]["sections"],
  answers: Answers,
): Answers {
  const visible = visibleQuestionIds(detail.form, sections, answers);
  const out: Answers = {};
  for (const section of sections) {
    for (const q of section.questions) {
      if (q.type === "info" || q.type === "signature" || !visible.has(q.id)) continue;
      const v = answers[q.id];
      if (!isEmpty(v)) out[q.id] = v as AnswerValue;
    }
  }
  return out;
}

/** The PUT body. Every child is included; family answers and the signature only when someone is joining. */
export function buildBody(detail: ParentEventDetail, state: RegistrationState): RegistrationBody {
  const consentMode = detail.event.answerMode === "consent";
  const allowingSections = childSectionsFor(detail.form, "allowing");
  const children = detail.children.map((child) => {
    const sn = child.studentNumber;
    const consent: Consent = state.consent[sn] ?? "not_allowing";
    if (consent === "allowing") {
      return { studentNumber: sn, consent, answers: visibleAnswers(detail, allowingSections, state.childAnswers[sn] ?? {}) };
    }
    return consentMode
      ? { studentNumber: sn, consent, reason: (state.reasons[sn] ?? "").trim(), answers: {} }
      : { studentNumber: sn, consent, answers: {} };
  });
  const anyAllowing = children.some((c) => c.consent === "allowing");
  const body: RegistrationBody = {
    parentName: state.parentName.trim(),
    parentPhone: state.parentPhone.trim(),
    children,
    familyAnswers: anyAllowing ? visibleAnswers(detail, familySections(detail), state.familyAnswers) : {},
  };
  if (anyAllowing) body.signatureName = state.signatureName.trim();
  return body;
}

/** The step an error key belongs to, so the parent lands where the message is. */
export function stepOfError(key: string, steps: Step[]): number {
  const dot = key.indexOf(".");
  if (dot < 0) {
    if (key === "parentName" || key === "parentPhone") return 0;
    const family = steps.findIndex((s) => s.kind === "family");
    return family >= 0 ? family : 0;
  }
  const sn = key.slice(0, dot);
  const rest = key.slice(dot + 1);
  if (rest === "reason" || rest === "consent") return 0;
  const child = steps.findIndex((s) => s.kind === "child" && s.studentNumber === sn);
  return child >= 0 ? child : 0;
}
