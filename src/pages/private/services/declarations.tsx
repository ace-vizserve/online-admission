import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge, { type StatusProps } from "@/components/ui/status-badge";
import { useDeclarations } from "@/hooks/use-declarations";
import { formatDeclarationDateRange } from "@/lib/declaration-dates";
import { SisError } from "@/lib/sis";
import type { Declaration } from "@/types/declarations";
import { format, parseISO } from "date-fns";
import { CalendarOff, ClipboardCheck, Paperclip, Plane, Plus, Stethoscope } from "lucide-react";
import { Link, Navigate } from "react-router";

/**
 * The status list for absence and travel declarations.
 *
 * This is the other half of the feature and not optional: until the SIS notifies parents of an
 * outcome, this page is the only way a parent finds out what happened to something they filed.
 *
 * The list is scoped by CHILD, not by who filed — if the mother files, the father sees it too.
 * It must not be filtered down to the signed-in parent.
 */
export default function Declarations() {
  const { data: declarations, isPending, error } = useDeclarations();

  // A stale token would otherwise surface the SIS's raw "invalid or expired token" to a parent.
  if (error instanceof SisError && error.status === 401) return <Navigate to="/login" replace />;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary p-2 shrink-0">
              <CalendarOff className="size-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Absence &amp; Travel</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-0.5">
            Declarations you or your spouse have filed, and where each one has got to.
          </p>
        </div>

        <Button asChild className="font-bold gap-2 shrink-0">
          <Link to="/admission/services/declarations/new">
            <Plus className="size-4" /> File a declaration
          </Link>
        </Button>
      </div>

      {isPending && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-5">
            {/* The SIS writes these sentences for parents to read — shown as-is, not rewritten. */}
            <p className="text-sm text-destructive font-medium">{(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && declarations?.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-gradient-to-b from-muted/40 to-muted/10 px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mb-5">
            <div className="absolute inset-0 scale-150 rounded-full bg-primary/15 blur-2xl" />
            <div className="relative rounded-2xl bg-primary/10 p-4 shadow-sm ring-4 ring-background">
              <ClipboardCheck className="size-9 text-primary" />
            </div>
          </div>
          <div className="max-w-sm space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">No declarations yet</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When your child is away — unwell, or travelling — tell the school here and it will be recorded against
              their attendance.
            </p>
          </div>
          <Button asChild className="mt-6 font-bold gap-2">
            <Link to="/admission/services/declarations/new">
              <Plus className="size-4" /> File a declaration
            </Link>
          </Button>
        </div>
      )}

      {declarations?.map((declaration, i) => (
        <div
          key={declaration.id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${i * 60}ms` }}>
          <DeclarationCard declaration={declaration} />
        </div>
      ))}
    </div>
  );
}

function DeclarationCard({ declaration }: { declaration: Declaration }) {
  const isTravel = declaration.declarationType === "travel";
  const destination = [declaration.destinationCity, declaration.destinationCountry].filter(Boolean).join(", ");

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="font-bold tracking-tight">{declaration.studentName}</p>
            <Badge variant="secondary" className="gap-1 rounded-full text-xs font-semibold">
              {isTravel ? <Plane className="size-3" /> : <CalendarOff className="size-3" />}
              {isTravel ? "Travel" : "Absence"}
            </Badge>
          </div>

          <p className="text-sm font-semibold text-foreground">
            {formatDeclarationDateRange(declaration.startDate, declaration.endDate)}
          </p>

          {isTravel && destination && <p className="text-sm text-muted-foreground">{destination}</p>}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {declaration.withMedical && (
              <span className="inline-flex items-center gap-1">
                <Stethoscope className="size-3" /> Medical certificate
              </span>
            )}
            {(declaration.hasUpload || declaration.evidenceUrl) && (
              <span className="inline-flex items-center gap-1">
                <Paperclip className="size-3" /> Attached
              </span>
            )}
            <span>Filed {format(parseISO(declaration.filedAt), "d MMM yyyy")}</span>
          </div>

          {declaration.parentNote && (
            <p className="text-sm text-muted-foreground italic pt-1">&ldquo;{declaration.parentNote}&rdquo;</p>
          )}
        </div>

        {/* statusLabel, never status — "With the school" rather than "Pending". */}
        <StatusBadge status={declaration.statusLabel as StatusProps} className="shrink-0 self-start" />
      </CardContent>
    </Card>
  );
}
