import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PendingBadge from "@/components/ui/pending-badge";
import RejectedBadge from "@/components/ui/rejected-badge";
import SuccessBadge from "@/components/ui/success-badge";
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
import * as React from "react";
import { useLocation } from "react-router-dom";
import { StudentDocuments } from "@/types";
import { getStudentDocumentsList } from "@/actions/private";



export const columns: ColumnDef<StudentDocuments>[] = [
  {
    accessorKey: "documentType",
    header: "File Type",
    cell: ({ row }) => {
      const type = (row.getValue("documentType") as string).replace("_", " ");
      return <span className="capitalize text-xs">{type}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const StatusBadge = {
        approved: SuccessBadge,
        pending: PendingBadge,
        rejected: RejectedBadge,
      }[status];
      return StatusBadge && <StatusBadge />;
    },
  },
  {
    accessorKey: "created_at",
    header: "Date Uploaded",
    cell: ({ row }) => <span className="text-xs">{new Date(row.getValue("created_at")).toDateString()}</span>,
  },
  {
    accessorKey: "size",
    header: "File Size",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue("size")}</span>,
  },
  {
    accessorKey: "name",
    header: "File Name",
    cell: ({ row }) => <span className="text-xs">{row.getValue("name")}</span>,
  },
  {
    id: "actions",

    cell: ({ row }) => {
      const file = row.original;
      return (
        <Button variant="default" onClick={() => window.open(file.fileUrl, "_blank")}>
          View
        </Button>
      );
    },
  },
];

function StudentFiles() {
  const { data, isPending } = useQuery({
    queryKey: ["documents-list"],
    queryFn: getStudentDocumentsList,
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
    <div className="w-full">
      <h1 className="font-bold text-lg lg:text-2xl">
        {studentName
          ? `${studentName}'s Uploaded Documents for ${academicYear}`
          : "Student not found"}
      </h1>
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Filter file names..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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

export default StudentFiles;
