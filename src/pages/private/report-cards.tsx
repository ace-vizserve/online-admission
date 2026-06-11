import { ReportCardViewer } from "@/components/private/report-card-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentCard, useParentReportCards } from "@/hooks/use-parent-report-cards";
import { cn } from "@/lib/utils";
import { BookOpen, Clock, GraduationCap } from "lucide-react";
import { useState } from "react";

export function ReportCards() {
  const state = useParentReportCards();
  const [viewing, setViewing] = useState<{ studentId: never; termNumber: number } | null>(null);

  if (viewing) {
    return (
      <ReportCardViewer
        studentId={viewing.studentId}
        termNumber={viewing.termNumber}
        onClose={() => setViewing(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary p-2 shrink-0">
            <BookOpen className="size-4 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Report Cards</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-0.5">Select a term to view your child's report card.</p>
      </div>

      {(state.status === "idle" || state.status === "loading") && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-28" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-destructive font-medium">Error: {state.message}</p>
          </CardContent>
        </Card>
      )}

      {state.status === "ok" && state.students.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-gradient-to-b from-muted/40 to-muted/10 px-6 py-16 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mb-5">
            <div className="absolute inset-0 scale-150 rounded-full bg-primary/15 blur-2xl" />
            <div className="relative rounded-2xl bg-primary/10 p-4 shadow-sm ring-4 ring-background">
              <GraduationCap className="size-9 text-primary" />
            </div>
          </div>
          <div className="max-w-sm space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">No report cards yet</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The school publishes report cards at the end of each term. They'll appear here the moment they're
              released.
            </p>
          </div>
          <Badge variant="secondary" className="mt-5 gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Clock className="size-3.5" />
            Check back at term's end
          </Badge>
        </div>
      )}

      {state.status === "ok" &&
        state.students.map((child, i) => (
          <div
            key={child.student_id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${i * 60}ms` }}>
            <ChildCard child={child} onView={setViewing} />
          </div>
        ))}
    </div>
  );
}

function ChildCard({
  child,
  onView,
}: {
  child: StudentCard;
  onView: (v: { studentId: never; termNumber: number }) => void;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-base leading-tight truncate">{child.full_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{child.class_label}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs font-semibold">
            {child.ay_code.replace("AY", "AY ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Select term</p>
        <div className="flex flex-wrap gap-2">
          {child.publications.map((pub) => (
            <Button
              key={pub.term_id}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-lg text-sm font-semibold",
                "hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors",
              )}
              onClick={() => onView({ studentId: child.student_id as never, termNumber: pub.term_number ?? 1 })}>
              {pub.term_label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
