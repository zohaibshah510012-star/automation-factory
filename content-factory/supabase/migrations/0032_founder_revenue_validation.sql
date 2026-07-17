-- Founder Revenue Validation: record commercial customer projects without changing AI workflows.
create table if not exists public.founder_customer_projects (
  id uuid primary key default gen_random_uuid(),
  customer_brand text not null,
  project_name text not null,
  workflow_used text not null,
  product_info text,
  business_need text,
  content_task_ids uuid[] not null default '{}'::uuid[],
  distribution_job_ids uuid[] not null default '{}'::uuid[],
  generated_assets jsonb not null default '[]'::jsonb,
  deliverables jsonb not null default '{}'::jsonb,
  generation_cost numeric(12, 4) not null default 0,
  credits_used integer not null default 0,
  status text not null default 'planned' check (status in ('planned','generating','reviewing','ready_to_sell','delivered','won','lost')),
  result_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists founder_customer_projects_status_updated_idx
  on public.founder_customer_projects(status, updated_at desc);

create index if not exists founder_customer_projects_workflow_updated_idx
  on public.founder_customer_projects(workflow_used, updated_at desc);

alter table public.founder_customer_projects enable row level security;

drop policy if exists "founder customer projects admin access" on public.founder_customer_projects;
create policy "founder customer projects admin access" on public.founder_customer_projects
  for all using (public.is_admin()) with check (public.is_admin());
