"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { ArrowUpDown, FileUser, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { SingleStudent  } from "@/types";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/client";

const columns: ColumnDef<SingleStudent>[] = [
  {
    accessorKey: "academicYear",
    header: ({ column }) => (
      <Button
        variant={"ghost"}
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Academic Year
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="capitalize text-xs ml-9">{row.getValue("academicYear")}</div>,
  },
  {
    accessorKey: "level",
    header: ({ column }) => (
      <Button
        variant={"ghost"}
        className="cursor-pointer mr-10"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Level
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-xs pl-3 tabular-nums">{row.getValue("level")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant={"ghost"}
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-xs pl-3">{row.getValue("status")}</div>,
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
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mt-2">
          <Link
            to={`/admission/student-file/${student.id}`}
            state={{ academicYear: student.academicYear, studentName: student.studentName }}
          >
            <DropdownMenuItem className="text-xs">
              <FileUser className="mr-1 h-4 w-4" /> View Documents
            </DropdownMenuItem>
          </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function EnrolmentAY() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const { id } = useParams<{ id: string }>();

  console.log("ID from URL:", id);

  const { data: studentData, isLoading } = useQuery({
    queryKey: ["ay2025_enrolment_applications", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrolments")
        .select(`
          id,
          enroleeFullName,
          academicYear,
          grade_level,
          status
        `)
        .eq("id", Number(id));

      console.log("Debug Info:", {
        id: id,
        idType: typeof id,
        convertedId: Number(id),
        rawData: data,
        error: error
      });

      if (error) {
        throw new Error(error.message);
      }

      const safeData = Array.isArray(data) ? data : [];
      console.log("Safe Data:", safeData);

      return safeData.map((record) => ({
        id: record.id,
        studentName: record.enroleeFullName,
        academicYear: `${record.academicYear}`,
        level: record.grade_level,
        status: record.status,
      }));
    },
  });

  const table = useReactTable({
    data: studentData || [],
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

  const studentName = studentData?.[0]?.studentName;

  if (isLoading) {
    return (
      <div className="w-full py-7 md:py-14">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-7 md:py-14">
      <h1 className="font-bold text-lg lg:text-2xl">
        {studentName ? `${studentName}'s Enrolments` : "Student not found"}
      </h1>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter academic years..."
          value={(table.getColumn("academicYear")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("academicYear")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
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
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EnrolmentAY;
