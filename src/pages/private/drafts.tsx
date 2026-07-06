import { discardDraft } from "@/actions/discard-draft";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import PageMetaData from "@/components/page-metadata";
import type { DraftRow } from "@/components/private/drafts/draft-ticket";
import { DraftTicket } from "@/components/private/drafts/draft-ticket";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDraftRows } from "@/hooks/use-draft-rows";
import { useSelectAcademicYear } from "@/zustand-store";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FilePen, PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";

const DRAFT_ROWS_KEY = ["drafts", "remote-rows"];

export default function Drafts() {
  const navigate = useNavigate();
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);
  const queryClient = useQueryClient();

  const { data, isPending } = useDraftRows();
  const rows = data ?? [];

  function handleContinue(row: DraftRow) {
    const { state, flowType } = row;
    setAcademicYear(state.academicYear);

    if (flowType === "viz-school") {
      navigate(`/vizschool/enrol-student/new/student-info?academicYear=${state.academicYear}`, {
        state: { resumeDraftId: state.draftId },
      });
    } else {
      navigate(`/enrol-student/new/student-info?academicYear=${state.academicYear}`, {
        state: { resumeDraftId: state.draftId },
      });
    }
  }

  function handleDiscard(draftId: string, flowType: "hfse-is" | "viz-school") {
    discardDraft(draftId, flowType);
    queryClient.setQueryData<DraftRow[]>(DRAFT_ROWS_KEY, (prev) =>
      (prev ?? []).filter((r) => r.state.draftId !== draftId),
    );
  }

  return (
    <>
      <PageMetaData
        title="Saved Drafts | HFSE International School"
        description="Resume or discard your in-progress enrollment applications."
      />

      <MaxWidthWrapper className="w-full max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Back */}
        <Link
          to="/admission/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
            Your Enrollment Applications
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            Saved Drafts
          </h1>
          {rows.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {rows.length} application{rows.length === 1 ? "" : "s"} waiting to be completed
            </p>
          )}
        </div>

        {isPending ? (
          <DraftsLoader />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <DraftTicket key={row.state.draftId} row={row} onContinue={handleContinue} onDiscard={handleDiscard} />
            ))}
          </div>
        )}
      </MaxWidthWrapper>
    </>
  );
}

function DraftsLoader() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[124px] w-full rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border text-center px-6">
      <div className="inline-flex items-center justify-center size-14 rounded-full bg-muted mb-5">
        <FilePen className="size-6 text-muted-foreground" />
      </div>
      <h2 className="font-serif text-xl font-semibold text-foreground mb-2">No applications in progress</h2>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-7 font-medium">
        When you start an application and save it, it will appear here so you can pick up where you left off.
      </p>
      <Link to="/enrol-student" className={buttonVariants({ variant: "cta", className: "font-bold gap-2" })}>
        <PlusCircle className="size-4" />
        Start an application
      </Link>
    </div>
  );
}
