-- Lets the admin "Recent links" list show a human-readable student name without a live
-- per-row lookup against the (possibly still-incomplete) per-academic-year tables. Captured
-- once at link-generation time from whatever's known then — purely a display convenience,
-- no behavior depends on it.

alter table public.enrolment_recovery_tokens
  add column if not exists student_name text;
