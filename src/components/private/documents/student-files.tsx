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

const data: StudentFile[] = [
  {
    id: "file1",
    studetName: "Ken Ramos",
    name: "Ken_Passport.pdf",
    status: "approved",
    uploadedAt: "2025-04-20",
    size: "120 KB",
    type: "passport",
    previewUrl: "https://example.com/ken-passport.pdf",
  },
  {
    id: "file2",
    studetName: "Ken Ramos",
    name: "Ken_BirthCert.pdf",
    status: "pending",
    uploadedAt: "2025-04-19",
    size: "95 KB",
    type: "birth_certificate",
    previewUrl: "https://example.com/ken-birthcert.pdf",
  },
];

export type StudentFile = {
  id: string;
  studetName: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  size: string;
  type: "passport" | "birth_certificate" | "form_137" | "report_card" | "others";
  previewUrl: string;
};

export const columns: ColumnDef<StudentFile>[] = [
  {
    accessorKey: "type",
    header: "File Type",
    cell: ({ row }) => {
      const type = (row.getValue("type") as string).replace("_", " ");
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
    accessorKey: "uploadedAt",
    header: "Date Uploaded",
    cell: ({ row }) => <span className="text-xs">{new Date(row.getValue("uploadedAt")).toDateString()}</span>,
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
        <Button variant="default" onClick={() => window.open(file.previewUrl, "_blank")}>
          View
        </Button>
      );
    },
  },
];

function StudentFiles() {
  const location = useLocation();
  const academicYear = location.state?.academicYear || "Default Year";
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  
  const [rowSelection, setRowSelection] = React.useState({});
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,

      rowSelection,
    },
  });
  
  const studentName = data.length > 0 ? data[0].studetName : undefined;

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
