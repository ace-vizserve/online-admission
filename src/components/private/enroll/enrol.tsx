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
import { ArrowUpDown, Contact, Copy, MoreHorizontal, User } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { levelYear } from "@/level";
import { Link } from "react-router";
import { toast } from "sonner";

const data: levelYear[] = [
  {
    id: "stu001",
    studentName: "Ken Ramos",
    academicYear: "A.Y.2024",
    level: "Primary 1",
  },
  {
    id: "stu002",
    studentName: "Abe Dela Cruz",
    academicYear: "A.Y.2024",
    level: "Primary 3",
  },
  {
    id: "stu003",
    studentName: "Monserrat Reyes",
    academicYear: "A.Y.2024",
    level: "Primary 2",
  },
  {
    id: "stu004",
    studentName: "Silas Tan",
    academicYear: "A.Y.2024",
    level: "Primary 4",
  },
  {
    id: "stu005",
    studentName: "Carmella Garcia",
    academicYear: "A.Y.2024",
    level: "Primary 2",
  },
];

export const columns: ColumnDef<levelYear>[] = [
  {
    accessorKey: "studentName",
    header: "Student Name",
    cell: ({ row }) => <div className="capitalize text-xs">{row.getValue("studentName")}</div>,
  },
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
    cell: ({ row }) => <div className="text-xs pl-10 tabular-nums">{row.getValue("academicYear")}</div>,
  },
  {
    accessorKey: "level",
    header: ({ column }) => {
      return (
        <Button
          variant={"ghost"}
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Level
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-xs pl-3">{row.getValue("level")}</div>,
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
            <Link to={`/admission/students/${student.id}`}>
              <DropdownMenuItem className="text-xs">
                <User className="mr-1" /> View full profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="text-xs">
              <Contact className="mr-1" onClick={() => navigator.clipboard.writeText(student.id)} />
              View Family Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => copyStudentID(student.id)} className="text-xs">
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
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
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
          value={(table.getColumn("studentName")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("studentName")?.setFilterValue(event.target.value)}
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

export default StudentsList;
