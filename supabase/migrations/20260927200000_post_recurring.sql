-- Recurring items post themselves as transactions once a day (pg_cron, inside each project).
-- Only charges after the item was created are posted: a debt started last year doesn't backfill
-- a year of movements (the balance the user typed already includes them).
-- Same schedule rules as api/src/schedule.ts: month/year steps keep the day and clamp to shorter
-- months (Postgres date + interval does that), end date and number of payments limit the schedule,
-- and a debt stops once its installments cover the initial amount (the last one may be smaller).

alter table public.recurring_expenses add column last_posted_on date not null default current_date;

alter table public.transactions drop constraint transactions_source_check;
alter table public.transactions add constraint transactions_source_check check (source in ('manual', 'ocr', 'bank', 'recurring'));
alter table public.transactions
  add column recurring_id bigint references public.recurring_expenses (id) on delete set null,
  -- Idempotent posting: one transaction per item and charge date (NULLs never collide).
  add constraint transactions_recurring_once unique (recurring_id, occurred_on);

create function private.post_recurring(p_today date default current_date)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  posted int;
begin
  with due as (
    select r.*, o.n, o.occ
    from public.recurring_expenses r
    cross join lateral (
      select n, case r.interval_unit
          when 'week' then r.start_date + n * 7 * r.interval_count
          when 'month' then (r.start_date + make_interval(months => n * r.interval_count))::date
          else (r.start_date + make_interval(years => n * r.interval_count))::date
        end as occ
      -- ponytail: fixed 1200-step series per item; fine for personal volumes, index maths if it grows.
      from generate_series(0, 1199) n
    ) o
    where r.status = 'active'
      and o.occ > r.last_posted_on and o.occ <= p_today
      and (r.end_date is null or o.occ <= r.end_date)
      and (r.payments_total is null or o.n < r.payments_total)
      and (r.kind <> 'debt' or r.initial_amount is null or o.n * r.amount < r.initial_amount)
  ), inserted as (
    insert into public.transactions (user_id, type, amount, currency, category_id, account_id, occurred_on, note, source, recurring_id)
    select user_id,
           case direction when 'income' then 'income' else 'expense' end,
           case when kind = 'debt' and initial_amount is not null then least(amount, initial_amount - n * amount) else amount end,
           currency, category_id, account_id, occ, name, 'recurring', id
    from due
    on conflict (recurring_id, occurred_on) do nothing
    returning 1
  )
  select count(*) into posted from inserted;

  update public.recurring_expenses set last_posted_on = p_today where last_posted_on < p_today;
  return posted;
end;
$$;

revoke execute on function private.post_recurring(date) from public, anon, authenticated;

create extension if not exists pg_cron;
-- 03:15 UTC every day.
select cron.schedule('post-recurring', '15 3 * * *', $$select private.post_recurring()$$);
