// Form rules for parent events. COPIED from the SIS: lib/events/form.ts is the source of truth.
// If the SIS rules change, change them there first, then mirror here (and in event-form.test.ts).
// Only the display-side rules live here; the SIS re-validates everything on save.

import type { Answers, Consent, EventForm, EventQuestion, EventSection } from "@/types/events";

export function sectionShownFor(section: EventSection, consent: Consent): boolean {
  if (section.scope === "family") return true;
  return !section.allowingOnly || consent === "allowing";
}

export function questionShown(q: EventQuestion, answers: Answers): boolean {
  if (!q.showWhen) return true;
  const v = answers[q.showWhen.questionId];
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.includes(q.showWhen.equals);
  return String(v) === q.showWhen.equals;
}

/** Ids of questions visible in these sections; a question whose source is hidden is hidden too. */
export function visibleQuestionIds(form: EventForm, sections: EventSection[], answers: Answers): Set<string> {
  const allById = new Map<string, EventQuestion>();
  for (const s of form.sections) for (const q of s.questions) allById.set(q.id, q);
  const byId = new Map<string, EventQuestion>();
  for (const s of sections) for (const q of s.questions) byId.set(q.id, q);
  const memo = new Map<string, boolean>();
  const visit = (q: EventQuestion, trail: Set<string>): boolean => {
    const cached = memo.get(q.id);
    if (cached !== undefined) return cached;
    let shown = questionShown(q, answers);
    if (shown && q.showWhen) {
      const srcId = q.showWhen.questionId;
      const src = byId.get(srcId);
      if (!src && allById.has(srcId)) shown = false;
      if (src) shown = !trail.has(src.id) && visit(src, new Set(trail).add(q.id));
    }
    memo.set(q.id, shown);
    return shown;
  };
  const out = new Set<string>();
  byId.forEach((q) => {
    if (visit(q, new Set())) out.add(q.id);
  });
  return out;
}

/** The sections one child's answers cover, given their consent. */
export function childSectionsFor(form: EventForm, consent: Consent): EventSection[] {
  return form.sections.filter((s) => s.scope === "child" && sectionShownFor(s, consent));
}

export type Step =
  | { kind: "who" }
  | { kind: "child"; studentNumber: string; sectionIds: string[] }
  | { kind: "family"; sectionIds: string[] };

/**
 * The pages of the form, in order: who is coming, one per allowing child that has something to answer,
 * then the family page. A child with no consent chosen yet counts as not allowing. The family page
 * appears only when at least one child is allowing, because the SIS skips family validation otherwise.
 */
export function buildSteps(
  form: EventForm,
  children: { studentNumber: string }[],
  consentByChild: Record<string, Consent | undefined>,
): Step[] {
  const steps: Step[] = [{ kind: "who" }];
  let anyAllowing = false;
  for (const c of children) {
    if (consentByChild[c.studentNumber] !== "allowing") continue;
    anyAllowing = true;
    const sectionIds = childSectionsFor(form, "allowing").map((s) => s.id);
    if (sectionIds.length > 0) steps.push({ kind: "child", studentNumber: c.studentNumber, sectionIds });
  }
  const family = form.sections.filter((s) => s.scope === "family");
  if (anyAllowing && family.length > 0) steps.push({ kind: "family", sectionIds: family.map((s) => s.id) });
  return steps;
}
