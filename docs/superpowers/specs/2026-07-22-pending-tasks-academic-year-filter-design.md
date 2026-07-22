# Pending Tasks: filter by academic year

## Context

`src/pages/private/pending-tasks.tsx` ("Document Requirements") lists every outstanding
document requirement across all of a parent's enrolments in one flat list. Each task already
carries its academic year implicitly via `task.enroleeNumber`, decoded client-side with
`tryAcademicYearFromEnroleeNumber` and shown inline (e.g. "AY 2027"). A parent with children (or
one child) enrolled across multiple academic years currently has no way to narrow the list down
to just the enrolment they're working on — everything is interleaved.

This adds an academic-year filter so a parent can isolate "what does *this* enrolment still
need" without scanning the whole list.

## Goal

Let a parent filter the pending-tasks list down to one academic year, scoped only to years that
actually have outstanding tasks for them.

## Non-goals

- No backend/query changes. `getSectionCardsDetails` and `getEnrollmentPendingDocuments`
  (`src/actions/private.ts`) are untouched — there's no stored `academic_year` column on these
  records to filter with server-side (the year only exists parsed out of `enroleeNumber`), and
  the full task list is already fetched in one shot, so there's no meaningful round-trip savings
  from pushing the filter server-side. This was discussed and explicitly decided against in favor
  of client-side filtering.
- No filter option for academic years that have zero pending tasks. The dropdown is not a
  generic "browse all years" picker — it only ever lists years the parent actually needs to act
  on right now.
- No persistence of the selected filter (URL param, localStorage) across navigations/reloads.
  Not requested; add later if it turns out to matter.

## Design

### State & filtering

- `useState<string>("all")` for the selected academic year, local to `PendingTasks`.
- `useMemo` derives the distinct academic years present across `tasks`, by mapping each task
  through the same `tryAcademicYearFromEnroleeNumber(task.enroleeNumber)` call the page already
  uses for display, deduping, dropping nulls, and sorting to match `BACKEND_ACADEMIC_YEARS`'s
  newest-first order (`src/config/academic-years.ts`).
- The rendered list is `tasks` filtered by
  `tryAcademicYearFromEnroleeNumber(task.enroleeNumber) === selectedAcademicYear`, or the
  unfiltered `tasks` when `selectedAcademicYear === "all"`.

### UI

- A ShadCN `Select` (`@/components/ui/select`), matching the existing filter-select pattern in
  `src/pages/admin/move-student.tsx` (`Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/
  `SelectItem`) rather than a tabs/pill control.
- Placed in the page header area, near the "Document Requirements" heading.
- Options: `"All Years"` (value `"all"`) followed by one entry per derived year, labeled the same
  way this page already labels years inline — `` `AY ${year.slice(2)}` `` (e.g. "AY 2027") — no
  new label format introduced.
- **Only rendered when 2+ distinct academic years are present.** With zero or one year, a filter
  has nothing meaningful to do, so it's omitted rather than shown as a no-op control.
- Defaults to `"all"` on every page load — purely opt-in, matches current (unfiltered) behavior
  when untouched.

### Empty states

- Unchanged. The existing "All caught up!" empty state fires only when `tasks.length === 0`,
  before the filter renders at all.
- No new "no results for this filter" state is needed: filter options are derived exclusively
  from years present in `tasks`, so selecting any option is guaranteed to yield at least one
  result.

### Testing

`pending-tasks.tsx` currently has no test file. Add `pending-tasks.test.tsx` covering:

- Filter is hidden when tasks span 0 or 1 distinct academic year.
- Filter is shown and correctly narrows the rendered list when tasks span 2+ years.
- Selecting "All Years" after narrowing restores the full list.
- The "All caught up!" empty state still renders correctly and independently of the filter (zero
  tasks → no filter, no list, just the empty state).

## Open questions

None — design approved as-is by the requester.
