create or replace function public.admin_adjust_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text
) returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_amount = 0 then raise exception 'INVALID_CREDIT_AMOUNT'; end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  update public.profiles
  set credits_balance = credits_balance + p_amount, updated_at = now()
  where id = p_user_id
    and credits_balance + p_amount >= 0
  returning credits_balance into new_balance;

  if new_balance is null then raise exception 'INVALID_CREDIT_BALANCE'; end if;

  insert into public.credit_transactions(user_id, amount, balance_after, reason, type, status)
  values (p_user_id, p_amount, new_balance, coalesce(nullif(p_reason, ''), 'admin_manual_adjustment'), 'admin_adjustment', 'completed');

  return new_balance;
end;
$$;
