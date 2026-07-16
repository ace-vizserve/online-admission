-- Lightweight audit trail for the recovery-link "Generate & send" flow: was this link
-- actually emailed, and to whom. No behavior depends on these columns — purely for admin
-- visibility on the recovery-link admin page.

alter table public.enrolment_recovery_tokens
  add column if not exists notified_email text,
  add column if not exists notified_at timestamptz;
