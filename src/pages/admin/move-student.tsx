import { AdminStudent, listStudentsInAY, moveStudentAY } from "@/actions/admin";
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
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Move Student AY</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transfer a student's enrollment record from one academic year to another. All DB records and
          storage files will be moved.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Source AY */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Source Academic Year</p>
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
              <p className="text-sm font-medium text-foreground">Student</p>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {selectedStudent
                        ? `${studentDisplayName(selectedStudent)} — ${selectedStudent.enroleeNumber}`
                        : studentsLoading
                          ? "Loading…"
                          : "Select student…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search by name or enrolee number…" />
                    <CommandList>
                      <CommandEmpty>No students found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((s) => (
                          <CommandItem
                            key={s.enroleeNumber}
                            value={`${s.lastName} ${s.firstName} ${s.enroleeNumber}`}
                            onSelect={() => {
                              setSelectedStudent(s);
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedStudent?.enroleeNumber === s.enroleeNumber
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="flex-1 truncate">{studentDisplayName(s)}</span>
                            <Badge variant="outline" className="ml-2 text-xs shrink-0">
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
              <p className="text-sm font-medium text-foreground">Target Academic Year</p>
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
      {canMove && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Move Preview</CardTitle>
            <CardDescription>Review before confirming. This action cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {studentDisplayName(selectedStudent)}
            </p>
            <p className="text-xs text-muted-foreground">
              Level {selectedStudent.levelApplied} · {selectedStudent.enroleeNumber}
            </p>
            <div className="flex items-center gap-3 text-sm pt-1">
              <div className="text-center">
                <p className="font-medium text-foreground">{ayLabel(sourceAY)}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.enroleeNumber}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-center">
                <p className="font-medium text-foreground">{ayLabel(targetAY)}</p>
                <p className="text-xs text-muted-foreground">New number assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => setConfirmOpen(true)} disabled={!canMove || isPending} className="w-full">
        {isPending ? "Moving…" : "Move Student"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Move</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  This will permanently transfer{" "}
                  <span className="font-medium text-foreground">
                    {selectedStudent ? studentDisplayName(selectedStudent) : ""}
                  </span>{" "}
                  ({selectedStudent?.enroleeNumber}) from{" "}
                  <span className="font-medium text-foreground">{ayLabel(sourceAY)}</span> to{" "}
                  <span className="font-medium text-foreground">{ayLabel(targetAY)}</span>.
                </p>
                <p>All database records and uploaded files will be moved. This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => doMove()} disabled={isPending}>
              {isPending ? "Moving…" : "Confirm Move"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
