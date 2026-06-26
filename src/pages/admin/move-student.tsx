import { AdminStudent, listStudentsInAY, moveStudentAY } from "@/actions/admin";
import PageMetaData from "@/components/page-metadata";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AY_OPTIONS = BACKEND_ACADEMIC_YEARS.filter((ay) => ay !== "ay9999").map((ay) => ({
  value: ay,
  label: `AY ${ay.slice(2)}`,
}));

function studentDisplayName(s: AdminStudent) {
  return `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName}` : ""}`;
}

function ayLabel(ay: string) {
  return AY_OPTIONS.find((o) => o.value === ay)?.label ?? ay;
}

export default function MoveStudent() {
  const { session } = useSession();

  const [sourceAY, setSourceAY] = useState("");
  const [targetAY, setTargetAY] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students", sourceAY],
    queryFn: () => listStudentsInAY(session!, sourceAY),
    enabled: !!session && !!sourceAY,
  });

  const { mutate: doMove, isPending } = useMutation({
    mutationFn: () =>
      moveStudentAY(session!, {
        sourceAY,
        targetAY,
        enroleeNumber: selectedStudent!.enroleeNumber,
      }),
    onSuccess: ({ newEnroleeNumber }) => {
      toast.success(`Moved! New enrolee number: ${newEnroleeNumber}`);
      setSelectedStudent(null);
      setSourceAY("");
      setTargetAY("");
      setConfirmOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setConfirmOpen(false);
    },
  });

  const targetAYOptions = AY_OPTIONS.filter((o) => o.value !== sourceAY);
  const canMove = !!sourceAY && !!targetAY && !!selectedStudent;

  function handleSourceAYChange(val: string) {
    setSourceAY(val);
    setSelectedStudent(null);
    setTargetAY("");
  }

  return (
    <>
      <PageMetaData title="Move Student AY | Admin" description="Transfer a student record between academic years." />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-screen-2xl mx-auto w-full flex flex-col gap-6 py-4 md:gap-8 md:py-6 px-4 md:px-6">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary">Move Student AY</h1>
          <p className="text-sm font-medium text-slate-500">
            Transfer a student's enrollment record — DB rows and uploaded files — from one academic year to another.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selection card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Source AY */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Academic Year</p>
                <Select value={sourceAY} onValueChange={handleSourceAYChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source AY…" />
                  </SelectTrigger>
                  <SelectContent>
                    {AY_OPTIONS.map((ay) => (
                      <SelectItem key={ay.value} value={ay.value}>
                        {ay.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student combobox */}
              {sourceAY && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Student</p>
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="w-full justify-between font-normal">
                        <span className="truncate text-sm">
                          {selectedStudent
                            ? `${studentDisplayName(selectedStudent)} — ${selectedStudent.enroleeNumber}`
                            : studentsLoading
                              ? "Loading…"
                              : "Select student…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Search by name or enrolee number…" />
                        <CommandList>
                          <CommandEmpty>
                            <span className="text-sm font-medium text-slate-500">No students found.</span>
                          </CommandEmpty>
                          <CommandGroup>
                            {students.map((s) => (
                              <CommandItem
                                key={s.enroleeNumber}
                                value={`${s.lastName} ${s.firstName} ${s.enroleeNumber}`}
                                onSelect={() => {
                                  setSelectedStudent(s);
                                  setComboOpen(false);
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg group">
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    selectedStudent?.enroleeNumber === s.enroleeNumber
                                      ? "opacity-100 text-primary"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="flex-1 truncate text-sm font-medium">
                                  {studentDisplayName(s)}
                                </span>
                                <Badge variant="outline" className="ml-2 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                  {s.enroleeNumber}
                                </Badge>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Target AY */}
              {selectedStudent && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Academic Year</p>
                  <Select value={targetAY} onValueChange={setTargetAY}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target AY…" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAYOptions.map((ay) => (
                        <SelectItem key={ay.value} value={ay.value}>
                          {ay.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview card */}
          {canMove ? (
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Move Preview
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500">
                  Review before confirming. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Student</p>
                  <p className="text-lg font-black tracking-tight text-slate-900">
                    {studentDisplayName(selectedStudent)}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Level {selectedStudent.levelApplied} · {selectedStudent.enroleeNumber}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-center space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">From</p>
                    <p className="text-xl font-black text-primary">{ayLabel(sourceAY)}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {selectedStudent.enroleeNumber}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 text-slate-400 shrink-0" />

                  <div className="flex-1 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">To</p>
                    <p className="text-xl font-black text-primary">{ayLabel(targetAY)}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      New number assigned
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={isPending}
                  className="w-full h-11 gap-2 shadow-xl !font-bold bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white !rounded-xl border-b-4 border-blue-900 hover:brightness-110 hover:-translate-y-0.5 active:border-b-0 active:translate-y-0 transition-all duration-150 uppercase tracking-wider">
                  {isPending ? "Moving…" : "Move Student"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100">
                <ArrowRight className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Select a source AY, student, and target AY to preview the move.
              </p>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">Confirm Move</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm font-medium text-slate-500">
                <p>
                  This will permanently transfer{" "}
                  <span className="font-bold text-slate-900">
                    {selectedStudent ? studentDisplayName(selectedStudent) : ""}
                  </span>{" "}
                  ({selectedStudent?.enroleeNumber}) from{" "}
                  <span className="font-bold text-primary">{ayLabel(sourceAY)}</span> to{" "}
                  <span className="font-bold text-primary">{ayLabel(targetAY)}</span>.
                </p>
                <p>All database records and uploaded files will be moved. This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doMove()}
              disabled={isPending}
              className="font-bold bg-primary hover:bg-primary/90">
              {isPending ? "Moving…" : "Confirm Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
