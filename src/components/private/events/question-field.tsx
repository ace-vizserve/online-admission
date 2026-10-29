import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AnswerValue, EventQuestion } from "@/types/events";
import { useState } from "react";
import { PickOneField, TickManyField } from "./choice-fields";
import SignatureField from "./signature-field";

const INPUT = "h-9 rounded-lg border-slate-200 bg-white shadow-sm";

/** Labelled input ids for questions that are not themselves a group of choices. */
const SINGLE_INPUT = new Set<EventQuestion["type"]>(["short", "long", "number", "date"]);

/**
 * One question of an event form, any of the eight kinds. `value` is the stored answer; the e-signature
 * keeps its typed name outside the answers (the SIS stores it on the family's submission).
 */
export default function QuestionField({
  question,
  value,
  onChange,
  id,
  error,
  signatureName = "",
  onSignatureChange,
  disabled,
}: {
  question: EventQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  id: string;
  error?: string;
  signatureName?: string;
  onSignatureChange?: (name: string) => void;
  disabled?: boolean;
}) {
  const isInfo = question.type === "info";
  const labelText = (
    <>
      {question.label}
      {question.required && !isInfo && <span className="text-red-500"> *</span>}
    </>
  );

  return (
    <div className="space-y-2" data-question={question.id}>
      {SINGLE_INPUT.has(question.type) ? (
        <Label htmlFor={id} className="block text-sm font-bold leading-snug">
          {labelText}
        </Label>
      ) : (
        <p id={`${id}-label`} className={cn("text-sm font-bold leading-snug", isInfo && "text-[15px]")}>
          {labelText}
        </p>
      )}
      {question.help && <p className="whitespace-pre-line text-xs text-muted-foreground">{question.help}</p>}
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt=""
          loading="lazy"
          className="max-h-72 w-auto max-w-full rounded-lg border object-contain"
        />
      )}

      <Answer
        question={question}
        value={value}
        onChange={onChange}
        id={id}
        invalid={!!error}
        signatureName={signatureName}
        onSignatureChange={onSignatureChange}
        disabled={disabled}
      />

      {error && <p className="text-[13px] font-medium text-destructive">{error}</p>}
    </div>
  );
}

/** Keeps what the parent typed (e.g. "1.") while storing a number, or null until it is one. */
function NumberInput({
  id,
  value,
  onChange,
  invalid,
  disabled,
}: {
  id: string;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  invalid: boolean;
  disabled?: boolean;
}) {
  const [raw, setRaw] = useState(typeof value === "number" ? String(value) : "");
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      value={raw}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      onChange={(e) => {
        const next = e.target.value;
        setRaw(next);
        const n = Number(next);
        onChange(next.trim() === "" || !Number.isFinite(n) ? null : n);
      }}
      className={cn(INPUT, "max-w-[12rem]")}
    />
  );
}

function Answer({
  question,
  value,
  onChange,
  id,
  invalid,
  signatureName,
  onSignatureChange,
  disabled,
}: {
  question: EventQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  id: string;
  invalid: boolean;
  signatureName: string;
  onSignatureChange?: (name: string) => void;
  disabled?: boolean;
}) {
  const text = typeof value === "string" ? value : "";
  const aria = { "aria-invalid": invalid || undefined };

  switch (question.type) {
    case "info":
      return null;
    case "short":
      return (
        <Input id={id} value={text} disabled={disabled} maxLength={5000} onChange={(e) => onChange(e.target.value)} className={INPUT} {...aria} />
      );
    case "long":
      return (
        <Textarea
          id={id}
          value={text}
          disabled={disabled}
          maxLength={5000}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border-slate-200 bg-white shadow-sm"
          {...aria}
        />
      );
    case "number":
      return <NumberInput id={id} value={value} onChange={onChange} invalid={invalid} disabled={disabled} />;
    case "date":
      return (
        <Input
          id={id}
          type="date"
          value={text}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
          className={cn(INPUT, "max-w-[12rem]")}
          {...aria}
        />
      );
    case "pick_one":
      return <PickOneField question={question} value={value} onChange={onChange} id={id} disabled={disabled} />;
    case "tick_many":
      return <TickManyField question={question} value={value} onChange={onChange} id={id} disabled={disabled} />;
    case "signature":
      return (
        <SignatureField
          agreement={question.agreement}
          name={signatureName}
          onChange={(name) => onSignatureChange?.(name)}
          id={id}
          invalid={invalid}
          disabled={disabled}
        />
      );
  }
}
