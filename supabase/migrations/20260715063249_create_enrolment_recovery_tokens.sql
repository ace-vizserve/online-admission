-- Backing store for the "shareable completion link" recovery flow: a record can end up
-- with rows in `{ay}_enrolment_documents` / `{ay}_enrolment_status` but no matching row in
-- `{ay}_enrolment_applications` (the only table holding the parent/student data itself).
-- An admin generates a token here for one specific enroleeNumber; the parent opens
-- `/complete-enrolment/:token` (no login) to fill in the missing application. Only the
-- `recovery-link` edge function (service role) ever reads/writes this table — no RLS
-- policies are defined, so anon/authenticated clients are denied entirely.

create table if not exists public.enrolment_recovery_tokens (
  token uuid primary key default gen_random_uuid(),
  academic_year text not null,
  enrolee_number text not null,
  student_number text,
  category text not null check (category in ('New', 'Current', 'VizSchool New', 'VizSchool Current')),
  missing_tables text[] not null default '{}',
  created_by text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists enrolment_recovery_tokens_enrolee_idx
  on public.enrolment_recovery_tokens (academic_year, enrolee_number);

alter table public.enrolment_recovery_tokens enable row level security;
