-- Fase B1: profiles, per-user default categories, read-only accounts, monthly summary.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- profiles --------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or length(trim(display_name)) between 1 and 50),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  -- 'real' = the owner (real bank access allowed); 'demo' = everyone else. Only settable via SQL.
  account_type text not null default 'demo' check (account_type in ('real', 'demo')),
  -- Public portfolio account: can read, cannot write anything. Only settable via SQL.
  read_only boolean not null default false,
  created_at timestamptz not null default now()
);

-- At most one owner, enforced by the database.
create unique index profiles_single_owner_idx on public.profiles ((true)) where account_type = 'real';

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, currency) on public.profiles to authenticated;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- default categories become per-user copies -----------------------------------

create table private.default_categories (
  name text primary key,
  icon text,
  color text
);

insert into private.default_categories (name, icon, color)
select name, icon, color from public.categories where user_id is null;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.categories (user_id, name, icon, color)
  select new.id, d.name, d.icon, d.color from private.default_categories d;
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Backfill existing users, then move their transactions off the shared defaults.
insert into public.profiles (id) select id from auth.users on conflict do nothing;

insert into public.categories (user_id, name, icon, color)
select u.id, d.name, d.icon, d.color
from auth.users u cross join private.default_categories d
on conflict do nothing;

update public.transactions t
set category_id = mine.id
from public.categories shared, public.categories mine
where t.category_id = shared.id
  and shared.user_id is null
  and mine.user_id = t.user_id
  and mine.name = shared.name;

delete from public.categories where user_id is null;

alter table public.categories alter column user_id set not null;
alter table public.categories alter column user_id set default auth.uid();

drop policy "categories: read own and defaults" on public.categories;
create policy "categories: read own" on public.categories
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy "transactions: insert own" on public.transactions;
create policy "transactions: insert own" on public.transactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );

drop policy "transactions: update own" on public.transactions;
create policy "transactions: update own" on public.transactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = (select auth.uid())
    ))
  );

-- read-only accounts ------------------------------------------------------------

create function private.is_read_only()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select p.read_only from public.profiles p where p.id = (select auth.uid())), false);
$$;

revoke execute on function private.is_read_only() from public, anon;
grant execute on function private.is_read_only() to authenticated;

-- Restrictive policies are ANDed with the permissive ones above.
create policy "read-only: no insert" on public.categories as restrictive
  for insert to authenticated with check (not (select private.is_read_only()));
create policy "read-only: no update" on public.categories as restrictive
  for update to authenticated using (not (select private.is_read_only()));
create policy "read-only: no delete" on public.categories as restrictive
  for delete to authenticated using (not (select private.is_read_only()));

create policy "read-only: no insert" on public.transactions as restrictive
  for insert to authenticated with check (not (select private.is_read_only()));
create policy "read-only: no update" on public.transactions as restrictive
  for update to authenticated using (not (select private.is_read_only()));
create policy "read-only: no delete" on public.transactions as restrictive
  for delete to authenticated using (not (select private.is_read_only()));

create policy "read-only: no update" on public.profiles as restrictive
  for update to authenticated using (not (select private.is_read_only()));

-- monthly summary ---------------------------------------------------------------

create function public.monthly_summary(p_month date)
returns table (category_id bigint, category_name text, type text, currency text, total numeric, tx_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t.category_id, c.name, t.type, t.currency, sum(t.amount), count(*)
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = (select auth.uid())
    and t.occurred_on >= date_trunc('month', p_month)::date
    and t.occurred_on < (date_trunc('month', p_month) + interval '1 month')::date
  group by t.category_id, c.name, t.type, t.currency;
$$;

revoke execute on function public.monthly_summary(date) from public, anon;
grant execute on function public.monthly_summary(date) to authenticated;
