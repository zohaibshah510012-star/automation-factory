-- Beta Operations: manual cohort status without changing the core profiles schema.
create table if not exists public.beta_user_statuses (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited','active','completed','churned')),
  note text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_user_statuses_status_updated_idx
  on public.beta_user_statuses(status, updated_at desc);

alter table public.beta_user_statuses enable row level security;

drop policy if exists "beta user statuses admin access" on public.beta_user_statuses;
create policy "beta user statuses admin access" on public.beta_user_statuses
  for all using (public.is_admin()) with check (public.is_admin());
