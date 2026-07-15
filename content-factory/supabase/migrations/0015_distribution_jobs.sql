create table public.distribution_jobs(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id) on delete set null,content_id uuid not null,content_type text not null,platform text not null,status text not null default 'draft' check(status in ('draft','queued','publishing','published','failed')),payload jsonb not null default '{}'::jsonb,result jsonb,error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index distribution_jobs_user_updated_idx on public.distribution_jobs(user_id,updated_at desc);
alter table public.distribution_jobs enable row level security;
create policy "distribution jobs own or admin" on public.distribution_jobs for select using(user_id=auth.uid() or public.is_admin());
