-- Founder Beta Run: lightweight cohort tracking and review notes for real-user validation.
create table if not exists public.beta_cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_users integer not null default 5 check (target_users > 0),
  status text not null default 'running' check (status in ('draft','running','completed')),
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_cohorts_status_updated_idx
  on public.beta_cohorts(status, updated_at desc);

create table if not exists public.beta_cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.beta_cohorts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  invite_id uuid references public.beta_invites(id) on delete set null,
  status text not null default 'invited' check (status in ('invited','signup','workspace','first_generation','result','feedback','completed','churned')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beta_cohort_members_user_or_invite_check check (user_id is not null or invite_id is not null)
);

create unique index if not exists beta_cohort_members_cohort_user_uidx
  on public.beta_cohort_members(cohort_id, user_id)
  where user_id is not null;

create unique index if not exists beta_cohort_members_cohort_invite_uidx
  on public.beta_cohort_members(cohort_id, invite_id)
  where invite_id is not null;

create index if not exists beta_cohort_members_status_updated_idx
  on public.beta_cohort_members(status, updated_at desc);

create table if not exists public.beta_review_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  cohort_id uuid references public.beta_cohorts(id) on delete set null,
  content_task_id uuid references public.content_tasks(id) on delete set null,
  category text not null check (category in ('feedback','need','bug','feature_request','business_signal')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  note text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_review_notes_status_created_idx
  on public.beta_review_notes(status, created_at desc);

create index if not exists beta_review_notes_category_priority_idx
  on public.beta_review_notes(category, priority, created_at desc);

create index if not exists beta_review_notes_user_created_idx
  on public.beta_review_notes(user_id, created_at desc);

alter table public.beta_cohorts enable row level security;
alter table public.beta_cohort_members enable row level security;
alter table public.beta_review_notes enable row level security;

drop policy if exists "beta cohorts admin access" on public.beta_cohorts;
create policy "beta cohorts admin access" on public.beta_cohorts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "beta cohort members admin access" on public.beta_cohort_members;
create policy "beta cohort members admin access" on public.beta_cohort_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "beta review notes admin access" on public.beta_review_notes;
create policy "beta review notes admin access" on public.beta_review_notes
  for all using (public.is_admin()) with check (public.is_admin());
