import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, listNewStudentDrafts } from "@/lib/utils";
import { ChevronRight, CircleX, GraduationCap, Layers, Trash2 } from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    name: "Student Information",
    path: "student-info",
    desc: "Student profile and personal data",
  },
  {
    name: "Family Information",
    path: "family-info",
    desc: "Parent/Guardian and sibling details",
  },
  {
    name: "Enrolment Information",
    path: "enrollment-info",
    desc: "Academic level and enrolment type",
  },
  {
    name: "Upload Requirements",
    path: "documents",
    desc: "Upload required enrolment documents",
  },
];

const draftsData = [
  {
    id: "1",
    studentName: "Lucas Alexander",
    currentStep: 3,
    nextAction: "Upload Birth Certificate",
    lastEdited: "12:45 PM",
    grade: "Grade 9",
  },
  {
    id: "2",
    studentName: "Sophia Chen",
    currentStep: 1,
    nextAction: "Add Parent Contact",
    lastEdited: "Yesterday",
    grade: "Grade 7",
  },
  {
    id: "3",
    studentName: "Marcus Wright",
    currentStep: 2,
    nextAction: "Sibling Information",
    lastEdited: "2 days ago",
    grade: "Grade 10",
  },
];

export default function AdmissionDraftsDialog() {
  const studentDrafts = listNewStudentDrafts("hfse-is");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setTimeout(() => setDeletingId(null), 300);
  };

  console.log(studentDrafts);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-xl !h-12 !px-6 !font-bold text-xs shadow-sm">
          <Layers className="mr-2 size-4" />
          Application Drafts
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl border-none bg-[#F2F2F7] shadow-2xl overflow-hidden rounded-2xl">
        {/* Sticky Header */}
        <DialogHeader className="contents space-y-0 text-left">
          <div className="sticky top-0 z-10 border-b border-slate-200/50 bg-white/90 backdrop-blur-xl px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                <GraduationCap className="size-5 text-white" />
              </div>
              <DialogTitle className="uppercase text-[13px] font-black tracking-[0.15em] text-primary">
                Saved Applications
              </DialogTitle>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200/50">
              <Layers className="size-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">{draftsData.length}</span>
            </div>
          </div>

          <ScrollArea className="h-[85vh] overflow-hidden">
            <div className="p-6 space-y-5">
              {draftsData.map((draft) => {
                const isDeleting = deletingId === draft.id;
                const currentStepData = STEPS[draft.currentStep - 1];

                return (
                  <div
                    key={draft.id}
                    className={cn(
                      "bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-300",
                      isDeleting && "opacity-0 translate-x-4 scale-95",
                    )}>
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-none mb-1.5">
                          {draft.studentName}
                        </h3>
                        <p className="text-[14px] text-slate-500 font-semibold uppercase tracking-wide">
                          {draft.grade} <span className="mx-1 opacity-30">•</span> {draft.lastEdited}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(draft.id)}
                        className="cursor-pointer p-2 text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-full transition-all">
                        <Trash2 className="size-5" />
                      </button>
                    </div>

                    {/* Step Info Box: Increased sizes for readability */}
                    <div className="p-4 rounded-2xl mb-6 bg-[#F8F9FB] border border-slate-200/60">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary opacity-80">
                            {currentStepData?.name}
                          </p>
                          <p className="text-[16px] font-bold text-slate-800 leading-snug">{draft.nextAction}</p>
                          <p className="text-[13px] text-slate-500 font-medium">{currentStepData?.desc}</p>
                        </div>

                        <div className="text-right pl-4">
                          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 shadow-sm rounded-xl py-2 px-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">
                              Step
                            </span>
                            <div className="flex items-baseline gap-0.5 leading-none">
                              <span className="text-xl font-black text-primary">{draft.currentStep}</span>
                              <span className="text-[12px] font-bold text-slate-300">/{STEPS.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/10 active:scale-[0.98] transition-all">
                      Resume Application
                      <ChevronRight className="ml-1 size-5 opacity-70" strokeWidth={3} />
                    </Button>
                  </div>
                );
              })}
              <div className="py-2" />
            </div>
          </ScrollArea>
        </DialogHeader>

        {/* Sticky Footer */}
        <DialogFooter className="border-t border-slate-200/50 bg-white/90 backdrop-blur-xl px-6 py-5 flex-row sm:justify-between items-center">
          <DialogClose asChild>
            <Button variant="ghost" className="font-bold text-[16px] hover:text-destructive hover:bg-transparent px-0">
              <CircleX className="size-5 mr-1" strokeWidth={3} />
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
