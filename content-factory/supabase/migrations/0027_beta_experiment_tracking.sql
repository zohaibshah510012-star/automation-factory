-- Beta Experiment Tracking: add lifecycle and revenue-intent events.
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
  'second_generation_started',
  'third_generation_started',
  'task_complete',
  'first_generation_completed',
  'first_asset_created',
  'credits_consumed',
  'return_visit',
  'billing_view',
  'pricing_view',
  'upgrade_click',
  'feedback_submitted'
));
