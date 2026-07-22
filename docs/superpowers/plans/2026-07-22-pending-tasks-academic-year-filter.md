# Pending Tasks Academic Year Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a parent filter the Pending Tasks ("Document Requirements") page down to one academic year, scoped to only the years that actually have outstanding tasks for them.

**Architecture:** Pure client-side filtering inside `src/pages/private/pending-tasks.tsx`. No backend/query changes — the existing `getSectionCardsDetails` query already returns every pending task in one shot; a `useState` + two `useMemo`s derive the distinct academic years present (reusing the page's existing `tryAcademicYearFromEnroleeNumber` call) and filter the render list.

**Tech Stack:** React 19, TypeScript (strict), ShadCN `Select` (`@/components/ui/select`), TanStack Query, Vitest + Testing Library + `@testing-library/user-event`.

## Global Constraints

- No backend/query changes — `getSectionCardsDetails` / `getEnrollmentPendingDocuments` (`src/actions/private.ts`) stay untouched. (Spec: Non-goals)
- The filter dropdown only lists academic years present in the parent's own pending tasks — never a fixed/full list of all system academic years. (Spec: Goal, Non-goals)
- The filter control is hidden entirely when fewer than 2 distinct academic years are present. (Spec: Design → UI)
- Year labels use the exact format already used elsewhere on this page: `` `AY ${year.slice(2)}` `` (e.g. "AY 2027") — no new label format. (Spec: Design → UI)
- Default selection on every page load is "All Years" (value `"all"`) — purely opt-in. (Spec: Design → UI)
- No URL param / localStorage persistence of the selected filter. (Spec: Non-goals)

---

### Task 1: Academic year filter on the Pending Tasks page

**Files:**
- Modify: `src/pages/private/pending-tasks.tsx`
- Test: `src/pages/private/pending-tasks.test.tsx` (new file)

**Interfaces:**
- Consumes: `tryAcademicYearFromEnroleeNumber(enroleeNumber: string | null | undefined): string | null` and `BACKEND_ACADEMIC_YEARS: string[]`, both already exported from `src/config/academic-years.ts` (no changes to that file). Consumes `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `src/components/ui/select.tsx` (existing component, unchanged).
- Produces: nothing consumed by other tasks — this is the only task in the plan.

- [ ] **Step 1: Write the failing test file**

Create `src/pages/private/pending-tasks.test.tsx`:

```tsx
/**
 * Coverage for the Pending Tasks academic-year filter: a parent with pending document
 * requirements spanning more than one academic year can narrow the list down to just the
 * enrolment they're working on. See
 * docs/superpowers/specs/2026-07-22-pending-tasks-academic-year-filter-design.md.
 */
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/actions/private", () => ({ getSectionCardsDetails: vi.fn() }));

const mockSession = { user: { email: "parent@example.com" } } as unknown as Session;

vi.mock("@/hooks/use-session", () => ({ default: () => ({ session: mockSession }) }));

const { getSectionCardsDetails } = await import("@/actions/private");
const { default: PendingTasks } = await import("./pending-tasks");

// "E27####" / "E26####" — the "E" + 2-digit-year-suffix format tryAcademicYearFromEnroleeNumber
// parses (src/config/academic-years.ts), matching BACKEND_ACADEMIC_YEARS's "ay2027"/"ay2026".
const TASK_AY2027 = { enroleeNumber: "E270001", studentDocs: [{ birthCert: "To follow" }] };
const TASK_AY2026 = { enroleeNumber: "E260002", parentGuardianDocs: [{ motherPassport: "Expired" }] };

function mockPendingTasks(pendingTasks: Record<string, unknown>[]) {
  vi.mocked(getSectionCardsDetails).mockResolvedValue({
    totalEnrollments: pendingTasks.length,
    pendingTasks: { totalPendingTasks: pendingTasks.length, pendingTasks },
    currentEnrolledStudents: [],
  } as never);
}

function renderPendingTasks() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PendingTasks />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(getSectionCardsDetails).mockReset();
});

