-- Beta Validation Readiness: first-user workflow tracking and richer feedback signals.
alter table public.product_events drop constraint if exists product_events_event_name_check;
alter table public.product_events add constraint product_events_event_name_check check (event_name in (
  'page_view',
  'cta_click',
  'signup_complete',
  'signup_completed',
  'first_workspace_created',
  'template_view',
  'template_select',
  'workflow_created',
  'first_workflow_created',
  'task_create',
  'first_generation_started',
  'second_generation_started',
  'third_generation_started',
  'task_complete',
  'generation_failed',
  'first_generation_completed',
  'first_asset_created',
  'credits_consumed',
  'return_visit',
  'billing_view',
  'pricing_view',
  'upgrade_click',
  'feedback_submitted'
));

alter table public.user_feedback add column if not exists result_quality integer check (result_quality between 1 and 5);
alter table public.user_feedback add column if not exists use_case text;
alter table public.user_feedback add column if not exists continue_use boolean;

create index if not exists product_events_workflow_created_idx on public.product_events(event_name, created_at desc)
  where event_name in ('workflow_created','first_workflow_created','generation_failed');
create index if not exists user_feedback_continue_use_idx on public.user_feedback(continue_use, created_at desc);
