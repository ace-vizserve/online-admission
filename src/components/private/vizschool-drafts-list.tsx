import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useEnrolNewLearnerContext } from "@/context/vizschool/enrol-new-learner-context";
import { cn, DraftSort, isExpired, isExpiringSoon, listNewStudentDrafts, sortDrafts, wait } from "@/lib/utils";
import { EnrolNewStudentFormState } from "@/types";
import {
  EnrolNewStudentDraftStore,
  useApplicationDraftsDialogStore,
  useEnrolNewStudentTabStateStore,
  usePassTypeStore,
  usePreCourseAcknowledgementStore,
  useSelectAcademicYear,
} from "@/zustand-store";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  CalendarDays,
  ChevronRight,
  History,
  Hourglass,
  Inbox,
  Info,
  ListFilter,
  Loader2,
  LogOut,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import VizSchoolLogo from "../vizschool-logo";

const STEPS = [
  {
    name: "Student Information",
    path: "/vizschool/enrol-student/new/student-info",
    desc: "Student profile and personal data",
  },
  {
    name: "Family Information",
    path: "/vizschool/enrol-student/new/family-info",
    desc: "Parent/Guardian and sibling details",
  },
  {
    name: "Enrolment Information",
    path: "/vizschool/enrol-student/new/enrollment-info",
    desc: "Academic level and enrolment type",
  },
  {
    name: "Upload Requirements",
    path: "/vizschool/enrol-student/new/upload-requirements",
    desc: "Upload required enrolment documents",
  },
];

