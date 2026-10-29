import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { singaporeDate } from "@/lib/declaration-rules";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { useState } from "react";

/** Long agreements start folded so the name box is not pushed off screen. */
const FOLD_AT = 360;

/** The agreement, the typed name that signs it, and today's date in Singapore. */
export default function SignatureField({
  agreement,
  name,
  onChange,
  id,
  invalid,
  disabled,
}: {
  agreement: string;
  name: string;
  onChange: (name: string) => void;
  id: string;
  invalid: boolean;
  disabled?: boolean;
}) {
  const long = agreement.length > FOLD_AT;
  const [open, setOpen] = useState(false);
  const today = format(parseISO(singaporeDate()), "d MMM yyyy");

  return (
    <div className="space-y-3">
      {agreement && (
        <div className="rounded-lg border bg-slate-50 px-4 py-3">
          <p
            className={cn(
              "whitespace-pre-line text-[13px] leading-relaxed text-slate-700",
              long && !open && "line-clamp-4",
            )}>
            {agreement}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="mt-1.5 text-[13px] font-bold text-primary underline-offset-4 hover:underline">
              {open ? "Show less" : "Read all"}
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Typing your name below constitutes an e-signature.</p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
            Your full name
          </Label>
          <Input
            id={id}
            value={name}
            disabled={disabled}
            maxLength={200}
            autoComplete="name"
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 rounded-lg border-slate-200 bg-white font-semibold italic shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Date</p>
          <p className="flex h-10 items-center rounded-lg border border-dashed px-3 text-sm font-medium text-slate-700">
            {today}
          </p>
        </div>
      </div>
    </div>
  );
}
