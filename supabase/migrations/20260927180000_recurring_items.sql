-- Recurring items cover income too (salary, investment income…) and carry their full schedule:
-- start date, optional end date or number of payments, and, for debts, the initial amount so the
-- API can work out what is already paid and when the debt ends. next_charge_date stays as a cache
-- the API refreshes on write; reads compute the next charge from the schedule.

alter table public.recurring_expenses
  add column direction text not null default 'expense' check (direction in ('expense', 'income')),
  add column start_date date,
  add column end_date date,
  add column payments_total int check (payments_total is null or payments_total between 1 and 1200),
  add column initial_amount numeric(14, 2) check (initial_amount is null or initial_amount > 0);

update public.recurring_expenses set start_date = next_charge_date where start_date is null;
alter table public.recurring_expenses alter column start_date set not null;

alter table public.recurring_expenses drop constraint recurring_expenses_kind_check;
alter table public.recurring_expenses add constraint recurring_expenses_kind_check check (
  (direction = 'expense' and kind in ('subscription', 'debt', 'other'))
  or (direction = 'income' and kind in ('salary', 'investment', 'other_income'))
);
alter table public.recurring_expenses add constraint recurring_expenses_end_after_start
  check (end_date is null or end_date >= start_date);

-- More default categories (debts for studies, pets, investment income). New users get them from the
-- trigger; existing users get them here unless they already have one with the same name.
insert into private.default_categories (name, icon, color) values
  ('Estudios', 'graduation-cap', null),
  ('Mascotas', 'paw-print', null),
  ('Inversiones', 'trending-up', null)
on conflict (name) do nothing;

insert into public.categories (user_id, name, icon, color)
select u.id, d.name, d.icon, d.color
from auth.users u
cross join private.default_categories d
where d.name in ('Estudios', 'Mascotas', 'Inversiones')
  and not exists (select 1 from public.categories c where c.user_id = u.id and c.name = d.name);
