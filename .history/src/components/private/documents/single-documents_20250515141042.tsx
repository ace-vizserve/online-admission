"use client";

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
import { ArrowUpDown, MoreHorizontal, RefreshCcw, User, UserPlus } from "lucide-react";
import * as React from "react";

import { getStudentDocumentsList } from "@/actions/private";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StudentDocuments } from "@/types";
import { QueryObserverResult, RefetchOptions, useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { Link } from "react-router";


export const columns: ColumnDef<StudentDocuments>[] = [
  {
    accessorKey: "academicYear",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Academic Year
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="capitalize text-xs pl-4">{row.getValue("academicYear")}</div>,
  },
  {
    accessorKey: "grade_level",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Grade Level
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="capitalize text-xs pl-4">{row.getValue("grade_level")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stattus
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="capitalize text-xs pl-4">{row.getValue("status")}</div>,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const student = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mt-2">
            <Link to={`/admission/uploaded-documents/${student.studentID}`}>
              <DropdownMenuItem className="text-xs">
                <User className="mr-1" /> View Enrolment Information
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function SingleDocuments() {
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["students-documents-list"],
    queryFn: getStudentEnrollmentList,
  });

  if (isPending) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
        <p className="text-sm text-muted-foreground animate-pulse">Fetching students...</p>
        <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
      </div>
    );
  }

  if (!data?.studentsList) {
    return <NoStudentsPanel />;
  }

  const students = data.studentsList.map(student => ({
    id: student.studentID,
    studentName: student.enroleeFullName,
    academicYear: student.academicYear,
    grade_level: student.grade_level,
    status: student.status
  }));

  return <StudentsListTable refetch={refetch} isRefetching={isRefetching} studentsList={students} />;
}

type StudentsListTableProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<any, Error>>;
  isRefetching: boolean;
  studentsList: Document[];
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
    <div className="w-full py-7 md:py-14">
      <h1 className="font-bold text-lg lg:text-2xl">
        {studentName ? `${studentName} Document List` : "Student not found"}
      </h1>
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Filter grade level..."
          value={(table.getColumn("level")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("level")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <Button disabled={isRefetching} onClick={() => refetch()} size={"icon"} variant={"outline"}>
          <RefreshCcw
            className={cn({
              "animate-spin": isRefetching,
            })}
          />
        </Button>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function NoStudentsPanel() {
  return (
    <div className="rounded-md border bg-muted overflow-hidden w-full h-96 flex flex-col items-center justify-center gap-1.5 md:gap-3 my-7 md:my-14 text-center px-4">
      <h2 className="text-lg md:text-xl font-semibold">No students to show</h2>
      <p className="text-xs md:text-sm text-muted-foreground max-w-prose text-balance">
        You haven't added any student records yet. Start by adding a student to see their enrollment information here.
      </p>

      <Link
        to={"/enrol-student"}
        className={buttonVariants({
          size: "lg",
          className: "gap-2 mt-2",
        })}>
        <UserPlus className="w-5 h-5" />
        Add Student
      </Link>
    </div>
  );
}

export default SingleDocuments;
