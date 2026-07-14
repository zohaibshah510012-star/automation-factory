create table public.platform_admins (user_id uuid primary key references public.profiles(id) on delete cascade, created_at timestamptz not null default now());
create table public.workflow_step_runs (id uuid primary key default gen_random_uuid(), workflow_run_id uuid references public.workflow_runs(id) on delete cascade, step_id uuid references public.workflow_steps(id) on delete set null, position integer not null, status public.task_status not null default 'pending', input jsonb, output jsonb, error text, started_at timestamptz, completed_at timestamptz);
create table public.audit_logs (id uuid primary key default gen_random_uuid(), admin_id uuid references public.profiles(id) on delete set null, action text not null, resource_type text, resource_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
alter table public.platform_admins enable row level security;alter table public.workflow_step_runs enable row level security;alter table public.audit_logs enable row level security;
create policy "admins view admins" on public.platform_admins for select using(public.is_admin());
create policy "admins view step runs" on public.workflow_step_runs for select using(public.is_admin());
create policy "admins view audit" on public.audit_logs for select using(public.is_admin());
