-- AI Cost Governance: provider cost tracking for Beta operations.
create table if not exists public.ai_provider_costs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  content_task_id uuid references public.content_tasks(id) on delete set null,
  ai_generation_id uuid references public.ai_generations(id) on delete set null,
  usage_history_id uuid references public.usage_history(id) on delete set null,
  provider text not null,
  model text,
  task_type text,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric not null default 0,
  credits_used integer not null default 0,
  status text not null default 'completed',
  error text,
  created_at timestamptz not null default now()
);

create index if not exists ai_provider_costs_created_idx on public.ai_provider_costs(created_at desc);
create index if not exists ai_provider_costs_provider_created_idx on public.ai_provider_costs(provider, created_at desc);
create index if not exists ai_provider_costs_task_idx on public.ai_provider_costs(content_task_id);
create index if not exists ai_provider_costs_user_created_idx on public.ai_provider_costs(user_id, created_at desc);

alter table public.ai_provider_costs enable row level security;

drop policy if exists "ai costs own or admin" on public.ai_provider_costs;
create policy "ai costs own or admin" on public.ai_provider_costs
  for select using (user_id = auth.uid() or public.is_admin());
