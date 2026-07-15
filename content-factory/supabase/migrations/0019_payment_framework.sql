create table public.payment_providers (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check (provider in ('mock','stripe','paypal')),
  enabled boolean not null default false,
  mode text not null default 'sandbox' check (mode in ('sandbox','production')),
  status text not null default 'disabled' check (status in ('configured','disabled','unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null,
  provider_payment_id text,
  amount numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','paid','failed','canceled')),
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  provider text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

alter table public.payment_providers enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

create policy "admins manage payment providers" on public.payment_providers for all using (public.is_admin()) with check (public.is_admin());
create policy "payments own or admin" on public.payments for select using (user_id = auth.uid() or public.is_admin());
create policy "payment events admin" on public.payment_events for select using (public.is_admin());

create index payments_user_created_idx on public.payments(user_id, created_at desc);
create index payment_events_payment_created_idx on public.payment_events(payment_id, created_at desc);

insert into public.payment_providers(provider, enabled, mode, status) values
  ('mock', true, 'sandbox', 'configured'),
  ('stripe', false, 'sandbox', 'disabled'),
  ('paypal', false, 'sandbox', 'disabled')
on conflict (provider) do nothing;
