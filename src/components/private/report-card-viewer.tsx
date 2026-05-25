import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReportCard } from "@/hooks/use-report-card";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarDays, Clock, GraduationCap } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  studentId: never;
  termNumber: number;
  onClose: () => void;
};

export function ReportCardViewer({ studentId, termNumber, onClose }: Props) {
  const state = useReportCard(studentId, termNumber);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-20" />
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (state.status === "error") {
    const msg =
      state.message === "no active publication window for this term"
        ? "This report card is not currently available. The school may have closed the viewing window."
        : "Unable to load report card. Please try again.";
    return (
      <div className="mx-auto px-4 py-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 -ml-2">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-destructive">{msg}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { payload } = state;
  const term = payload.terms[0];
  const attendance = payload.attendance[0];
  const comment = payload.comments[0];

  const examinable = payload.subjects.filter((s) => s.subject.is_examinable);
  const nonExaminable = payload.subjects.filter((s) => !s.subject.is_examinable);

  const termCell = (row: (typeof payload.subjects)[0]) =>
    termNumber === 1 ? row.t1 : termNumber === 2 ? row.t2 : termNumber === 3 ? row.t3 : row.t4;

  return (
    <div className="w-full mx-auto px-4 py-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 -ml-2">
        <ArrowLeft className="size-4" />
        Back
      </Button>

      {/* Student header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary p-2 shrink-0">
            <GraduationCap className="size-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight leading-tight">{payload.student.full_name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {payload.level.label} {payload.section.name} · {payload.ay.label}
            </p>
          </div>
        </div>
        <div className="pl-11">
          <Badge variant="secondary" className="text-xs font-semibold">
            {term?.label ?? `Term ${termNumber}`}
          </Badge>
        </div>
      </div>

      {/* Attendance */}
      {attendance && (
        <div className="space-y-3">
          <SectionLabel>Attendance</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <AttendanceStat
              label="School Days"
              value={attendance.school_days}
              icon={<CalendarDays className="size-4" />}
            />
            <AttendanceStat
              label="Days Present"
              value={attendance.days_present}
              icon={<CalendarDays className="size-4" />}
              colorClass="text-emerald-600"
            />
            <AttendanceStat
              label="Days Late"
              value={attendance.days_late}
              icon={<Clock className="size-4" />}
              colorClass={attendance.days_late ? "text-amber-600" : undefined}
            />
          </div>
        </div>
      )}

      {/* Grades */}
      <div className="space-y-3">
        <SectionLabel>Grades</SectionLabel>
        <Card className="shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-bold text-xs uppercase tracking-tighter w-full">Subject</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-tighter text-right pr-4">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examinable.map((row) => {
                const cell = termCell(row);
                return (
                  <TableRow key={row.subject.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-sm py-2.5">{row.subject.name}</TableCell>
                    <TableCell className="text-right pr-4 py-2.5">
                      {cell.is_na ? (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      ) : cell.quarterly !== null ? (
                        <ScoreBadge score={cell.quarterly} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {nonExaminable.length > 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="py-2 px-4">
                    <p className="text-xs italic text-muted-foreground">Non-examinable subjects</p>
                  </TableCell>
                </TableRow>
              )}

              {nonExaminable.map((row) => {
                const cell = termCell(row);
                return (
                  <TableRow key={row.subject.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-sm py-2.5">{row.subject.name}</TableCell>
                    <TableCell className="text-right pr-4 py-2.5 text-sm">
                      {cell.is_na ? <span className="text-xs text-muted-foreground">N/A</span> : (cell.letter ?? "—")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* FCA Comment */}
      {comment?.comment && (
        <div className="space-y-3">
          <SectionLabel>
            Form Class Adviser's Comments
            {term?.virtue_theme ? ` · HFSE Virtues: ${term.virtue_theme}` : ""}
          </SectionLabel>
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed">{comment.comment}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />
      <p className="text-xs text-muted-foreground">
        Form adviser: <span className="font-medium text-foreground">{payload.section.form_class_adviser ?? "—"}</span>
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function AttendanceStat({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: number | null;
  icon: ReactNode;
  colorClass?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-1">
        <div className={cn("text-muted-foreground", colorClass)}>{icon}</div>
        <div className={cn("text-2xl font-black tabular-nums", colorClass)}>{value ?? "—"}</div>
        <div className="text-xs text-muted-foreground font-medium leading-tight">{label}</div>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 80
        ? "text-blue-700 bg-blue-50 border-blue-200"
        : score >= 75
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-destructive bg-destructive/10 border-destructive/20";
  return (
    <span
      className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-bold tabular-nums", color)}>
      {score}
    </span>
  );
}
