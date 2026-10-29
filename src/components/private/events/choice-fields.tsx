import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AnswerValue, EventQuestion } from "@/types/events";
import { useState } from "react";

const OTHER = "__other__";

type ChoiceProps = {
  question: EventQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  id: string;
  invalid?: boolean;
  disabled?: boolean;
};

/** One answer from a list; "Other" stores whatever the parent types. */
export function PickOneField({ question, value, onChange, id, invalid, disabled }: ChoiceProps) {
  const errorAria = { "aria-invalid": invalid || undefined, "aria-describedby": invalid ? `${id}-error` : undefined };
  const text = typeof value === "string" ? value : "";
  const isChoice = question.choices.includes(text);
  const [otherPicked, setOtherPicked] = useState(question.allowOther && text !== "" && !isChoice);
  const showOther = question.allowOther && (otherPicked || (text !== "" && !isChoice));
  const selected = showOther ? OTHER : isChoice ? text : "";

  return (
    <div className="space-y-2">
      <RadioGroup
        value={selected}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        {...errorAria}
        onValueChange={(v) => {
          if (v === OTHER) {
            setOtherPicked(true);
            onChange("");
            return;
          }
          setOtherPicked(false);
          onChange(v);
        }}
        className="flex flex-wrap gap-x-6 gap-y-2.5">
        {question.choices.map((choice, i) => (
          <div key={choice} className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-${i}`} value={choice} />
            <Label htmlFor={`${id}-${i}`} className="text-sm font-normal">
              {choice}
            </Label>
          </div>
        ))}
        {question.allowOther && (
          <div className="flex items-center gap-2">
            <RadioGroupItem id={`${id}-other`} value={OTHER} />
            <Label htmlFor={`${id}-other`} className="text-sm font-normal">
              Other
            </Label>
          </div>
        )}
      </RadioGroup>
      {showOther && (
        <Input
          aria-label={`${question.label} — other`}
          placeholder="Type your answer"
          value={text}
          disabled={disabled}
          maxLength={500}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-lg border-slate-200 bg-white shadow-sm"
        />
      )}
    </div>
  );
}

/**
 * Any number of answers from a list. No "Other" here: the school's system only accepts the listed
 * choices for this kind of question.
 */
export function TickManyField({ question, value, onChange, id, invalid, disabled }: ChoiceProps) {
  const errorAria = { "aria-invalid": invalid || undefined, "aria-describedby": invalid ? `${id}-error` : undefined };
  const ticked = Array.isArray(value) ? value : [];

  function toggle(choice: string, on: boolean) {
    const next = on ? [...ticked, choice] : ticked.filter((c) => c !== choice);
    // Keep the school's order, not the order the parent ticked in.
    onChange(question.choices.filter((c) => next.includes(c)));
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} {...errorAria} className="flex flex-col gap-2.5">
      {question.choices.map((choice, i) => (
        <div key={choice} className="flex items-center gap-2">
          <Checkbox
            id={`${id}-${i}`}
            checked={ticked.includes(choice)}
            disabled={disabled}
            onCheckedChange={(checked) => toggle(choice, checked === true)}
          />
          <Label htmlFor={`${id}-${i}`} className="text-sm font-normal">
            {choice}
          </Label>
        </div>
      ))}
    </div>
  );
}
