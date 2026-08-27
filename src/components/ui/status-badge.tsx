import { cn } from "@/lib/utils";
import { Badge } from "./badge";

/**
 * The document statuses, plus the four `statusLabel` values the SIS returns for absence and
 * travel declarations. Those are the SIS's own parent-facing wording — "With the school" rather
 * than "Pending", because *pending* reads as *stuck* to a parent watching a form they filed
 * about a sick child. Match on the label, and never substitute our own copy.
 */
export type StatusProps =
  | "Uploaded"
  | "Valid"
  | "Expired"
  | "Missing"
  | "Incomplete"
  | "Rejected"
  | "With the school"
  | "Approved"
  | "Not approved"
  | "Withdrawn";

function StatusBadge({ status, className }: { status: StatusProps; className?: string }) {
  switch (status) {
    case "Missing":
      return (
        <Badge
          className={cn(
            "bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Missing
        </Badge>
      );
    case "Uploaded":
      return (
        <Badge
          className={cn(
            "bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" /> Uploaded
        </Badge>
      );
    case "Valid":
      return (
        <Badge
          className={cn(
            "bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" /> Valid
        </Badge>
      );
    case "Expired":
      return (
        <Badge
          className={cn(
            "bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Expired
        </Badge>
      );
    case "Rejected":
      return (
        <Badge
          className={cn(
            "bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Rejected
        </Badge>
      );

    case "With the school":
      return (
        <Badge
          className={cn(
            "bg-amber-600/10 dark:bg-amber-600/20 hover:bg-amber-600/10 text-amber-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" /> With the school
        </Badge>
      );
    case "Approved":
      return (
        <Badge
          className={cn(
            "bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/10 text-emerald-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" /> Approved
        </Badge>
      );
    case "Not approved":
      return (
        <Badge
          className={cn(
            "bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/10 text-red-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" /> Not approved
        </Badge>
      );
    case "Withdrawn":
      return (
        <Badge
          className={cn(
            "bg-muted hover:bg-muted text-muted-foreground shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mr-2" /> Withdrawn
        </Badge>
      );

    default:
      return (
        <Badge
          className={cn(
            "bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/10 text-blue-500 shadow-none rounded-full",
            className
          )}>
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2 capitalize" /> {status}
        </Badge>
      );
  }
}

export default StatusBadge;
