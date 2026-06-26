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
import { Separator } from "@/components/ui/separator";
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

      <div className="animate-in fade-in duration-300 min-h-[calc(100vh-3rem)] flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-md space-y-8">

          {/* Header */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Admin · Enrollment
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Transfer record</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Move a student's enrollment to a different academic year.
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-6">

            {/* From year */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
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
                  className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
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
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl border-border shadow-xl">
                      <Command>
                        <CommandInput placeholder="Search by name or ID…" />
                        <CommandList>
                          <CommandEmpty>
                            <span className="text-sm font-medium text-muted-foreground">
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
                                <Badge variant="outline" className="text-[10px] font-bold tracking-wider shrink-0">
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
                  className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
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

          {/* Preview + CTA */}
          <AnimatePresence>
            {canMove && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-xl border border-border bg-muted/40 overflow-hidden">

                {/* Student identity */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-primary">
                      {studentInitials(selectedStudent)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-foreground truncate">
                      {studentDisplayName(selectedStudent)}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                      {selectedStudent.enroleeNumber} · Level {selectedStudent.levelApplied}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* AY transfer */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      From
                    </p>
                    <p className="text-lg font-black text-muted-foreground line-through decoration-muted-foreground/40">
                      {ayLabel(sourceAY)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      To
                    </p>
                    <p className="text-lg font-black text-foreground">{ayLabel(targetAY)}</p>
                  </div>
                </div>

                <Separator />

                {/* CTA */}
                <div className="px-5 py-4">
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={isPending}
                    className="w-full h-11 font-bold bg-gradient-to-br from-primary via-blue-600 to-blue-700 text-white rounded-xl border-b-4 border-blue-900 hover:brightness-110 hover:-translate-y-0.5 active:border-b-0 active:translate-y-0 transition-all duration-150 uppercase tracking-wider shadow-lg">
                    {isPending ? "Transferring…" : "Transfer record"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-foreground">
              Transfer this record?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm font-medium text-muted-foreground">
                <p>
                  <span className="font-bold text-foreground">
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
