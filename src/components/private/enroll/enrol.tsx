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
import { ArrowUpDown, MoreHorizontal, User } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentInfo } from "@/types";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/client";
import { differenceInYears, parseISO } from "date-fns";


export const columns: ColumnDef<StudentInfo>[] = [
{
    accessorKey: "studentName",
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
    cell: ({ row }) => <div className="text-xs pl-4 tabular-nums">{row.getValue("studentName")}</div>,
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
    cell: ({ row }) => <div className="text-xs pl-1 tabular-nums">{row.getValue("age")} years old</div>,
  },
  {
    accessorKey: "motherName",
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
    cell: ({ row }) => <div className="text-xs pl-3 tabular-nums">{row.getValue("motherName")}</div>,
  },
  {
    accessorKey: "fatherName",
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
    cell: ({ row }) => <div className="text-xs pl-3 tabular-nums">{row.getValue("fatherName")}</div>,
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
            <Link to={`/admission/single-student/${student.id}`}>
              <DropdownMenuItem className="text-xs">
                <User className="mr-1" /> View Enrolments
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];


async function fetchStudents(): Promise<StudentInfo[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Failed to retrieve authenticated user');
  }

  const { data: applications, error } = await supabase
    .from('ay2025_enrolment_applications')
    .select('id, enroleeFullName, birthDay, motherFullName, fatherFullName, motherEmail')
    .eq('motherEmail', 'cindzlovesyou@yahoo.com.sg');

  if (error) {
    throw new Error(error.message);
  }

  const uniqueApplications = [];
  const seenNames = new Set();
  for (const app of applications || []) {
    const studentName = app.enroleeFullName;
    if (!seenNames.has(studentName)) {
      uniqueApplications.push({
        ...app,
        studentName,
        motherName: app.motherFullName,
        fatherName: app.fatherFullName,
      });
      seenNames.add(studentName);
    }
  }

  return uniqueApplications.map(student => {
    const age = differenceInYears(new Date(), parseISO(student.birthDay));
    return {
      id: student.id,
      studentName: student.studentName,
      age,
      motherName: student.motherName,
      fatherName: student.fatherName,
    };
  });
}
function StudentsList() {
  const { data, isLoading, isError, error } = useQuery<StudentInfo[]>({
    queryKey: ["ay2025_enrolment_applications"],
    queryFn: fetchStudents,
  });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: data || [],
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

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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

export default StudentsList;
