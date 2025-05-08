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
import { ArrowUpDown, Copy, MoreHorizontal, User, UserPlus } from "lucide-react";
import * as React from "react";

import { getStudentList } from "@/actions/private";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TStudent } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import "ldrs/react/Tailspin.css";
import { Link } from "react-router";
import { toast } from "sonner";

export const columns: ColumnDef<TStudent>[] = [
  {
    accessorKey: "enroleeFullName",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Student Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="capitalize text-xs pl-4">{row.getValue("enroleeFullName")}</div>,
  },
  {
    accessorKey: "age",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Age
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-xs tabular-nums pl-1">{row.getValue("age")} years old</div>,
  },
  {
    accessorKey: "motherFullName",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Mother's Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-xs pl-3">{row.getValue("motherFullName")}</div>,
  },
  {
    accessorKey: "fatherFullName",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Father's Name
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-xs pl-3">{row.getValue("fatherFullName")}</div>,
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
            <Link to={`/admission/students/${student.studentNumber}`}>
              <DropdownMenuItem className="text-xs">
                <User className="mr-1" /> View full profile
              </DropdownMenuItem>
            </Link>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => copyStudentID(student.studentNumber)} className="text-xs">
              <Copy className="mr-1" />
              Copy Student ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function copyStudentID(studentID: string) {
  navigator.clipboard.writeText(studentID);
  toast.info("Copied!", {
    description: "Student ID has been copied to your clipboard.",
  });
  toast.dismiss();
}

function StudentsList() {
  const { data, isPending } = useQuery({
    queryKey: ["students-list"],
    queryFn: getStudentList,
  });

  if (isPending) {
    return (
      <div className="h-96 w-full flex flex-col gap-4 items-center justify-center my-7 md:my-14">
        <p className="text-sm text-muted-foreground animate-pulse">Fetching students...</p>
        <Tailspin size="30" stroke="3" speed="0.9" color="#262E40" />
      </div>
    );
  }

  if (data?.studentsList == null || !data.studentsList.length) {
    return <NoStudentsPanel />;
  }

  return <StudentsListTable studentsList={data.studentsList} />;
}

function StudentsListTable({ studentsList }: { studentsList: TStudent[] }) {
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

  return (
    <div className="w-full py-7 md:py-14">
      <h1 className="font-bold text-lg lg:text-2xl">Students List</h1>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter names..."
          value={(table.getColumn("enroleeFullName")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("enroleeFullName")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
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
    <div className="rounded-md border bg-muted overflow-hidden w-full h-96 flex flex-col items-center justify-center gap-3 my-7 md:my-14 text-center px-4">
      <h2 className="text-lg font-semibold">No students to show</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        You haven’t added any student records yet. Start by adding a student to see their enrollment information here.
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

export default StudentsList;
