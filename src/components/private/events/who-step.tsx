import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Consent, ParentEventDetail } from "@/types/events";
import { useState } from "react";
import ChildHeader from "./child-header";
import { REASON_MAX, type FieldErrors, type RegistrationState } from "./registration-state";

type Props = {
  detail: ParentEventDetail;
  state: RegistrationState;
  errors: FieldErrors;
  disabled: boolean;
  onContact: (field: "parentName" | "parentPhone", value: string) => void;
  onConsent: (studentNumber: string, consent: Consent) => void;
  onReason: (studentNumber: string, reason: string) => void;
};

/** Step 1: who is replying, and for each child whether they are joining. */
export default function WhoStep(props: Props) {
  const { detail } = props;
  const consentMode = detail.event.answerMode === "consent";

  return (
    <div className="space-y-4">
      <Contact {...props} />
      <div className="space-y-1">
        <h2 className="text-lg font-black tracking-tight">{consentMode ? "Who’s joining" : "Who’s coming"}</h2>
        <p className="text-[13px] text-muted-foreground">
          {consentMode
            ? "Answer for each child. You can change this until registration closes."
            : "Tick each child who is coming. You can change this until registration closes."}
        </p>
      </div>
      {consentMode ? <ConsentCards {...props} /> : <Ticks {...props} />}
    </div>
  );
}

function Contact({ state, errors, disabled, onContact }: Props) {
  const missing = state.parentName.trim() === "" || state.parentPhone.trim() === "";
  const [editing, setEditing] = useState(missing);
  const open = editing || !!errors.parentName || !!errors.parentPhone;

  return (
    <div className="rounded-xl border bg-white px-5 py-3 shadow-sm">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <p className="text-muted-foreground">
            Replying as <span className="font-bold text-foreground">{state.parentName}</span> · {state.parentPhone}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setEditing(true)}
            className="font-bold text-primary underline-offset-4 hover:underline disabled:opacity-50">
            Change
          </button>
        </div>
      ) : (
        <div className="grid gap-3 py-1 sm:grid-cols-2">
          <p className="text-[13px] text-muted-foreground sm:col-span-2">The school will contact you here about this event.</p>
          <ContactInput
            id="parent-name"
            label="Your name"
            value={state.parentName}
            error={errors.parentName}
            disabled={disabled}
            autoComplete="name"
            onChange={(v) => onContact("parentName", v)}
          />
          <ContactInput
            id="parent-phone"
            label="Phone number"
            value={state.parentPhone}
            error={errors.parentPhone}
            disabled={disabled}
            autoComplete="tel"
            onChange={(v) => onContact("parentPhone", v)}
          />
        </div>
      )}
    </div>
  );
}

function ContactInput(props: {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.id} className="text-xs font-semibold text-muted-foreground">
        {props.label}
      </Label>
      <Input
        id={props.id}
        value={props.value}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
        maxLength={props.id === "parent-phone" ? 50 : 200}
        aria-invalid={!!props.error || undefined}
        onChange={(e) => props.onChange(e.target.value)}
        className="h-9 rounded-lg border-slate-200 bg-white shadow-sm"
      />
      {props.error && <p className="text-[13px] font-medium text-destructive">{props.error}</p>}
    </div>
  );
}

const CHOICES: { value: Consent; label: string; hint: string }[] = [
  { value: "allowing", label: "Allowing my child to join", hint: "You’ll answer a few questions for them next" },
  { value: "not_allowing", label: "Not allowing", hint: "Tell the school why" },
];

function ConsentCards({ detail, state, errors, disabled, onConsent, onReason }: Props) {
  return (
    <div className="space-y-4">
      {detail.children.map((child) => {
        const sn = child.studentNumber;
        const consent = state.consent[sn];
        const reasonId = `reason-${sn}`;
        return (
          <div key={sn} data-child className="rounded-xl border bg-white shadow-sm">
            <ChildHeader child={child} />
            <div className="space-y-4 p-5">
              <RadioGroup
                value={consent ?? ""}
                disabled={disabled}
                aria-label={`Is ${child.name} joining?`}
                onValueChange={(v) => onConsent(sn, v as Consent)}
                className="grid gap-3 sm:grid-cols-2">
                {CHOICES.map((choice) => {
                  const selected = consent === choice.value;
                  const allowing = choice.value === "allowing";
                  return (
                    <label
                      key={choice.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                        selected && allowing && "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30",
                        selected && !allowing && "border-slate-400 bg-slate-50 ring-1 ring-slate-400/30",
                        !selected && "hover:bg-muted/50",
                        disabled && "cursor-not-allowed opacity-60",
                      )}>
                      <RadioGroupItem value={choice.value} aria-label={choice.label} className="mt-0.5" />
                      <span>
                        <span className="block text-sm font-bold">{choice.label}</span>
                        <span className="block text-xs text-muted-foreground">{choice.hint}</span>
                      </span>
                    </label>
                  );
                })}
              </RadioGroup>
              {errors[`${sn}.consent`] && (
                <p className="text-[13px] font-medium text-destructive">{errors[`${sn}.consent`]}</p>
              )}

              {consent === "not_allowing" && (
                <div className="space-y-2">
                  <Label htmlFor={reasonId} className="block text-sm font-bold">
                    Reason for not allowing your child to attend<span className="text-red-500"> *</span>
                  </Label>
                  <Textarea
                    id={reasonId}
                    rows={3}
                    maxLength={REASON_MAX}
                    disabled={disabled}
                    value={state.reasons[sn] ?? ""}
                    aria-invalid={!!errors[`${sn}.reason`] || undefined}
                    onChange={(e) => onReason(sn, e.target.value)}
                    className="rounded-lg border-slate-200 bg-white shadow-sm"
                  />
                  <div className="flex justify-between gap-3 text-xs">
                    <p className="font-medium text-destructive">{errors[`${sn}.reason`]}</p>
                    <p className="shrink-0 text-muted-foreground">
                      {(state.reasons[sn] ?? "").length}/{REASON_MAX}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Ticks({ detail, state, disabled, onConsent }: Props) {
  return (
    <div className="space-y-2">
      {detail.children.map((child) => {
        const sn = child.studentNumber;
        const coming = state.consent[sn] === "allowing";
        return (
          <label
            key={sn}
            data-child
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors",
              coming ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              disabled && "cursor-not-allowed opacity-60",
            )}>
            <Checkbox
              checked={coming}
              disabled={disabled}
              aria-label={child.name}
              onCheckedChange={(checked) => onConsent(sn, checked === true ? "allowing" : "not_allowing")}
            />
            <span>
              <span className="block text-sm font-bold">{child.name}</span>
              <span className="block text-xs text-muted-foreground">
                {[child.levelLabel, child.className].filter(Boolean).join(" · ")}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
