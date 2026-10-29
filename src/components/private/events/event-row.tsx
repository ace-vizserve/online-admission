import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ParentEventRow, ParentStatus } from "@/types/events";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Link } from "react-router";
import EventStatusBadge from "./status-badge";

export const CLOSING_SOON_DAYS = 7;

/** Whole days from today until the event stops taking answers; negative once closed. */
export function daysUntilClose(closesAt: string, now = new Date()) {
  return differenceInCalendarDays(parseISO(closesAt), now);
}

/** True when it is still open, closes within a week and some child has not answered. */
export function needsAttention(event: ParentEventRow, now = new Date()) {
  const days = daysUntilClose(event.closesAt, now);
  return (
    event.canRegister &&
    days >= 0 &&
    days <= CLOSING_SOON_DAYS &&
    event.children.some((child) => child.status === "not_registered")
  );
}

export function closesLabel(closesAt: string, now = new Date()) {
  const days = daysUntilClose(closesAt, now);
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  return `Closes ${format(parseISO(closesAt), "EEE d MMM")}`;
}

/** One badge when every child shares a status (names underneath); one per child otherwise. */
function Statuses({ event }: { event: ParentEventRow }) {
  const statuses = new Set<ParentStatus>(event.children.map((child) => child.status));

  if (statuses.size <= 1) {
    const [status] = statuses;
    if (!status) return null;
    return (
      <>
        <EventStatusBadge status={status} />
        <span className="text-[11px] text-muted-foreground">
          {event.children.map((child) => child.name).join(", ")}
        </span>
      </>
    );
  }

  return (
    <>
      {event.children.map((child) => (
        <EventStatusBadge key={child.studentNumber} status={child.status} prefix={child.name} />
      ))}
    </>
  );
}

export default function EventRow({ event, now = new Date() }: { event: ParentEventRow; now?: Date }) {
  const start = parseISO(event.startsOn);
  const attention = needsAttention(event, now);
  const needsAnswer = event.children.some((child) => child.status === "not_registered");

  return (
    <div
      data-event-row
      className={cn(
        "flex flex-col gap-3 border-b px-5 py-3 last:border-b-0 md:flex-row md:items-center md:gap-5",
        attention && "bg-amber-50/30",
      )}>
      <div
        className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-primary/5 text-primary"
        style={{ width: 52, height: 52 }}>
        <span className="text-[10px] font-black uppercase tracking-widest">{format(start, "MMM")}</span>
        <span className="text-xl font-black leading-none">{format(start, "dd")}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{event.title}</p>
        <p className="text-[12px] font-medium text-muted-foreground">
          {[event.timeLabel, event.venue, event.scopeLabel].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="text-[12px] leading-tight md:w-[120px]">
        <p className={cn("font-bold", attention && "text-amber-700")}>{closesLabel(event.closesAt, now)}</p>
      </div>

      <div className="flex flex-col gap-1 md:w-[190px]">
        <Statuses event={event} />
      </div>

      <div className="flex md:w-[150px] md:justify-end">
        {event.canRegister && needsAnswer && (
          <Button asChild className="gap-2 rounded-lg font-bold">
            <Link to={`/admission/services/events/${event.slug}`}>Register</Link>
          </Button>
        )}
        {event.canRegister && !needsAnswer && (
          <Button asChild variant="outline" className="rounded-lg">
            <Link to={`/admission/services/events/${event.slug}`}>Edit</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
