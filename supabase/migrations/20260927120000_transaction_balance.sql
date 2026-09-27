-- Manual accounts: a transaction linked to one moves its balance (income adds, expense subtracts).
-- Bank accounts (Fase 3) take their balance from the bank, so they are left alone.
-- Only same-currency movements apply; amounts are never converted.
-- security invoker: runs under the caller's RLS, so it can only touch the caller's own accounts.

create function private.apply_transaction_to_account()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.account_id is not null then
    update public.accounts
      set balance = balance - case when old.type = 'income' then old.amount else -old.amount end,
          balance_updated_at = now()
      where id = old.account_id and user_id = old.user_id and source = 'manual' and currency = old.currency;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.account_id is not null then
    update public.accounts
      set balance = balance + case when new.type = 'income' then new.amount else -new.amount end,
          balance_updated_at = now()
      where id = new.account_id and user_id = new.user_id and source = 'manual' and currency = new.currency;
  end if;
  return null;
end;
$$;

revoke execute on function private.apply_transaction_to_account() from public, anon;

create trigger transactions_apply_to_account
  after insert or delete or update of type, amount, currency, account_id on public.transactions
  for each row execute function private.apply_transaction_to_account();
