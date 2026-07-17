-- Founder Beta data cleanup: isolate real cohort metrics and record new task durations.
alter table public.content_tasks
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

create index if not exists content_tasks_user_duration_idx
  on public.content_tasks(user_id, duration_ms, updated_at desc)
  where duration_ms is not null;

create index if not exists beta_cohort_members_cohort_updated_idx
  on public.beta_cohort_members(cohort_id, updated_at desc);
