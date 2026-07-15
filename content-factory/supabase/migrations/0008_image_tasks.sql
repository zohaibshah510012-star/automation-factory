-- Extend the existing image task model with provider output and failure diagnostics.
alter table public.image_tasks
  add column if not exists provider_name text,
  add column if not exists result_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists error text;

create index if not exists image_tasks_user_updated_idx on public.image_tasks(user_id, updated_at desc);
