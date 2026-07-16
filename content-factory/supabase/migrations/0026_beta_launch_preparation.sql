-- Beta Launch Preparation: invite gating, onboarding event taxonomy, feedback workflow.
create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending','used','revoked')),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists beta_invites_email_idx on public.beta_invites(lower(email));
create index if not exists beta_invites_status_created_idx on public.beta_invites(status, created_at desc);

alter table public.beta_invites enable row level security;

drop policy if exists "beta invites admin access" on public.beta_invites;
create policy "beta invites admin access" on public.beta_invites
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.product_events drop constraint if exists product_events_event_name_check;
alter table public.product_events add constraint product_events_event_name_check check (event_name in (
  'page_view',
  'cta_click',
  'signup_complete',
  'signup_completed',
  'first_workspace_created',
  'template_view',
  'template_select',
  'task_create',
  'first_generation_started',
  'task_complete',
  'first_generation_completed',
  'first_asset_created',
  'credits_consumed',
  'billing_view',
  'upgrade_click'
));

alter table public.user_feedback add column if not exists content_task_id uuid references public.content_tasks(id) on delete set null;

update public.user_feedback set status = 'open' where status = 'new';
update public.user_feedback set status = 'reviewing' where status = 'reviewed';
update public.user_feedback set status = 'resolved' where status in ('archived','resolved');

alter table public.user_feedback drop constraint if exists user_feedback_status_check;
alter table public.user_feedback add constraint user_feedback_status_check check (status in ('open','reviewing','resolved'));
alter table public.user_feedback alter column status set default 'open';

create index if not exists user_feedback_task_idx on public.user_feedback(content_task_id);