export default function VizSchoolSavedDraftsDialog() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const studentDrafts = listNewStudentDrafts("viz-school") || [];
  const [sortBy, setSortBy] = useState<DraftSort>("lastUpdated");
  const isDesktop = useMediaQuery({
    query: "(min-width: 768px)",
  });

  const memoizedSetSort = useCallback((newSort: DraftSort) => {
    setSortBy(newSort);
  }, []);

  const sortedDrafts = useMemo(() => {
    return sortDrafts(studentDrafts, sortBy);
  }, [studentDrafts, sortBy]);

  const isOpen = useApplicationDraftsDialogStore((state) => state.isOpen);
  const setIsOpen = useApplicationDraftsDialogStore((state) => state.setIsOpen);
  const academicYear = useSelectAcademicYear((state) => state.academicYear);
  const setAcademicYear = useSelectAcademicYear((state) => state.setAcademicYear);
  const { setFormState, setActiveTab, setCompletedTabs, setCurrentTab, formState } = useEnrolNewLearnerContext();
  const clearPreCourse = usePreCourseAcknowledgementStore((state) => state.clearState);
  const clearPassType = usePassTypeStore((state) => state.clearState);
  const { clearState } = useEnrolNewLearnerContext();
  const clearEnrolNewStudentTabState = useEnrolNewStudentTabStateStore((state) => state.clearState);
  const clearAcademicYearState = useSelectAcademicYear((state) => state.clearState);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentDraftCount, setCurrentDraftCount] = useState<number>(sortedDrafts.length);

  const isEmpty = currentDraftCount === 0;

  useEffect(() => {
    setCurrentDraftCount(sortedDrafts.length);
  }, [sortedDrafts]);

  function handleDelete(id: string, type: "hfse-is" | "viz-school") {
    setDeletingId(id);
    setTimeout(() => {
      localStorage.removeItem(`enrolNewStudent:draft:${id}:${type}`);
      setCurrentDraftCount((prev) => prev - 1);
      setDeletingId(null);
    }, 200);
  }

  async function initializeFormState({
    internalState,
    formState,
  }: {
    internalState: EnrolNewStudentDraftStore;
    formState: EnrolNewStudentFormState;
  }) {
    setIsLoading(true);
    await wait(1200);

    setAcademicYear(internalState.academicYear);
    setActiveTab(internalState.activeTab);
    setCurrentTab(internalState.currentTab);
    setCompletedTabs(internalState.completedTabs);
    setFormState({ ...formState, draftId: internalState.draftId });

    setIsOpen(false);
    setIsLoading(false);
  }

  async function exitApplication() {
    setIsExiting(true);
    clearState();
    clearAcademicYearState();
    clearEnrolNewStudentTabState();
    clearPassType();
    clearPreCourse();
    sessionStorage.clear();

    await wait(500);
    setIsExiting(false);
    navigate("/admission/dashboard");
  }

  if (!isDesktop) {
    return (
      <Drawer dismissible={false} open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="bg-[#F2F2F7] p-0 overflow-hidden">
          {isLoading ? (
            <SavedDraftsLoader />
          ) : (
            <>
              {/* Header */}
              <DrawerHeader className="mt-4 p-0">
                <div className="sticky top-0 z-10 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-6 py-5">
                  <div className="w-full flex items-center gap-4 px-2 py-2">
                    <VizSchoolLogo className="w-16" />

                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

                    <div className="flex flex-col items-start gap-0.5">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-[0.25em] leading-none">
                        Enrollment Portal
                      </p>
                      <DrawerTitle className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                        Saved Applications
                      </DrawerTitle>
                    </div>
                  </div>
                </div>
              </DrawerHeader>

              {/* Scrollable content */}
              <ScrollArea className="h-96">
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap-reverse justify-between gap-4">
                    <SortDraft sortBy={sortBy} setSortBy={memoizedSetSort} />
                    <div className="w-max flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-red-50 border-red-100 text-red-600 font-bold text-[10px] uppercase">
                      <Info className="size-3.5" />
                      Drafts expires after 30 days
                    </div>
                  </div>

                  {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-10">
                      <div className="size-20 bg-white rounded-[32px] shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                        <Inbox className="size-8 text-slate-200" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">No Drafts Found</h3>
                      <p className="text-sm text-slate-400 font-medium mt-1">
                        Draft applications are saved automatically and kept for 30 days.
                      </p>
                    </div>
                  ) : (
                    <div className="relative grid grid-cols-1 gap-2">
                      {sortedDrafts.map(({ state }) => {
                        const internalState = state;
                        const internalFormState = internalState.formState as EnrolNewStudentFormState;

                        const expired = isExpired(internalState.expiresAt);
                        const expiringSoon = isExpiringSoon(internalState.expiresAt);

                        const stepIndex = STEPS.findIndex((s) => s.path === internalState.activeTab);
                        const stepData = STEPS[stepIndex] || STEPS[0];

                        const progressPercent = Math.round((internalState.completedTabs.length / STEPS.length) * 100);

                        const fullName =
                          formState?.studentInfo?.studentDetails?.firstName ||
                          formState?.studentInfo?.studentDetails?.lastName
                            ? `${formState.studentInfo.studentDetails.firstName ?? ""} ${
                                formState.studentInfo.studentDetails.lastName ?? ""
                              }`.trim()
                            : "New Application";

                        return (
                          <div
                            key={internalState.draftId}
                            className={cn(
                              "bg-white rounded-xl p-5 border shadow-sm transition-all",
                              expired ? "opacity-50 border-red-200 bg-red-50/40" : "border-slate-200",
                            )}>
                            {/* Card header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-black text-slate-900 tracking-tight capitalize">
                                    {fullName}
                                  </h3>

                                  {!expired && expiringSoon && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                      Expires {formatDistanceToNow(new Date(internalState.expiresAt))}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-black text-secondary uppercase tracking-wider border border-slate-200/50">
                                    {internalState.academicYear?.replace("ay", "AY ")}
                                  </span>

                                  <span className="text-slate-300 text-sm font-black">•</span>

                                  <div className="flex items-center gap-1.5">
                                    {internalState.draftId === formState.draftId ? (
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 shadow-sm animate-pulse">
                                        <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                                          In progress
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                        <span>Saved</span>
                                        <span className="text-slate-600">
                                          {formatDistanceToNow(new Date(internalState.lastSavedAt), {
                                            addSuffix: true,
                                          })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                disabled={internalFormState.draftId === formState.draftId}
                                onClick={() => handleDelete(internalState.draftId, internalState.type)}
                                className={cn(
                                  "group relative p-2.5 rounded-xl transition-all duration-200",
                                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale",
                                  "hover:bg-destructive/10 active:scale-90",
                                )}
                                title={
                                  internalFormState.draftId === formState.draftId
                                    ? "Active draft cannot be deleted"
                                    : "Delete Draft"
                                }>
                                <Trash2
                                  className={cn(
                                    "size-5 transition-colors",
                                    internalFormState.draftId === formState.draftId
                                      ? "text-slate-400"
                                      : "text-slate-300 group-hover:text-destructive",
                                  )}
                                  strokeWidth={2.5}
                                />

                                {internalFormState.draftId === formState.draftId && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="size-2.5 bg-slate-400 rounded-full border-2 border-white" />
                                  </div>
                                )}
                              </button>
                            </div>

                            {/* Progress */}
                            <div className="py-4 mb-5">
                              <div className="flex items-center gap-5">
                                <div className="relative size-16 flex items-center justify-center">
                                  <svg className="size-full -rotate-90" viewBox="0 0 64 64">
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="5"
                                      className="text-slate-100"
                                    />
                                    <circle
                                      cx="32"
                                      cy="32"
                                      r="28"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="5"
                                      strokeDasharray={176}
                                      strokeDashoffset={176 - (176 * progressPercent) / 100}
                                      strokeLinecap="round"
                                      className="text-secondary transition-all duration-1000"
                                    />
                                  </svg>

                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Step</span>
                                    <span className="text-[14px] font-black">
                                      {internalState.completedTabs.length}
                                      <span className="text-slate-300 mx-0.5 text-[10px]">/</span>4
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest">
                                    Active Tab
                                  </p>
                                  <p className="text-[15px] font-bold text-slate-700">{stepData.name}</p>
                                  <p className="text-[12px] text-slate-500 font-medium line-clamp-1">{stepData.desc}</p>
                                </div>
                              </div>
                            </div>

                            {/* Action */}
                            <Button
                              variant="outline"
                              disabled={expired}
                              onClick={() =>
                                initializeFormState({
                                  internalState,
                                  formState: internalFormState,
                                })
                              }
                              className={cn(
                                "w-full h-12 rounded-xl font-black uppercase tracking-[0.1em] text-[11px] text-secondary bg-secondary/10",
                                expired ? "bg-slate-200 text-slate-400" : "shadow-lg shadow-secondary/10",
                              )}>
                              {expired ? "Draft expired" : "Resume Application"}
                              {!expired && <ChevronRight className="ml-1 size-4 opacity-70" strokeWidth={3} />}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Footer */}
              <DrawerFooter className="border-t border-slate-200/50 bg-white p-6 pb-10 flex flex-col gap-3">
                {!formState?.draftId && (
                  <Button
                    disabled={isExiting}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/vizschool/enrol-student/new/student-info?academicYear=${academicYear}`);
                    }}
                    className="w-full h-12 rounded-xl font-black tracking-widest uppercase text-[10px]">
                    <Plus className="mr-2 size-4" strokeWidth={3} />
                    Start New Application
                  </Button>
                )}

                <DrawerClose asChild>
                  <Button
                    onClick={async () => await exitApplication()}
                    variant="destructive"
                    className="w-full h-12 rounded-xl font-black tracking-widest uppercase text-[10px]">
                    <LogOut className="mr-2 size-4" />
                    Exit Application
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 p-0 md:max-w-5xl xl:max-w-6xl border-none bg-[#F2F2F7] overflow-hidden rounded-xl transition-all duration-500",
          isLoading && "!max-w-sm",
          isEmpty && "sm:max-w-2xl md:max-w-4xl",
        )}>
        {isLoading ? (
          <SavedDraftsLoader />
        ) : (
          <>
            <AlertDialogHeader className="contents space-y-0 text-left">
              <div className="sticky top-0 z-10 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl px-6 py-5 ">
                <div className="w-full flex items-center gap-4 md:gap-6 px-2 py-2">
                  <VizSchoolLogo className="w-16 md:w-20 lg:w-24" />

                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

                  <div className="flex flex-col items-start gap-0.5">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.25em] leading-none">
                      Enrollment Portal
                    </p>
                    <AlertDialogTitle className="text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                      Saved Applications
                    </AlertDialogTitle>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap-reverse justify-between gap-4">
                    <SortDraft sortBy={sortBy} setSortBy={memoizedSetSort} />
                    <div className="w-max flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-red-50 border-red-100 text-red-600 font-bold text-[10px] md:text-xs uppercase">
                      <Info className="size-3.5" />
                      Drafts expires after 30 days
                    </div>
                  </div>
                  {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-10">
                      <div className="size-20 bg-white rounded-[32px] shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                        <Inbox className="size-8 text-slate-200" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">No Drafts Found</h3>
                      <p className="text-sm text-slate-400 font-medium mt-1">
                        Draft applications are saved automatically and kept for 30 days.
                      </p>
                    </div>
                  ) : (
                    <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3  gap-2">
                      {sortedDrafts.map(({ state }) => {
                        const internalState = state;
                        const internalFormState = internalState.formState as EnrolNewStudentFormState;
                        const isDeleting = deletingId === internalState.draftId;
                        const stepIndex = STEPS.findIndex((s) => s.path === internalState.activeTab);
                        const stepData = STEPS[stepIndex] || STEPS[0];

                        const expired = isExpired(internalState.expiresAt);
                        const expiringSoon = isExpiringSoon(internalState.expiresAt);

                        const progressPercent = Math.round((internalState.completedTabs.length / STEPS.length) * 100);

                        const fullName =
                          formState?.studentInfo?.studentDetails?.firstName ||
                          formState?.studentInfo?.studentDetails?.lastName
                            ? `${formState.studentInfo.studentDetails.firstName ?? ""} ${formState.studentInfo.studentDetails.lastName ?? ""}`.trim()
                            : "New Application";

                        return (
                          <div
                            key={internalState.draftId}
                            className={cn(
                              "group bg-white rounded-xl p-5 border shadow-sm transition-all",
                              expired
                                ? "opacity-50 border-red-200 bg-red-50/40"
                                : "border-slate-200 hover:border-secondary/20 hover:shadow-md",
                              isDeleting && "opacity-0 translate-x-8 scale-95",
                            )}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight capitalize">
                                    {fullName}
                                  </h3>
                                  {expired && (
                                    <p className="mt-2 text-[11px] text-slate-500 font-medium text-center">
                                      This draft is over 30 days old and can no longer be resumed.
                                    </p>
                                  )}

                                  {!expired && expiringSoon && (
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                      Expires {formatDistanceToNow(new Date(internalState.expiresAt))}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-black text-secondary uppercase tracking-wider border border-slate-200/50">
                                    {internalState.academicYear?.replace("ay", "AY ")}
                                  </span>

                                  <span className="text-slate-300 text-sm font-black">•</span>

                                  <div className="flex items-center gap-1.5">
                                    {internalState.draftId === formState.draftId ? (
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 shadow-sm animate-pulse">
                                        <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                                          In progress
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                        <span>Saved</span>
                                        <span className="text-slate-600">
                                          {formatDistanceToNow(new Date(internalState.lastSavedAt), {
                                            addSuffix: true,
                                          })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                disabled={internalFormState.draftId === formState.draftId}
                                onClick={() => handleDelete(internalState.draftId, internalState.type)}
                                className={cn(
                                  "group relative p-2.5 rounded-xl transition-all duration-200",
                                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale",
                                  "hover:bg-destructive/5 active:scale-90",
                                )}
                                title={
                                  internalFormState.draftId === formState.draftId
                                    ? "Active draft cannot be deleted"
                                    : "Delete Draft"
                                }>
                                <Trash2
                                  className={cn(
                                    "size-5 transition-colors",
                                    internalFormState.draftId === formState.draftId
                                      ? "text-slate-400"
                                      : "text-slate-300 group-hover:text-destructive",
                                  )}
                                  strokeWidth={2.5}
                                />

                                {internalFormState.draftId === formState.draftId && (
                                  <div className="absolute -top-1 -right-1">
                                    <div className="size-2.5 bg-slate-400 rounded-full border-2 border-white" />
                                  </div>
                                )}
                              </button>
                            </div>

                            <div className="py-4 mb-5">
                              <div className="flex justify-between items-end mb-2">
                                <div className="flex-1 flex items-center gap-5">
                                  <div className="relative size-16 shrink-0 flex items-center justify-center">
                                    <svg className="size-full -rotate-90" viewBox="0 0 64 64">
                                      {/* Background Track */}
                                      <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        className="text-slate-100"
                                      />
                                      {/* Progress Fill */}
                                      <circle
                                        cx="32"
                                        cy="32"
                                        r="28"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="5"
                                        strokeDasharray={176}
                                        strokeDashoffset={176 - (176 * progressPercent) / 100}
                                        strokeLinecap="round"
                                        className="text-secondary transition-all duration-1000 ease-out"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                      <span className="text-[10px] md:text-[12px] font-black text-slate-400 uppercase">
                                        Step
                                      </span>
                                      <span className="text-[12px] md:text-[14px] font-black">
                                        {internalState.completedTabs.length}
                                        <span className="text-slate-300 mx-0.5 text-[10px]">/</span>4
                                      </span>
                                    </div>
                                  </div>

                                  {/* Content Area */}
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[10px] md:text-[11px] font-black text-secondary uppercase tracking-widest">
                                        Active Tab
                                      </p>
                                    </div>

                                    <p className="text-[14px] md:text-[15px] font-bold text-slate-700 leading-tight">
                                      {stepData.name}
                                    </p>

                                    <p className="text-[12px] text-slate-500 font-medium line-clamp-1">
                                      {stepData.desc}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Button
                              variant={"outline"}
                              disabled={expired}
                              onClick={() => initializeFormState({ internalState, formState: internalFormState })}
                              className={cn(
                                "w-full !h-12 !rounded-xl !font-black text-[11px] uppercase tracking-[0.1em] text-secondary bg-secondary/10",
                                expired
                                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                  : "shadow-lg shadow-secondary/10",
                              )}>
                              {expired ? "Draft expired" : "Resume Application"}
                              {!expired && <ChevronRight className="ml-1 size-4 opacity-70" strokeWidth={3} />}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <AlertDialogFooter className="border-t border-slate-200/50 bg-white/80 backdrop-blur-xl px-6 py-6 flex !flex-col gap-3">
                {!formState?.draftId && (
                  <Button
                    variant={"secondary"}
                    disabled={isExiting}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/vizschool/enrol-student/new/student-info?academicYear=${academicYear}`);
                    }}
                    className="w-full h-12 md:!h-14 rounded-xl font-black tracking-widest uppercase text-[10px] md:text-xs">
                    <Plus className="mr-2 size-4" strokeWidth={3} />
                    Start New Application
                  </Button>
                )}

                <Button
                  onClick={async () => await exitApplication()}
                  variant={"destructive"}
                  className="w-full h-12 md:!h-14 rounded-xl font-black tracking-widest uppercase text-[10px] md:text-xs">
                  <LogOut className="mr-2 size-4" />
                  Exit Application
                </Button>
              </AlertDialogFooter>
            </AlertDialogHeader>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SortDraft({ sortBy, setSortBy }: { sortBy: DraftSort; setSortBy: (sortBy: DraftSort) => void }) {
  return (
    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
      <SelectTrigger className="w-max md:w-[220px] h-11 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-600 focus:ring-secondary/20 transition-all hover:bg-slate-50 active:scale-[0.98]">
        <div className="flex items-center gap-2.5">
          <ListFilter className="size-4 text-secondary" strokeWidth={2.5} />
          <SelectValue placeholder="Sort drafts" />
        </div>
      </SelectTrigger>

      <SelectContent className="rounded-2xl border-slate-200/60 shadow-2xl p-1 animate-in zoom-in-95 duration-200">
        <SelectGroup>
          <SelectLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Order By
          </SelectLabel>

          <SelectItem
            value="lastUpdated"
            className="rounded-lg py-2.5 font-bold text-slate-700 focus:bg-secondary/5 focus:text-secondary transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <History className="size-4 opacity-50" />
              <span className="uppercase text-[10px] md:text-xs">Last updated</span>
            </div>
          </SelectItem>

          <SelectItem
            value="oldest"
            className="rounded-lg py-2.5 font-bold text-slate-700 focus:bg-secondary/5 focus:text-secondary transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 opacity-50" />
              <span className="uppercase text-[10px] md:text-xs">Oldest first</span>
            </div>
          </SelectItem>
        </SelectGroup>

        <SelectSeparator className="my-1 bg-slate-100" />

        <SelectGroup>
          <SelectLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Status
          </SelectLabel>

          <SelectItem
            value="expiringSoon"
            className="rounded-lg py-2.5 font-bold text-slate-700 focus:bg-amber-50 focus:text-amber-600 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Hourglass className="size-4 opacity-50" />
              <span className="uppercase text-[10px] md:text-xs">Expiring soon</span>
            </div>
          </SelectItem>

          <SelectItem
            value="expired"
            className="rounded-lg py-2.5 font-bold text-slate-700 focus:bg-destructive/5 focus:text-destructive transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Ban className="size-4 opacity-50" />
              <span className="uppercase text-[10px] md:text-xs">Expired</span>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SavedDraftsLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <div className="absolute inset-0 size-16 bg-secondary/10 rounded-full animate-ping" />
        <div className="relative size-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
          <Loader2 className="size-8 text-secondary animate-spin" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xl font-black text-slate-900 tracking-tight">Restoring Data</p>
        <p className="text-sm font-medium text-slate-500 max-w-[200px] leading-snug">
          Please wait while we prepare your application...
        </p>
      </div>
    </div>
  );
}
