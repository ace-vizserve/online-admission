import { cn } from "@/lib/utils";
import { STATUS_LABELS, type ParentStatus } from "@/types/events";

const STYLES: Record<ParentStatus, { pill: string; dot: string }> = {
  registered: { pill: "bg-emerald-600/10 text-emerald-500 font-medium", dot: "bg-emerald-500" },
  not_joining: { pill: "bg-slate-100 text-slate-600 font-bold", dot: "" },
  not_registered: { pill: "bg-amber-500/10 text-amber-700 font-bold", dot: "bg-amber-500" },
};

/** A registration status as a pill; `prefix` puts a child's name in front ("Mia · Not joining"). */
export default function EventStatusBadge({ status, prefix }: { status: ParentStatus; prefix?: string }) {
  const style = STYLES[status];

  return (
    <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs", style.pill)}>
      {style.dot && <span className={cn("mr-2 h-1.5 w-1.5 rounded-full", style.dot)} />}
      {prefix ? `${prefix} · ${STATUS_LABELS[status]}` : STATUS_LABELS[status]}
    </span>
  );
}
