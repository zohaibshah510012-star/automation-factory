-- Idempotent, task-scoped credit settlement for the task runner.
alter table public.credit_transactions
  add column if not exists type text not null default 'charge',
  add column if not exists status text not null default 'completed';

alter table public.credit_transactions drop constraint if exists credit_transactions_amount_check;
alter table public.credit_transactions
  add constraint credit_transactions_amount_check
  check (amount <> 0 or type = 'charge');

create unique index if not exists credit_transactions_task_type_once
  on public.credit_transactions(content_task_id, type)
  where content_task_id is not null;

create or replace function public.reserve_task_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_task_id uuid
) returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
declare existing_status text;
begin
  if p_amount <= 0 then raise exception 'INVALID_CREDIT_AMOUNT'; end if;
  perform pg_advisory_xact_lock(hashtext(p_task_id::text));

  select status into existing_status from public.credit_transactions
  where content_task_id = p_task_id and type = 'reserve';
  if existing_status is not null then
    if existing_status = 'refunded' then raise exception 'TASK_CREDITS_ALREADY_REFUNDED'; end if;
    select credits_balance into new_balance from public.profiles where id = p_user_id;
    return new_balance;
  end if;

  update public.profiles set credits_balance = credits_balance - p_amount, updated_at = now()
  where id = p_user_id and status = 'active' and credits_balance >= p_amount
  returning credits_balance into new_balance;
  if new_balance is null then raise exception 'INSUFFICIENT_CREDITS'; end if;

  insert into public.credit_transactions(user_id, amount, balance_after, reason, content_task_id, type, status)
  values (p_user_id, -p_amount, new_balance, p_reason, p_task_id, 'reserve', 'reserved');
  return new_balance;
end;
$$;

create or replace function public.commit_task_credits(p_task_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare reservation public.credit_transactions%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext(p_task_id::text));
  select * into reservation from public.credit_transactions
  where content_task_id = p_task_id and type = 'reserve' for update;
  if reservation.id is null then raise exception 'CREDIT_RESERVATION_NOT_FOUND'; end if;
  if reservation.status = 'refunded' then raise exception 'CREDIT_RESERVATION_REFUNDED'; end if;
  if reservation.status = 'committed' then return reservation.balance_after; end if;

  update public.credit_transactions set status = 'committed' where id = reservation.id;
  insert into public.credit_transactions(user_id, amount, balance_after, reason, content_task_id, type, status)
  values (reservation.user_id, 0, reservation.balance_after, reservation.reason, p_task_id, 'charge', 'completed')
  on conflict (content_task_id, type) where content_task_id is not null do nothing;
  return reservation.balance_after;
end;
$$;

create or replace function public.refund_task_credits(p_task_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare reservation public.credit_transactions%rowtype;
declare new_balance integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_task_id::text));
  select * into reservation from public.credit_transactions
  where content_task_id = p_task_id and type = 'reserve' for update;
  if reservation.id is null then
    select credits_balance into new_balance from public.content_tasks t join public.profiles p on p.id = t.user_id where t.id = p_task_id;
    return new_balance;
  end if;
  if reservation.status = 'refunded' then return reservation.balance_after + abs(reservation.amount); end if;
  if reservation.status = 'committed' then raise exception 'CREDIT_RESERVATION_COMMITTED'; end if;

  update public.profiles set credits_balance = credits_balance + abs(reservation.amount), updated_at = now()
  where id = reservation.user_id returning credits_balance into new_balance;
  update public.credit_transactions set status = 'refunded' where id = reservation.id;
  insert into public.credit_transactions(user_id, amount, balance_after, reason, content_task_id, type, status)
  values (reservation.user_id, abs(reservation.amount), new_balance, 'generation_refund', p_task_id, 'refund', 'completed')
  on conflict (content_task_id, type) where content_task_id is not null do nothing;
  return new_balance;
end;
$$;
