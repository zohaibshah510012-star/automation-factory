-- Extend the existing video task model for pluggable asynchronous providers.
alter type public.task_status add value if not exists 'processing';
alter table public.video_tasks
  add column if not exists provider_name text,
  add column if not exists video_url text,
  add column if not exists thumbnail_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists error text;

create index if not exists video_tasks_user_updated_idx on public.video_tasks(user_id, updated_at desc);
