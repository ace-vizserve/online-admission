import { visibleQuestionIds } from "@/lib/event-form";
import type { AnswerValue, Answers, EventForm, EventSection } from "@/types/events";
import QuestionField from "./question-field";
import type { FieldErrors } from "./registration-state";

/**
 * The questions of some sections, hiding any whose "show when" is not met. `errorPrefix` is how the
 * SIS keys this page's errors: a child's student number plus a dot, or "" for the family.
 */
export default function SectionQuestions({
  form,
  sections,
  answers,
  onAnswer,
  errors,
  errorPrefix,
  idPrefix,
  signatureName,
  onSignatureChange,
  disabled,
}: {
  form: EventForm;
  sections: EventSection[];
  answers: Answers;
  onAnswer: (questionId: string, value: AnswerValue) => void;
  errors: FieldErrors;
  errorPrefix: string;
  idPrefix: string;
  signatureName?: string;
  onSignatureChange?: (name: string) => void;
  disabled: boolean;
}) {
  const visible = visibleQuestionIds(form, sections, answers);

  return (
    <div className="divide-y">
      {sections.map((section) => {
        const questions = section.questions.filter((q) => visible.has(q.id));
        if (questions.length === 0 && !section.description) return null;
        // One untitled-looking section needs no heading of its own; several do.
        const showTitle = sections.length > 1 || !!section.description;
        return (
          <section key={section.id} className="space-y-5 p-5">
            {showTitle && (
              <div className="space-y-1">
                <h3 className="text-[15px] font-black tracking-tight">{section.title}</h3>
                {section.description && (
                  <p className="whitespace-pre-line text-[13px] text-muted-foreground">{section.description}</p>
                )}
              </div>
            )}
            {questions.map((q) => (
              <QuestionField
                key={q.id}
                id={`${idPrefix}-${q.id}`}
                question={q}
                value={answers[q.id]}
                onChange={(v) => onAnswer(q.id, v)}
                error={errors[`${errorPrefix}${q.id}`]}
                signatureName={signatureName}
                onSignatureChange={onSignatureChange}
                disabled={disabled}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
