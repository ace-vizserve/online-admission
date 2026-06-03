import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusStyle = { color: string; dot: string; label: string };

/**
 * SIS enrollment lifecycle statuses (from ay{YYYY}_enrolment_status.applicationStatus).
 * Keys are normalized: lowercased with whitespace replaced by underscores.
 */
export const STATUS_BADGE_CONFIG: Record<string, StatusStyle> = {
  submitted: {
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-600",
    label: "Submitted",
  },
  ongoing_verification: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-600",
    label: "Ongoing Verification",
  },
  processing: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-600",
    label: "Processing",
  },
  enrolled: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-600",
    label: "Enrolled",
  },
  "enrolled_(conditional)": {
    color: "bg-teal-100 text-teal-700 border-teal-200",
    dot: "bg-teal-600",
    label: "Enrolled (Conditional)",
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-600",
    label: "Cancelled",
  },
  withdrawn: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-600",
    label: "Withdrawn",
  },
};

function normalize(status: string) {
  return status.toLowerCase().replace(/\s+/g, "_");
}

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_BADGE_CONFIG[normalize(status)] ?? STATUS_BADGE_CONFIG.submitted;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = getStatusStyle(status);

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-bold capitalize tracking-wider border transition-colors", config.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5 shrink-0", config.dot)} />
      {config.label}
    </Badge>
  );
}
