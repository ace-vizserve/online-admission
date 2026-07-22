-- Extends application_drafts (20260704100148_create_application_drafts.sql) to also back the
-- re-enrollment (current-student) flow's per-tab drafts, mirroring the new-student flow's
-- existing localStorage + DB persistence. Root cause being fixed: the re-enrollment flow
-- previously had no durable draft at all (sessionStorage-only), so a parent's saved edits were
-- lost the moment the tab closed or an in-app browser reclaimed its ephemeral storage.
--
-- Re-enrollment drafts are identified by `enrolee_number` (the student's existing enrolee
-- number) rather than a client-generated `draft_id` — unlike a brand-new application, there's
-- always a natural key to resume by, and the whole point is being able to load a draft even
-- when the client has no `draft_id` left (cleared cache, different device/browser).

-- Unnamed inline CHECK constraints get Postgres's default `{table}_{column}_check` name; this
-- table was created without an explicit constraint name, so that's what's being replaced here.
alter table public.application_drafts
  drop constraint application_drafts_type_check;

alter table public.application_drafts
  add constraint application_drafts_type_check
  check (type in ('hfse-is', 'viz-school', 'hfse-is-reenrol'));

alter table public.application_drafts
  add column enrolee_number text;

-- One in-progress re-enrollment draft per (user, enrolee) — a save-per-tab upserts onto the
-- same row instead of accumulating duplicates. A plain (non-partial) unique constraint is used
-- deliberately, not a `where enrolee_number is not null` partial index: PostgREST's upsert
-- (`.upsert(row, { onConflict: "user_id,enrolee_number" })`, used by saveReenrolDraftRemote in
-- src/actions/drafts.ts) generates a bare `ON CONFLICT (user_id, enrolee_number)` with no WHERE
-- clause, which Postgres can only resolve against a matching unique constraint/index — a partial
-- index's predicate would have to be repeated in the conflict clause, which the JS client has no
-- way to do. This is still safe for the pre-existing new-student rows: every one of them has
-- enrolee_number = NULL, and standard SQL/Postgres treats NULLs as distinct for uniqueness
-- purposes, so any number of NULL rows can coexist under this constraint.
alter table public.application_drafts
  add constraint application_drafts_user_id_enrolee_number_key unique (user_id, enrolee_number);
