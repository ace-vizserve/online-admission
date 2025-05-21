import { cn } from "@/lib/utils";
import { Badge } from "./badge";

export type StatusProps = "Uploaded" | "Valid" | "Expired" | "Missing";

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

    default:
      break;
  }
}

export default StatusBadge;
