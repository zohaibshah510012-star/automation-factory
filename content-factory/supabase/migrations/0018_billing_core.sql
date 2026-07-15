create table public.plans (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text,
  price numeric not null default 0, credits integer not null default 0,
  features jsonb not null default '{}'::jsonb, enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id), status text not null default 'active',
  started_at timestamptz not null default now(), expires_at timestamptz, created_at timestamptz not null default now()
);
create table public.subscription_adjustments (
  id uuid primary key default gen_random_uuid(), subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  operator uuid references public.profiles(id), reason text not null, before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.credit_transactions add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null;
create unique index credit_transactions_subscription_type_once on public.credit_transactions(subscription_id,type) where subscription_id is not null;
create or replace function public.grant_subscription_credits(p_subscription_id uuid) returns integer language plpgsql security definer set search_path=public as $$
declare sub public.subscriptions%rowtype; grant_amount integer; new_balance integer;
begin
 perform pg_advisory_xact_lock(hashtext(p_subscription_id::text)); select * into sub from public.subscriptions where id=p_subscription_id;
 if sub.id is null then raise exception 'SUBSCRIPTION_NOT_FOUND'; end if;
 if exists(select 1 from public.credit_transactions where subscription_id=p_subscription_id and type='subscription_grant') then select credits_balance into new_balance from public.profiles where id=sub.user_id; return new_balance; end if;
 select credits into grant_amount from public.plans where id=sub.plan_id; update public.profiles set credits_balance=credits_balance+grant_amount,updated_at=now() where id=sub.user_id returning credits_balance into new_balance;
 insert into public.credit_transactions(user_id,amount,balance_after,reason,subscription_id,type,status) values(sub.user_id,grant_amount,new_balance,'subscription:'||p_subscription_id,p_subscription_id,'subscription_grant','completed'); return new_balance;
end; $$;
alter table public.plans enable row level security; alter table public.subscriptions enable row level security; alter table public.subscription_adjustments enable row level security;
create policy "plans visible" on public.plans for select using(enabled or public.is_admin());
create policy "subscriptions own" on public.subscriptions for select using(user_id=auth.uid() or public.is_admin());
create policy "subscription adjustments admin" on public.subscription_adjustments for select using(public.is_admin());
