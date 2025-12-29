import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, FileText, MessageSquareQuote, MoreHorizontal, RefreshCcw, Search, UserPlus } from "lucide-react";
import * as React from "react";

import { getStudentEnrollmentsList } from "@/actions/private";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { levelYear } from "@/types";
import { QueryObserverResult, RefetchOptions, useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { useMediaQuery } from "react-responsive";
import { Link, useParams } from "react-router";

export const columns: ColumnDef<levelYear>[] = [
  {
    accessorKey: "academicYear",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Academic Year
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="pl-3">
        <Badge className="font-bold rounded-full">A.Y. {row.getValue("academicYear")}</Badge>
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Application Status
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = (row.getValue("status") as string).toLowerCase();

      const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
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

      const config = statusConfig[status.replace(/\s+/g, "_")] || statusConfig.submitted;

      return (
        <div className="pl-2">
          <Badge
            variant="outline"
            className={cn("rounded-full font-bold capitalize tracking-wider border transition-colors", config.color)}>
            <div className={cn("h-1.5 w-1.5 rounded-full mr-2 shrink-0", config.dot)} />
            {config.label}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "gradeLevel",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Level
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="pl-3">
        <Badge variant={"secondary"} className="rounded-full">
          <span className="font-bold capitalize">{row.getValue("gradeLevel")}</span>
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "remarks",
    header: () => {
      return (
        <Button
          variant="ghost"
          className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter hover:bg-transparent">
          Application Remarks
        </Button>
      );
    },
    cell: ({ row }) => {
      const remarks = row.getValue("remarks") as string;
      const plainText = remarks.replace(/<[^>]*>?/gm, "");

      return (
        <div className="flex items-start gap-2.5 min-w-[200px] max-w-[300px]">
          <div className="mt-0.5 shrink-0">
            <div className="rounded-md bg-slate-50 p-1.5 border border-slate-100">
              <MessageSquareQuote className="size-3.5 text-slate-400" />
            </div>
          </div>

          <div className="w-full flex flex-col gap-0.5">
            <span className=" truncate text-[13px] leading-relaxed text-[#4a4d55] font-medium line-clamp-2 italic">
              "{plainText}"
            </span>

            {plainText.length > 60 && <RemarkViewer remarks={plainText} />}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const student = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 w-10 md:h-9 md:w-9 p-0 hover:bg-indigo-50 hover:text-primary rounded-xl transition-all duration-200">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] max-w-[85vw] p-0 rounded-xl border-slate-200 shadow-xl">
            <Link
              to={`/admission/enrolments/application/${student.enroleeNumber}?academicYear=ay${student.academicYear}`}>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 md:py-2.5 cursor-pointer rounded-lg group focus:bg-primary text-primary focus:text-white">
                <div className="flex items-center justify-center size-9 md:size-8 rounded-lg bg-indigo-50 group-focus:bg-white/20">
                  <FileText className="size-5 md:size-4 text-primary group-focus:text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">View application</span>
                  <span className="text-[10px] md:text-[12px] opacity-80 font-medium">Enrolment details</span>
                </div>
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function RemarkViewer({ remarks }: { remarks: string }) {
  const isDesktop = useMediaQuery({
    query: "(min-width: 786px)",
  });

  if (isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"link"} size={"sm"} className="text-[11px] font-bold text-primary uppercase">
            View full remark
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 shadow-xl border-slate-100">
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-primary" /> Application Remarks
            </h4>
            <p className="break-all text-[13px] leading-relaxed text-[#4a4d55] font-medium italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{remarks}"
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"link"} size={"sm"} className="text-[11px] font-bold text-primary uppercase">
          View full remark
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-t-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-left flex items-center gap-2">
            <MessageSquareQuote className="size-5 text-primary" />
            Application Remarks
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="break-all text-sm leading-relaxed text-[#4a4d55] font-medium italic bg-slate-50 p-4 rounded-xl border border-slate-100">
            "{remarks}"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SingleEnrol() {
  const params = useParams();
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["students-enrolments-list", params.id],
    queryFn: async () => {
      return await getStudentEnrollmentsList(params.id!);
    },
  });

  if (isPending) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
        <Tailspin size="30" stroke="5" speed="0.9" color="#4F46E5" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching students...</p>
      </div>
    );
  }

  if (!data?.studentsList) {
    return <NoStudentsPanel />;
  }

  return <StudentsListTable refetch={refetch} isRefetching={isRefetching} studentsList={data.studentsList} />;
}

type StudentsListTableProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<any, Error>>;
  isRefetching: boolean;
  studentsList: levelYear[];
};

function StudentsListTable({ studentsList, isRefetching, refetch }: StudentsListTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: studentsList,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const studentName = studentsList[0]?.studentName;

  return (
    <div className=" w-full py-7 md:py-14">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <h1 className="font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
          {studentName ? `${studentName}` : "Student not found"}
        </h1>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter grade level..."
              value={(table.getColumn("gradeLevel")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("gradeLevel")?.setFilterValue(event.target.value)}
              className="pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-sm"
            />
          </div>
          <Button
            disabled={isRefetching}
            onClick={() => refetch()}
            size="icon"
            variant="outline"
            className="hover:border-indigo-200 hover:bg-indigo-50 rounded-lg">
            <RefreshCcw className={cn("size-4 text-slate-600", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-[11px] font-bold text-slate-500 uppercase py-4">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No matching student records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <p className="text-xs md:text-sm text-muted-foreground font-medium">
          Showing {table.getRowModel().rows.length} of {studentsList.length} students
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
    </div>
  );
}

function NoStudentsPanel() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 w-full h-[400px] flex flex-col items-center justify-center gap-4 my-8 text-center px-6">
      <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100">
        <UserPlus className="size-10 text-indigo-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-primary">Your Student Registry is Empty</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Begin by adding your first student record to start tracking their academic journey.
        </p>
      </div>

      <Link
        to="/enrol-student"
        className={buttonVariants({
          size: "lg",
          className:
            "gap-2 shadow-xl bg-gradient-to-r from-primartext-primary to-blue-600 text-white !rounded-xl border-b-4 border-indigo-800 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all mt-2",
        })}>
        <UserPlus className="size-5" />
        Add Student Record
      </Link>
    </div>
  );
}

export default SingleEnrol;
