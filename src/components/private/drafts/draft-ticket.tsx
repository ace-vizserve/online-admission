import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { isExpiringSoon } from "@/lib/draft-storage";
import { cn } from "@/lib/utils";
import { EnrolNewStudentFormState, VizSchoolEnrolNewStudentFormState } from "@/types";
import { EnrolNewStudentDraftStore } from "@/zustand-store";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { ArrowRight, Hourglass, Trash2 } from "lucide-react";

// ─── Shared types & utilities ────────────────────────────────────────────────

export type DraftRow = {
  state: EnrolNewStudentDraftStore;
  flowType: "hfse-is" | "viz-school";
};

export const STEP_NAMES = [
  "Student Information",
  "Family Information",
  "Enrolment Information",
  "Upload Requirements",
];

export function getDraftName(state: EnrolNewStudentDraftStore, flowType: "hfse-is" | "viz-school"): string {
  if (flowType === "hfse-is") {
    const fs = state.formState as Partial<EnrolNewStudentFormState>;
    const first = fs?.studentInfo?.studentDetails?.firstName;
    const last = fs?.studentInfo?.studentDetails?.lastName;
    if (first || last) return `${first ?? ""} ${last ?? ""}`.trim();
  } else {
    const fs = state.formState as Partial<VizSchoolEnrolNewStudentFormState>;
    const first = fs?.studentInfo?.studentDetails?.firstName;
    const last = fs?.studentInfo?.studentDetails?.lastName;
    if (first || last) return `${first ?? ""} ${last ?? ""}`.trim();
  }
  return "New Application";
}

// ─── DraftTicket ─────────────────────────────────────────────────────────────

type DraftTicketProps = {
  row: DraftRow;
  onContinue: (row: DraftRow) => void;
  onDiscard: (draftId: string, flowType: "hfse-is" | "viz-school") => void;
};

export function DraftTicket({ row, onContinue, onDiscard }: DraftTicketProps) {
  const { state, flowType } = row;
  const name = getDraftName(state, flowType);
  const progress = state.completedTabs?.length ?? 0;
  const currentStepIndex = Math.min(progress, 3);
  const expiringSoon = isExpiringSoon(state.expiresAt);
  const daysLeft = differenceInDays(new Date(state.expiresAt), new Date());
  const ay = state.academicYear?.replace("ay", "AY ") ?? "";
  const allDone = progress >= 4;
  const isViz = flowType === "viz-school";

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">

          {/* Progress ring */}
          <div className="relative size-11 shrink-0 mt-0.5 flex items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="16"
                fill="none" stroke="currentColor" strokeWidth="4.5"
                className="text-muted"
              />
              <circle
                cx="20" cy="20" r="16"
                fill="none" stroke="currentColor" strokeWidth="4.5"
                strokeDasharray={100}
                strokeDashoffset={100 - (100 * progress) / 4}
                strokeLinecap="round"
                className={cn(
                  "transition-[stroke-dashoffset] duration-700",
                  allDone ? "text-green-500" : "text-primary",
                )}
              />
            </svg>
            <span className={cn(
              "absolute text-[10px] font-black tabular-nums leading-none",
              allDone ? "text-green-600 dark:text-green-400" : "text-foreground",
            )}>
              {progress}/4
            </span>
          </div>

          {/* Content + desktop actions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">

              {/* Name, badge, meta */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black capitalize text-foreground leading-snug">
                    {name}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0",
                    isViz
                      ? "bg-secondary/10 text-secondary"
                      : "bg-primary/10 text-primary",
                  )}>
                    {isViz ? "VizSchool" : "HFSE-IS"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {ay && `${ay} · `}
                  Saved {formatDistanceToNow(new Date(state.lastSavedAt), { addSuffix: true })}
                </p>
              </div>

              {/* Desktop action buttons */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <DiscardButton name={name} draftId={state.draftId} flowType={flowType} onDiscard={onDiscard} />
                <Button
                  size="sm"
                  variant="cta"
                  onClick={() => onContinue(row)}
                  className="font-bold gap-1">
                  Continue
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </Button>
              </div>
            </div>

            {/* Step track + expiry */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <StepTrack
                progress={progress}
                allDone={allDone}
                currentStepIndex={currentStepIndex}
              />
              {expiringSoon && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60">
                  <Hourglass className="size-2.5" />
                  {daysLeft <= 0 ? "Expires today" : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mobile action buttons */}
        <div className="md:hidden mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
          <DiscardButton name={name} draftId={state.draftId} flowType={flowType} onDiscard={onDiscard} />
          <Button
            size="sm"
            variant="cta"
            onClick={() => onContinue(row)}
            className="font-bold gap-1">
            Continue
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepTrack({
  progress,
  allDone,
  currentStepIndex,
}: {
  progress: number;
  allDone: boolean;
  currentStepIndex: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((i) => {
        const done = i < progress;
        return (
          <div
            key={i}
            title={STEP_NAMES[i]}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              done
                ? allDone
                  ? "w-5 bg-green-500"
                  : "w-5 bg-primary"
                : i === currentStepIndex && !allDone
                  ? "w-3.5 bg-primary/30"
                  : "w-2.5 bg-muted",
            )}
          />
        );
      })}
      <span className={cn(
        "text-[11px] font-semibold ml-1",
        allDone ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
      )}>
        {allDone ? "Ready to submit" : STEP_NAMES[currentStepIndex]}
      </span>
    </div>
  );
}

function DiscardButton({
  name,
  draftId,
  flowType,
  onDiscard,
}: {
  name: string;
  draftId: string;
  flowType: "hfse-is" | "viz-school";
  onDiscard: (draftId: string, flowType: "hfse-is" | "viz-school") => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold">
          <Trash2 className="size-3.5" />
          Discard
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black">Discard this application?</AlertDialogTitle>
          <AlertDialogDescription className="font-medium">
            The saved draft for{" "}
            <span className="font-bold text-foreground capitalize">{name}</span> will be permanently
            deleted. You'll need to start a new application for this student.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-bold">Keep it</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive", className: "font-bold" })}
            onClick={() => onDiscard(draftId, flowType)}>
            Yes, discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
