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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const AY_OPTIONS = BACKEND_ACADEMIC_YEARS.filter((ay) => ay !== "ay9999").map((ay) => ({
  value: ay,
  label: `AY ${ay.slice(2)}`,
}));

function studentDisplayName(s: AdminStudent) {
  return `${s.lastName}, ${s.firstName}${s.middleName ? ` ${s.middleName}` : ""}`;
}

function studentInitials(s: AdminStudent) {
  return `${s.firstName[0] ?? ""}${s.lastName[0] ?? ""}`.toUpperCase();
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
      toast.success(`Transferred. New number: ${newEnroleeNumber}`);
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
      <PageMetaData
        title="Transfer Record | Admin"
        description="Move a student enrollment record between academic years."
      />

      <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-3rem)]">
        {/* ── Left: setup panel ───────────────────────────────────────── */}
        <div className="flex flex-col gap-10 px-8 py-12 md:px-14 border-r border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Admin · Enrollment
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Transfer record</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Move a student's enrollment — rows and files — to a different year.
            </p>
          </div>

          <div className="flex flex-col gap-7">
            {/* From year */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                From year
              </label>
              <Select value={sourceAY} onValueChange={handleSourceAYChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a year…" />
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

            {/* Student */}
            <AnimatePresence>
              {sourceAY && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Student
                  </label>
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="w-full justify-between font-normal text-left">
                        <span className="truncate text-sm">
                          {selectedStudent
                            ? studentDisplayName(selectedStudent)
                            : studentsLoading
                              ? "Loading…"
                              : "Who are we moving?"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-slate-200 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Search by name or ID…" />
                        <CommandList>
                          <CommandEmpty>
                            <span className="text-sm font-medium text-slate-500">
                              No students in this year.
                            </span>
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
                                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer">
                                <Check
                                  className={cn(
                                    "h-4 w-4 shrink-0 text-primary",
                                    selectedStudent?.enroleeNumber === s.enroleeNumber
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="flex-1 truncate text-sm font-medium">
                                  {studentDisplayName(s)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold tracking-wider shrink-0">
                                  {s.enroleeNumber}
                                </Badge>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </motion.div>
              )}
            </AnimatePresence>

            {/* To year */}
            <AnimatePresence>
              {selectedStudent && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    To year
                  </label>
                  <Select value={targetAY} onValueChange={setTargetAY}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pick a year…" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAYOptions.map((ay) => (
                        <SelectItem key={ay.value} value={ay.value}>
                          {ay.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: dark staging panel ────────────────────────────────── */}
        <div className="bg-slate-950 flex flex-col items-center justify-center px-8 py-12 md:px-14 min-h-[360px] lg:min-h-0">
          <AnimatePresence mode="wait">
            {!selectedStudent ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-4 text-slate-700">
                  <span className="text-3xl font-black">AY ——</span>
                  <ArrowRight className="h-5 w-5" />
                  <span className="text-3xl font-black">AY ——</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Select a year and student to stage the transfer.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedStudent.enroleeNumber + targetAY}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex flex-col items-center gap-10 w-full max-w-xs">
                {/* Student identity */}
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                    <span className="text-2xl font-black text-primary">
                      {studentInitials(selectedStudent)}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white tracking-tight leading-snug">
                      {studentDisplayName(selectedStudent)}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-500 uppercase tracking-widest">
                      {selectedStudent.enroleeNumber} · Level {selectedStudent.levelApplied}
                    </p>
                  </div>
                </div>

                {/* AY transfer — source strikes out as destination lights up */}
                <div className="flex items-center gap-5 w-full">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">
                      From
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-black transition-all duration-300",
                        targetAY
                          ? "text-slate-600 line-through decoration-slate-600/60"
                          : "text-white",
                      )}>
                      {ayLabel(sourceAY)}
                    </p>
                  </div>

                  <ArrowRight
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors duration-300",
                      targetAY ? "text-primary" : "text-slate-700",
                    )}
                  />

                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-1">
                      To
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-black transition-colors duration-300",
                        targetAY ? "text-white" : "text-slate-700",
                      )}>
                      {targetAY ? ayLabel(targetAY) : "——"}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!canMove || isPending}
                  className="w-full h-11 font-bold bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white rounded-xl border-b-4 border-blue-900 hover:brightness-110 hover:-translate-y-0.5 active:border-b-0 active:translate-y-0 transition-all duration-150 uppercase tracking-wider shadow-xl disabled:opacity-25 disabled:translate-y-0 disabled:border-b-4 disabled:shadow-none">
                  {isPending ? "Transferring…" : "Transfer record"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-slate-900">
              Transfer this record?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm font-medium text-slate-500">
                <p>
                  <span className="font-bold text-slate-900">
                    {selectedStudent ? studentDisplayName(selectedStudent) : ""}
                  </span>{" "}
                  ({selectedStudent?.enroleeNumber}) will move from{" "}
                  <span className="font-bold text-primary">{ayLabel(sourceAY)}</span> to{" "}
                  <span className="font-bold text-primary">{ayLabel(targetAY)}</span>.
                </p>
                <p>All database records and uploaded files transfer with them. You can't undo this.</p>
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
              {isPending ? "Transferring…" : "Yes, transfer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
