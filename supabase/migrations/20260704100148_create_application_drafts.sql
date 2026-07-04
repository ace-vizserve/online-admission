-- Server-side backing store for new-student enrollment drafts, mirroring the
-- client's EnrolNewStudentDraftStore shape (src/zustand-store.ts). Source of
-- truth for cross-device/cross-browser resume; localStorage remains a
-- write-through cache on the client.

create table if not exists public.application_drafts (
  draft_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('hfse-is', 'viz-school')),
  academic_year text,
  form_state jsonb not null default '{}'::jsonb,
  current_tab text,
  active_tab text,
  completed_tabs text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  last_saved_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists application_drafts_user_id_type_idx
  on public.application_drafts (user_id, type);

alter table public.application_drafts enable row level security;

create policy "Users can view their own drafts"
  on public.application_drafts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own drafts"
  on public.application_drafts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on public.application_drafts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own drafts"
  on public.application_drafts
  for delete
  using (auth.uid() = user_id);
