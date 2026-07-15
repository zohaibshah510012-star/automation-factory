create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_id text,
  event_name text not null check (event_name in (
    'page_view',
    'cta_click',
    'signup_complete',
    'template_view',
    'template_select',
    'task_create',
    'task_complete',
    'billing_view',
    'upgrade_click'
  )),
  surface text not null default 'unknown',
  path text,
  properties jsonb not null default '{}'::jsonb,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists product_events_event_created_idx on public.product_events(event_name, created_at desc);
create index if not exists product_events_user_created_idx on public.product_events(user_id, created_at desc);
create index if not exists product_events_surface_created_idx on public.product_events(surface, created_at desc);

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  satisfaction integer not null check (satisfaction between 1 and 5),
  category text not null default 'general',
  content_feedback text,
  suggestion text,
  source text not null default 'dashboard',
  status text not null default 'new' check (status in ('new','reviewed','resolved','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_feedback_status_created_idx on public.user_feedback(status, created_at desc);
create index if not exists user_feedback_user_created_idx on public.user_feedback(user_id, created_at desc);

alter table public.product_events enable row level security;
alter table public.user_feedback enable row level security;

drop policy if exists "product events admin read" on public.product_events;
drop policy if exists "feedback own or admin read" on public.user_feedback;
drop policy if exists "feedback own insert" on public.user_feedback;
drop policy if exists "feedback admin update" on public.user_feedback;

create policy "product events admin read" on public.product_events
for select using (public.is_admin());

create policy "feedback own or admin read" on public.user_feedback
for select using (user_id = auth.uid() or public.is_admin());

create policy "feedback own insert" on public.user_feedback
for insert with check (user_id = auth.uid());

create policy "feedback admin update" on public.user_feedback
for update using (public.is_admin()) with check (public.is_admin());
