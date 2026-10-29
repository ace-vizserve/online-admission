import EventRow, { closesLabel, needsAttention } from "@/components/private/events/event-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/use-events";
import { SisError } from "@/lib/sis";
import { cn } from "@/lib/utils";
import type { ParentEventRow } from "@/types/events";
import { format, parseISO } from "date-fns";
import { CalendarCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";

const PAGE_SIZE = 6;
type Tab = "open" | "mine";

function childNames(events: ParentEventRow[]) {
  const names = new Set<string>();
  events.forEach((event) => event.children.forEach((child) => names.add(child.name)));
  return [...names];
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-md px-4 text-sm",
        active ? "bg-white font-bold shadow-sm" : "font-semibold text-slate-600",
      )}>
      {children}
      <span
        className={cn(
          "rounded-full px-2 text-[11px] font-bold",
          active ? "bg-primary text-primary-foreground" : "bg-slate-200 text-slate-600",
        )}>
        {count}
      </span>
    </button>
  );
}

function ClosingBanner({ events }: { events: ParentEventRow[] }) {
  if (events.length === 0) return null;

  const detail = events
    .map((event) => {
      const names = event.children.filter((c) => c.status === "not_registered").map((c) => c.name);
      // Only the first letter goes lower case: "closes Tue 3 Nov", not "closes tue 3 nov".
      const full = closesLabel(event.closesAt);
      const label = full.charAt(0).toLowerCase() + full.slice(1);
      const relative = label === "closes today" || label === "closes tomorrow";
      const when = relative ? `${label} (${format(parseISO(event.closesAt), "EEE d MMM")})` : label;
      return `${event.title} — ${joinNames(names)}, ${when}`;
    })
    .join(" · ");

  return (
    <div
      className="flex items-start gap-3 rounded-xl border bg-amber-50 px-5 py-4"
      style={{ borderColor: "rgba(245,158,11,.4)" }}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
        <TriangleAlert className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">
          {events.length === 1
            ? "1 event closing soon still needs you to register"
            : `${events.length} events closing soon still need you to register`}
        </p>
        <p className="text-[13px] font-medium text-amber-700">{detail}</p>
      </div>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="my-8 flex h-[300px] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <div className="rounded-full border border-slate-100 bg-white p-4 shadow-sm">
        <CalendarCheck className="size-10 text-indigo-500" />
      </div>
      <p className="max-w-sm text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

/** Events the school has opened for this family, and what they have answered so far. */
export default function Events() {
  const [tab, setTab] = useState<Tab>("open");
  const [year, setYear] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const { data, isPending, error } = useEvents(year);

  if (error instanceof SisError && error.status === 401) return <Navigate to="/login" replace />;

  const open = data?.open ?? [];
  const mine = data?.mine ?? [];
  const years = data?.academicYears ?? [];
  // `||`, not `??`: the SIS sends currentAy "" when no year is current.
  const selectedYear = year ?? (data?.currentAy || years[0] || "");
  const closingSoon = open.filter((event) => needsAttention(event));

  const pageCount = Math.max(1, Math.ceil(open.length / PAGE_SIZE));
  const pageIndex = Math.min(page, pageCount - 1);
  const shown = open.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);

  const today = format(new Date(), "yyyy-MM-dd");
  const comingUp = mine.filter((event) => (event.endsOn ?? event.startsOn) >= today);
  const earlier = mine.filter((event) => (event.endsOn ?? event.startsOn) < today);

  const names = joinNames(childNames(open.length ? open : mine));

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-screen-2xl mx-auto w-full flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">Events</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {tab === "open"
              ? `${names ? `Events for ${names}, ` : "Events, "}soonest first. Amber means you haven’t registered yet.`
              : `What you registered ${names || "your children"} for, one school year at a time`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {tab === "mine" && years.length > 0 && (
            <Select
              value={selectedYear}
              onValueChange={(value) => setYear(value)}>
              <SelectTrigger aria-label="School year" className="w-[170px] rounded-lg border-slate-200 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((ay) => (
                  <SelectItem key={ay} value={ay}>
                    {ay}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div role="tablist" className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <TabButton active={tab === "open"} count={open.length} onClick={() => setTab("open")}>
              Open events
            </TabButton>
            <TabButton active={tab === "mine"} count={mine.length} onClick={() => setTab("mine")}>
              My registrations
            </TabButton>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-destructive">{(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && tab === "open" && (
        <>
          <ClosingBanner events={closingSoon} />
          {open.length === 0 ? (
            <EmptyPanel message="No events are open for your children right now." />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {shown.map((event) => (
                  <EventRow key={event.slug} event={event} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground md:text-sm">
                  Showing {shown.length} of {open.length} open events
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg px-4"
                    disabled={pageIndex === 0}
                    onClick={() => setPage(pageIndex - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg px-4"
                    disabled={pageIndex >= pageCount - 1}
                    onClick={() => setPage(pageIndex + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!isPending && !error && tab === "mine" && (
        <>
          {mine.length === 0 ? (
            <EmptyPanel message={`You haven't registered for any events in ${selectedYear || "this year"}.`} />
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {[
                  { label: "Coming up", events: comingUp },
                  { label: `Earlier in ${selectedYear}`, events: earlier },
                ]
                  .filter((group) => group.events.length > 0)
                  .map((group) => (
                    <div key={group.label}>
                      <p className="border-b bg-slate-50/50 px-5 py-2 text-[11px] font-bold uppercase text-slate-500">
                        {group.label}
                      </p>
                      {group.events.map((event) => (
                        <EventRow key={event.slug} event={event} />
                      ))}
                    </div>
                  ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground md:text-sm">
                {mine.length === 1 ? "1 registration" : `${mine.length} registrations`} in {selectedYear} · pick another
                year to see older ones
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