describe("PendingTasks — academic year filter", () => {
  it("does not render the filter when there are zero pending tasks", async () => {
    mockPendingTasks([]);

    renderPendingTasks();

    expect(await screen.findByText("All caught up!")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("does not render the filter when tasks span a single academic year", async () => {
    mockPendingTasks([TASK_AY2027, { ...TASK_AY2027, enroleeNumber: "E270099" }]);

    renderPendingTasks();

    expect(await screen.findByText("#E270001")).toBeInTheDocument();
    expect(screen.getByText("#E270099")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders the filter, defaulting to All Years, when tasks span 2+ academic years", async () => {
    mockPendingTasks([TASK_AY2027, TASK_AY2026]);

    renderPendingTasks();

    expect(await screen.findByText("#E270001")).toBeInTheDocument();
    expect(screen.getByText("#E260002")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("All Years");
  });

  it("narrows the list to the selected academic year", async () => {
    mockPendingTasks([TASK_AY2027, TASK_AY2026]);
    const user = userEvent.setup();

    renderPendingTasks();
    await screen.findByText("#E270001");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "AY 2027" }));

    expect(screen.getByText("#E270001")).toBeInTheDocument();
    expect(screen.queryByText("#E260002")).not.toBeInTheDocument();
  });

  it("restores the full list when All Years is selected again", async () => {
    mockPendingTasks([TASK_AY2027, TASK_AY2026]);
    const user = userEvent.setup();

    renderPendingTasks();
    await screen.findByText("#E270001");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "AY 2027" }));
    expect(screen.queryByText("#E260002")).not.toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "All Years" }));

    expect(screen.getByText("#E270001")).toBeInTheDocument();
    expect(screen.getByText("#E260002")).toBeInTheDocument();
  });

  it("lists filter options newest-year-first", async () => {
    // AY2026 pushed first, AY2027 second — the rendered option order must still be AY2027 then
    // AY2026 (BACKEND_ACADEMIC_YEARS order), not insertion order.
    mockPendingTasks([TASK_AY2026, TASK_AY2027]);
    const user = userEvent.setup();

    renderPendingTasks();
    await screen.findByText("#E270001");

    await user.click(screen.getByRole("combobox"));
    const options = await screen.findAllByRole("option");

    expect(options.map((o) => o.textContent)).toEqual(["All Years", "AY 2027", "AY 2026"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/pages/private/pending-tasks.test.tsx`

Expected: FAIL — `screen.queryByRole("combobox")` assertions and the "AY 2027"/"AY 2026" option queries fail because the filter doesn't exist yet (the component currently renders every task unconditionally with no `Select`).

- [ ] **Step 3: Implement the filter in `pending-tasks.tsx`**

Replace the full contents of `src/pages/private/pending-tasks.tsx` with:

```tsx
import { getSectionCardsDetails } from "@/actions/private";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_ACADEMIC_YEARS, tryAcademicYearFromEnroleeNumber } from "@/config/academic-years";
import useSession from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Tailspin } from "ldrs/react";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

function PendingTasks() {
  const { session } = useSession();

  const { data, isPending } = useQuery({
    queryKey: ["pending-tasks", session?.user.email],
    queryFn: getSectionCardsDetails,
    enabled: session != null,
  });

  const tasks = data?.pendingTasks.pendingTasks ?? [];

  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");

  // Only years that actually have a pending task for this parent — never the full system list
  // of academic years (BACKEND_ACADEMIC_YEARS is used only to order these, not to seed them).
  const availableAcademicYears = useMemo(() => {
    const years = new Set<string>();
    tasks.forEach((task) => {
      const ay = tryAcademicYearFromEnroleeNumber(task.enroleeNumber);
      if (ay) years.add(ay);
    });
    return BACKEND_ACADEMIC_YEARS.filter((ay) => years.has(ay));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (selectedAcademicYear === "all") return tasks;
    return tasks.filter((task) => tryAcademicYearFromEnroleeNumber(task.enroleeNumber) === selectedAcademicYear);
  }, [tasks, selectedAcademicYear]);

  if (isPending) return <PendingTasksLoader />;

  return (
    <MaxWidthWrapper className="animate-in fade-in slide-in-from-bottom-2 duration-500 w-full max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <Link
          to="/admission/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">Document Requirements</h1>
            <p className="text-slate-500 mt-2">
              Outstanding document requirements for enrolment applications already submitted for your children.
            </p>
          </div>

          {availableAcademicYears.length >= 2 && (
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableAcademicYears.map((ay) => (
                  <SelectItem key={ay} value={ay}>
                    {`AY ${ay.slice(2)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="bg-emerald-50 p-4 rounded-full mb-4">
            <CheckCircle2 className="size-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-primary">All caught up!</h2>
          <p className="text-center text-balance text-sm font-medium text-slate-500 max-w-[380px] leading-snug">
            There are no outstanding document requirements for your children's enrolment at this time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const academicYear = tryAcademicYearFromEnroleeNumber(task.enroleeNumber) ?? "";

              return (
                <div key={task.enroleeNumber} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 shrink-0 rounded-full bg-amber-100 p-2">
                        <Info className="size-5 text-amber-600" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm leading-relaxed text-slate-600">
                          Enrollee{" "}
                          <Link
                            to={`/admission/enrolments/application/${task.enroleeNumber}?academicYear=${academicYear}`}
                            className="font-bold text-primary underline underline-offset-2">
                            #{task.enroleeNumber}
                          </Link>{" "}
                          &mdash; their existing{" "}
                          <span className="font-bold">{academicYear ? `AY ${academicYear.slice(2)}` : ""}</span>{" "}
                          application requires the following documents:
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.studentDocs &&
                            task.studentDocs.length > 0 &&
                            task.studentDocs.map((doc: Record<string, string>, i: number) => {
                              const [name, status] = Object.entries(doc)[0];
                              return (
                                <div
                                  key={i}
                                  className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                  <span className="font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                                  <span
                                    className={cn(
                                      "font-bold uppercase text-[10px]",
                                      status === "To follow" ? "text-primary" : "text-destructive",
                                    )}>
                                    {status}
                                  </span>
                                </div>
                              );
                            })}

                          {task.parentGuardianDocs &&
                            task.parentGuardianDocs.length > 0 &&
                            task.parentGuardianDocs.map((doc: Record<string, string>, i: number) => {
                              const [name, status] = Object.entries(doc)[0];
                              return (
                                <div
                                  key={i}
                                  className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                  <span className="font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
                                  <span
                                    className={cn(
                                      "font-bold uppercase text-[10px]",
                                      status === "To follow" ? "text-primary" : "text-destructive",
                                    )}>
                                    {status}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/admission/enrolments/application/${task.enroleeNumber}?academicYear=${academicYear}`}
                      state={{
                        studentDocsActions: task.studentDocs && task.studentDocs.length > 0,
                        parentGuardianDocsActions: task.parentGuardianDocs && task.parentGuardianDocs.length > 0,
                      }}
                      className={buttonVariants({
                        className: "text-xs !font-bold",
                      })}>
                      Upload Documents
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MaxWidthWrapper>
  );
}

function PendingTasksLoader() {
  return (
    <div className="min-h-dvh w-full flex flex-col gap-4 items-center justify-center">
      <Tailspin size="40" stroke="5" speed="0.9" color="#4F46E5" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading student records...</p>
    </div>
  );
}

export default PendingTasks;
```

Note what changed vs. the original file: added the `Select`/`useState`/`useMemo`/`BACKEND_ACADEMIC_YEARS` imports; moved `tasks` above the `isPending` early return and added `selectedAcademicYear`/`availableAcademicYears`/`filteredTasks` there too (required — hooks can't be called after a conditional early return); added the `Select` block in the header; the task-list `.map()` now iterates `filteredTasks` instead of `tasks` (the zero-state check on line `tasks.length === 0` is intentionally left reading the *unfiltered* `tasks`, per the spec's Empty States section).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/pages/private/pending-tasks.test.tsx`

Expected: PASS — all 6 tests green.

- [ ] **Step 5: Run the full verification suite**

Run: `npx tsc -b`
Expected: no output (clean build).

Run: `npx eslint src/pages/private/pending-tasks.tsx src/pages/private/pending-tasks.test.tsx`
Expected: `0 errors` (pre-existing unrelated warnings elsewhere in the repo don't count against this).

Run: `npx vitest run`
Expected: every test file passes, including the new `pending-tasks.test.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/private/pending-tasks.tsx src/pages/private/pending-tasks.test.tsx
git commit -m "feat(pending-tasks): filter document requirements by academic year"
```

---

## Manual Verification

1. `npm run dev`, log in as a parent with pending document tasks across 2+ academic years.
2. Confirm the "AY ####" dropdown appears next to the page heading, defaulting to "All Years".
3. Pick a specific year — confirm only that year's enrollee rows remain.
4. Switch back to "All Years" — confirm every row returns.
5. As a parent with pending tasks in only one academic year, confirm the dropdown does not render at all.
6. As a parent with zero pending tasks, confirm the existing "All caught up!" empty state still renders (no dropdown).
