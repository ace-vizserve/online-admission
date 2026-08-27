import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge, { type StatusProps } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeclarations } from "@/hooks/use-declarations";
import { formatDeclarationDateRange } from "@/lib/declaration-dates";
import { rangeLengthDays } from "@/lib/declaration-rules";
import { SisError } from "@/lib/sis";
import { cn } from "@/lib/utils";
import type { Declaration, DeclarationStatus } from "@/types/declarations";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { ArrowUpDown, CalendarOff, ClipboardCheck, Paperclip, Plane, Plus, Search, Stethoscope } from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router";

const PAGE_SIZE = 10;

/** The status filter's options, using the SIS's own parent-facing wording. */
const STATUS_FILTERS: Array<{ value: DeclarationStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "With the school" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Not approved" },
  { value: "cancelled", label: "Withdrawn" },
];

/** A sortable column header, matching the treatment in components/private/enroll/enrol.tsx. */
function SortableHeader({ label, onToggle }: { label: string; onToggle: () => void }) {
  return (
    <Button variant="ghost" className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter" onClick={onToggle}>
      {label}
      <ArrowUpDown className="ml-2 size-3 md:size-4" />
    </Button>
  );
}

const columns: ColumnDef<Declaration>[] = [
  {
    accessorKey: "studentName",
    header: ({ column }) => (
      <SortableHeader label="Child" onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold capitalize text-sm">{row.original.studentName}</span>
        <span className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest">
          ID: {row.original.studentNumber}
        </span>
      </div>
    ),
  },
  {
    id: "what",
    accessorKey: "declarationType",
    header: () => (
      <Button
        variant="ghost"
        className="hover:bg-transparent p-0 font-bold text-xs md:text-sm uppercase tracking-tighter">
        What
      </Button>
    ),
    cell: ({ row }) => {
      const declaration = row.original;
      const isTravel = declaration.declarationType === "travel";
      const destination = [declaration.destinationCity, declaration.destinationCountry].filter(Boolean).join(", ");

      return (
        <div className="flex flex-col items-start gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full font-bold gap-1",
              isTravel ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700",
            )}>
            {isTravel ? <Plane className="size-3" /> : <CalendarOff className="size-3" />}
            {isTravel ? "Travel" : "Absence"}
          </Badge>

          <div className="text-[12px] leading-tight">
            {isTravel && destination && <p className="font-semibold">{destination}</p>}

            {!isTravel && (declaration.withMedical || declaration.hasUpload || declaration.evidenceUrl) && (
              <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                {declaration.withMedical && (
                  <span className="inline-flex items-center gap-1">
                    <Stethoscope className="size-3 text-muted-foreground" /> Medical certificate
                  </span>
                )}
                {(declaration.hasUpload || declaration.evidenceUrl) && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Paperclip className="size-3" /> Attached
                  </span>
                )}
              </p>
            )}

            {declaration.parentNote && (
              <p className="max-w-[24ch] truncate text-muted-foreground" title={declaration.parentNote}>
                &ldquo;{declaration.parentNote}&rdquo;
              </p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <SortableHeader label="When" onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} />
    ),
    cell: ({ row }) => {
      const { startDate, endDate } = row.original;
      const days = rangeLengthDays(startDate, endDate);

      return (
        <div className="flex flex-col items-start gap-1.5">
          <span className="font-bold text-sm tabular-nums">{formatDeclarationDateRange(startDate, endDate)}</span>
          <Badge variant="secondary" className="rounded-full font-bold">
            {days === 1 ? "1 day" : `${days} days`}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader label="Status" onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} />
    ),
    // statusLabel, never status — "With the school" rather than "Pending".
    cell: ({ row }) => <StatusBadge status={row.original.statusLabel as StatusProps} />,
  },
  {
    accessorKey: "filedAt",
    header: ({ column }) => (
      <SortableHeader label="Filed" onToggle={() => column.toggleSorting(column.getIsSorted() === "asc")} />
    ),
    cell: ({ row }) => (
      <span className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest tabular-nums">
        {format(parseISO(row.original.filedAt), "d MMM yyyy")}
      </span>
    ),
  },
];

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [status, setStatus] = useState<DeclarationStatus | "all">("all");

  const rows = declarations ?? [];
  const filtered = status === "all" ? rows : rows.filter((row) => row.status === status);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  // A stale token would otherwise surface the SIS's raw "invalid or expired token" to a parent.
  if (error instanceof SisError && error.status === 401) return <Navigate to="/login" replace />;

  const hasFilings = rows.length > 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-screen-2xl mx-auto w-full flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary md:text-3xl">Absence &amp; Travel</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Declarations you or your spouse have filed, and where each one has got to
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasFilings && (
            <>
              <div className="relative w-full md:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by child..."
                  value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn("studentName")?.setFilterValue(e.target.value)}
                  className="rounded-lg border-slate-200 bg-white pl-10 shadow-sm focus-visible:ring-indigo-500"
                />
              </div>

              <Select value={status} onValueChange={(value) => setStatus(value as DeclarationStatus | "all")}>
                <SelectTrigger aria-label="Status" className="w-[170px] rounded-lg border-slate-200 bg-white shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          <Button asChild className="shrink-0 gap-2 rounded-lg font-bold">
            <Link to="/admission/services/declarations/new">
              <Plus className="size-4" /> File a declaration
            </Link>
          </Button>
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
            {/* The SIS writes these sentences for parents to read — shown as-is, not rewritten. */}
            <p className="text-sm font-medium text-destructive">{(error as Error).message}</p>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && !hasFilings && <NoDeclarationsPanel />}

      {!isPending && !error && hasFilings && (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Wide content scrolls inside its own container so the page body never does. */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="py-4 text-[11px] font-bold uppercase text-slate-500">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="align-top transition-colors hover:bg-slate-50/50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                        No declarations match this status.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex items-center justify-between py-4">
            <p className="text-xs font-medium text-muted-foreground md:text-sm">
              Showing {table.getRowModel().rows.length} of {rows.length} declarations
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg px-4"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg px-4"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Matches the NoStudentsPanel treatment used by the enrolments table. */
function NoDeclarationsPanel() {
  return (
    <div className="my-8 flex h-[400px] w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
      <div className="rounded-full border border-slate-100 bg-white p-4 shadow-sm">
        <ClipboardCheck className="size-10 text-indigo-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight">No declarations yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          When your child is away — unwell, or travelling — tell the school here and it will be recorded against their
          attendance.
        </p>
      </div>
      <Button asChild className="gap-2 rounded-lg font-bold">
        <Link to="/admission/services/declarations/new">
          <Plus className="size-4" /> File a declaration
        </Link>
      </Button>
    </div>
  );
}
