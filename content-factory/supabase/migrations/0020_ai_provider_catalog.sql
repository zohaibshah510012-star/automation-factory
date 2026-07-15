insert into public.ai_providers(provider_name, enabled, model, secret_ref) values
  ('flux', false, 'flux-1.1-pro', 'FLUX_API_KEY'),
  ('runway', false, 'gen4_turbo', 'RUNWAY_API_KEY'),
  ('kling', false, 'kling-v1', 'KLING_API_KEY')
on conflict (provider_name) do update set
  model = excluded.model,
  secret_ref = excluded.secret_ref,
  updated_at = now();
