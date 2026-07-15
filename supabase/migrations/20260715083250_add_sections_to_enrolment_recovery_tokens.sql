-- Lets an admin scope a recovery link to specific wizard tabs (studentInfo/familyInfo/
-- enrollmentInfo/uploads) instead of always sharing the full application — e.g. the parent
-- only needs to redo family info, so only that tab is shown/required on the recovery page.

alter table public.enrolment_recovery_tokens
  add column if not exists sections text[] not null default '{studentInfo,familyInfo,enrollmentInfo,uploads}';
