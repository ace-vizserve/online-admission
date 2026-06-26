import { AdminStudent, BulkMoveRowResult, listStudentsInAY, moveStudentsBulkAY } from "@/actions/admin";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BACKEND_ACADEMIC_YEARS } from "@/config/academic-years";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, useMemo } from "react";
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
  const [levelFilter, setLevelFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students", sourceAY],
    queryFn: () => listStudentsInAY(session!, sourceAY),
    enabled: !!session && !!sourceAY,
  });

  const { mutate: doBulkMove, isPending } = useMutation({
    mutationFn: () =>
      moveStudentsBulkAY(session!, {
        sourceAY,
        targetAY,
        enroleeNumbers: Array.from(selected),
      }),
    onSuccess: ({ moved, failed, results }) => {
      if (failed === 0) {
        toast.success(`Moved ${moved} student${moved !== 1 ? "s" : ""}.`);
      } else {
        toast.success(`Moved ${moved} · ${failed} failed`);
        const failedNums = results
          .filter((r: BulkMoveRowResult) => !r.ok)
          .map((r: BulkMoveRowResult) => r.enroleeNumber)
          .join(", ");
        toast.error(`Failed: ${failedNums}`);
      }
      setSelected(new Set());
      setSourceAY("");
      setTargetAY("");
      setLevelFilter("all");
      setConfirmOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setConfirmOpen(false);
    },
  });

  // Sorted unique levels from the fetched student list
  const levels = useMemo(
    () => [...new Set(students.map((s) => s.levelApplied))].sort(),
    [students],
  );

  // Students visible after applying the level filter
  const filteredStudents = useMemo(
    () => (levelFilter === "all" ? students : students.filter((s) => s.levelApplied === levelFilter)),
    [students, levelFilter],
  );

  const filteredIds = useMemo(
    () => new Set(filteredStudents.map((s) => s.enroleeNumber)),
    [filteredStudents],
  );

  const allFilteredSelected =
    filteredStudents.length > 0 && filteredStudents.every((s) => selected.has(s.enroleeNumber));

  const someFilteredSelected = filteredStudents.some((s) => selected.has(s.enroleeNumber));

  function toggleStudent(enroleeNumber: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(enroleeNumber)) next.delete(enroleeNumber);
      else next.add(enroleeNumber);
      return next;
    });
  }

  function toggleAll() {
    if (allFilteredSelected) {
      // Deselect all currently filtered
      setSelected((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all currently filtered
      setSelected((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  const targetAYOptions = AY_OPTIONS.filter((o) => o.value !== sourceAY);
  const canMove = !!sourceAY && !!targetAY && selected.size > 0;

  function handleSourceAYChange(val: string) {
    setSourceAY(val);
    setSelected(new Set());
    setTargetAY("");
    setLevelFilter("all");
  }

  return (
    <>
      <PageMetaData
        title="Transfer Records | Admin"
        description="Move student enrollment records between academic years."
      />

      <div className="animate-in fade-in duration-300 min-h-[calc(100vh-3rem)] flex items-start justify-center py-12 px-6">
        <div className="w-full max-w-lg space-y-8">

          {/* Header */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Admin · Enrollment
            </p>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Transfer records</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Move students' enrollment to a different academic year.
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

            {/* Student multi-select */}
            <AnimatePresence>
              {sourceAY && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-3">

                  {/* Level filter + selected count */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Students
                    </label>
                    <div className="flex items-center gap-3">
                      {selected.size > 0 && (
                        <span className="text-[11px] font-bold text-primary">
                          {selected.size} selected
                        </span>
                      )}
                      <Select
                        value={levelFilter}
                        onValueChange={(v) => setLevelFilter(v)}
                        disabled={studentsLoading || levels.length === 0}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue placeholder="All levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All levels</SelectItem>
                          {levels.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Checklist panel */}
                  <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
                    {/* Select-all header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/60">
                      <Checkbox
                        id="select-all"
                        checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                        disabled={studentsLoading || filteredStudents.length === 0}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground cursor-pointer select-none">
                        {allFilteredSelected
                          ? `Deselect all (${filteredStudents.length})`
                          : `Select all (${filteredStudents.length})`}
                      </label>
                    </div>

                    {/* Student rows */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {studentsLoading ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-medium text-muted-foreground">Loading…</p>
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-medium text-muted-foreground">No students in this year.</p>
                        </div>
                      ) : (
                        filteredStudents.map((s) => (
                          <label
                            key={s.enroleeNumber}
                            htmlFor={`student-${s.enroleeNumber}`}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors",
                              selected.has(s.enroleeNumber)
                                ? "bg-primary/5"
                                : "hover:bg-muted/80",
                            )}>
                            <Checkbox
                              id={`student-${s.enroleeNumber}`}
                              checked={selected.has(s.enroleeNumber)}
                              onCheckedChange={() => toggleStudent(s.enroleeNumber)}
                            />
                            <span className="flex-1 text-sm font-medium text-foreground truncate">
                              {studentDisplayName(s)}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                              {s.levelApplied}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold tracking-wider shrink-0">
                              {s.enroleeNumber}
                            </Badge>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* To year */}
            <AnimatePresence>
              {sourceAY && students.length > 0 && (
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

                {/* Summary */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-primary">{selected.size}</span>
                  </div>
                  <div>
                    <p className="font-black text-foreground">
                      {selected.size} student{selected.size !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                      selected for transfer
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
                    variant="cta"
                    size="lg"
                    onClick={() => setConfirmOpen(true)}
                    disabled={isPending}
                    className="w-full uppercase tracking-wider">
                    {isPending
                      ? "Transferring…"
                      : `Transfer ${selected.size} record${selected.size !== 1 ? "s" : ""}`}
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
              Transfer these records?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm font-medium text-muted-foreground">
                <p>
                  <span className="font-bold text-foreground">{selected.size} student{selected.size !== 1 ? "s" : ""}</span>
                  {" "}will move from{" "}
                  <span className="font-bold text-primary">{ayLabel(sourceAY)}</span> to{" "}
                  <span className="font-bold text-primary">{ayLabel(targetAY)}</span>.
                </p>
                <p>All database records and uploaded files transfer with them. Students are moved one at a time — you'll see a summary of successes and failures when done.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => doBulkMove()}
              disabled={isPending}
              className="font-bold bg-primary hover:bg-primary/90">
              {isPending ? "Transferring…" : `Yes, transfer ${selected.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
