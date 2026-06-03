"use client";

import { RefetchOptions, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ArrowUpDown, MoreHorizontal, RefreshCcw, Search, User, UserPlus } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { Link } from "react-router";

import { getStudentList } from "@/actions/private";
import { StatusBadge } from "@/components/private/enroll/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { TStudent } from "@/types";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";

const columns: ColumnDef<TStudent>[] = [
  {
    accessorKey: "enrollmentStatus",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Status
        <ArrowUpDown className="ml-2 size-3 md:size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("enrollmentStatus") as string;

      return (
        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge status={status} />
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full text-[10px] font-bold uppercase tracking-wider",
              row.original.isVizSchool ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600",
            )}>
            {row.original.isVizSchool ? "VizSchool" : "HFSE-IS"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "studentName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Student Name
        <ArrowUpDown className="ml-2 size-3 md:size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-bold capitalize text-sm">{row.getValue("studentName")}</span>
        <span className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest">
          ID: {row.original.studentNumber}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "age",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="p-0 font-bold text-xs md:text-sm uppercase tracking-tighter"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Age
        <ArrowUpDown className="ml-2 size-3 md:size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="rounded-full font-bold">
        {row.getValue("age")} years old
      </Badge>
    ),
  },
  {
    accessorKey: "mothersName",
    header: () => (
      <Button
        variant="ghost"
        className="hover:bg-transparent p-0 font-bold text-xs md:text-sm uppercase tracking-tighter">
        Family Contacts
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-[12px] leading-tight">
        <p className="font-semibold">
          <span className="font-medium text-muted-foreground">Mother:</span> {row.getValue("mothersName")}
        </p>
        <p className="font-semibold">
          <span className="font-medium text-muted-foreground">Father:</span> {row.original.fathersName}
        </p>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
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
          <Link to={`/admission/students/${row.original.enroleeNumber}`}>
            <DropdownMenuItem className="flex items-center gap-3 px-3 py-3 md:py-2.5 cursor-pointer rounded-lg group focus:bg-primary text-primary focus:text-white">
              <div className="flex items-center justify-center size-9 md:size-8 rounded-lg bg-indigo-50 group-focus:bg-white/20">
                <User className="size-5 md:size-4 text-primary group-focus:text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">View Profile</span>
                <span className="text-[10px] md:text-[12px] opacity-80 font-medium">Enrolment details</span>
              </div>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function StudentsList() {
  const { session } = useSession();
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["students-list", session?.user.email],
    queryFn: getStudentList,
  });

  if (isPending) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center">
        <Tailspin size="40" stroke="5" speed="0.9" color="#4F46E5" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Syncing student records...</p>
      </div>
    );
  }

  if (!data?.studentsList?.length) {
    return <NoStudentsPanel />;
  }

  return <StudentsListTable refetch={refetch} isRefetching={isRefetching} studentsList={data.studentsList} />;
}

function StudentsListTable({ studentsList, isRefetching, refetch }: StudentsListTableProps) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });

  const table = useReactTable({
    data: studentsList,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { pagination, sorting, columnFilters },
    onPaginationChange: setPagination,
  });

  function updateDashboardDetails() {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["section-cards", session?.user.email] });
  }

  return (
    <div className="w-full py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-extrabold text-2xl md:text-3xl text-primary tracking-tight">Students List</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage and track all enrolled student profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by name..."
              value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("studentName")?.setFilterValue(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-lg shadow-sm"
            />
          </div>
          <Button
            disabled={isRefetching}
            onClick={updateDashboardDetails}
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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[11px] font-bold text-slate-500 uppercase py-4">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
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
            "gap-2 shadow-xl !font-bold bg-gradient-to-r from-primary to-blue-600 text-white !rounded-xl border-b-4 border-indigo-800 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all mt-2",
        })}>
        <UserPlus className="size-5" />
        Add Student Record
      </Link>
    </div>
  );
}

type StudentsListTableProps = {
  refetch: (options?: RefetchOptions | undefined) => Promise<unknown>;
  isRefetching: boolean;
  studentsList: TStudent[];
};

export default StudentsList;
