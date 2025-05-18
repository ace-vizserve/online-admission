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
import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router";
import * as React from "react";
import { Tailspin } from "ldrs/react";
import { UserPlus } from "lucide-react";
import "ldrs/react/Tailspin.css";
import { useQuery } from "@tanstack/react-query";
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

  if (!data?.documentsList) {
    return <NoStudentsPanel />;
  }

  // Remove duplicates by unique id or a combination of fields
  const uniqueStudents: StudentDocuments[] = [];
  const seen = new Set();
  for (const doc of data.documentsList) {
    const key = doc.id || `${doc.documentType}-${doc.created_at}-${doc.fileUrl}`;
    console.log('Deduplication key:', key); // Debugging
    if (!seen.has(key)) {
      seen.add(key);
      uniqueStudents.push({
        student_enrolments: {
          enroleeFullName: doc.student_enrolments?.[0]?.enroleeFullName || '',
          academicYear: doc.student_enrolments?.[0]?.academicYear || new Date().getFullYear().toString()
        },
        studentID: doc.studentID || '',
        documentType: doc.documentType || '',
        fileUrl: doc.fileUrl || '',
        status: doc.status || '',
        created_at: doc.created_at || new Date().toISOString()
      } as StudentDocuments);
    }
  }

  return <StudentsListTable studentsList={uniqueStudents} />;
}

function StudentsListTable({ studentsList }: { studentsList: StudentDocuments[] }) {
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
        {studentsList[0]?.student_enrolments.enroleeFullName
          ? `${studentsList[0].student_enrolments.enroleeFullName}'s Uploaded Documents for ${studentsList[0].student_enrolments.academicYear}`
          : "Student not found"}
      </h1>
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Filter file names..."
          value={(table.getColumn("documentType")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("documentType")?.setFilterValue(event.target.value)}
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

export default StudentFiles;
