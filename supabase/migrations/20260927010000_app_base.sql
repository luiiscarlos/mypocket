-- Fase 1/2/2b/2c: profile data + preferences, manual accounts, recurring expenses,
-- investments (shared instrument catalog), simulations and in-app release notes.

-- profiles: personal data, plan, preferences, onboarding ------------------------

alter table public.profiles
  add column full_name text check (full_name is null or length(trim(full_name)) between 1 and 100),
  add column phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{6,20}$'),
  add column address_line text check (address_line is null or length(trim(address_line)) between 1 and 200),
  add column postal_code text check (postal_code is null or length(trim(postal_code)) between 1 and 20),
  add column city text check (city is null or length(trim(city)) between 1 and 100),
  add column country text check (country is null or country ~ '^[A-Z]{2}$'),
  add column birth_date date check (birth_date is null or birth_date > '1900-01-01'),
  -- Chosen plan (no payments yet). Changed only by the API, which enforces the free-plan limits.
  add column plan text not null default 'free' check (plan in ('free', 'pro')),
  add column theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  add column locale text not null default 'es' check (locale in ('es', 'en')),
  add column notifications_enabled boolean not null default true,
  add column onboarding_completed_at timestamptz;

grant update (full_name, phone, address_line, postal_code, city, country, birth_date,
              theme, locale, notifications_enabled, onboarding_completed_at)
  on public.profiles to authenticated;

-- accounts: manual today, bank-connected in Fase 3 ------------------------------

create table public.accounts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  institution text check (institution is null or length(trim(institution)) between 1 and 60),
  kind text not null check (kind in ('checking', 'savings', 'cash')),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  balance numeric(14, 2) not null default 0,
  balance_updated_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual', 'bank')),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.transactions
  add column account_id bigint references public.accounts (id) on delete set null;
create index transactions_account_id_idx on public.transactions (account_id);

-- recurring expenses: subscriptions and debts ------------------------------------

create table public.recurring_expenses (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 60),
  kind text not null check (kind in ('subscription', 'debt', 'other')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  interval_unit text not null default 'month' check (interval_unit in ('week', 'month', 'year')),
  interval_count int not null default 1 check (interval_count between 1 and 36),
  next_charge_date date not null,
  outstanding_amount numeric(14, 2) check (outstanding_amount is null or outstanding_amount >= 0),
  category_id bigint references public.categories (id) on delete set null,
  account_id bigint references public.accounts (id) on delete set null,
  -- 'suggested' is reserved for the bank-based detector (Fase 3).
  status text not null default 'active' check (status in ('suggested', 'active', 'paused', 'cancelled')),
  created_at timestamptz not null default now()
);

create index recurring_expenses_user_id_next_charge_idx on public.recurring_expenses (user_id, next_charge_date);
create index recurring_expenses_category_id_idx on public.recurring_expenses (category_id);
create index recurring_expenses_account_id_idx on public.recurring_expenses (account_id);

-- investments ---------------------------------------------------------------------

-- Shared, cached catalog (one row per real-world instrument). Readable by users, written only by the API.
create table public.instruments (
  id bigint generated always as identity primary key,
  isin text unique check (isin is null or isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  symbol text not null check (length(symbol) between 1 and 30),
  name text not null check (length(name) between 1 and 200),
  kind text not null check (kind in ('etf', 'stock', 'fund', 'crypto', 'other')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  exchange text,
  provider text not null check (provider in ('twelvedata', 'coingecko')),
  provider_id text not null,
  last_price numeric(20, 8) check (last_price is null or last_price >= 0),
  price_updated_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_id)
);

create table public.investments (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  instrument_id bigint not null references public.instruments (id) on delete restrict,
  quantity numeric(20, 8) not null check (quantity > 0),
  cost_basis numeric(14, 2) check (cost_basis is null or cost_basis >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, instrument_id)
);

create index investments_instrument_id_idx on public.investments (instrument_id);

-- simulations -----------------------------------------------------------------------

create table public.simulations (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  kind text not null check (kind in ('mortgage', 'loan', 'monthly_investment', 'inflation', 'car', 'retirement')),
  -- Validated with Zod in the API; the size cap stops abuse.
  params jsonb not null check (jsonb_typeof(params) = 'object' and pg_column_size(params) < 8192),
  created_at timestamptz not null default now()
);

create index simulations_user_id_idx on public.simulations (user_id);

-- release notes shown in-app ----------------------------------------------------------

create table public.app_updates (
  id bigint generated always as identity primary key,
  version text not null unique,
  published_at date not null default current_date,
  title_es text not null,
  body_es text not null,
  title_en text not null,
  body_en text not null
);

-- RLS -------------------------------------------------------------------------------

alter table public.accounts enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.instruments enable row level security;
alter table public.investments enable row level security;
alter table public.simulations enable row level security;
alter table public.app_updates enable row level security;

revoke all on public.accounts, public.recurring_expenses, public.instruments,
              public.investments, public.simulations, public.app_updates from anon, authenticated;
grant select, insert, update, delete on public.accounts, public.recurring_expenses,
              public.investments, public.simulations to authenticated;
grant select on public.instruments, public.app_updates to authenticated;

create policy "instruments: read all" on public.instruments for select to authenticated using (true);
create policy "app_updates: read all" on public.app_updates for select to authenticated using (true);

-- Owner-only CRUD + read-only block, same shape on every per-user table.
do $$
declare t text;
begin
  foreach t in array array['accounts', 'recurring_expenses', 'investments', 'simulations'] loop
    execute format('create policy "%1$s: read own" on public.%1$I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s: delete own" on public.%1$I for delete to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "read-only: no insert" on public.%1$I as restrictive for insert to authenticated with check (not (select private.is_read_only()))', t);
    execute format('create policy "read-only: no update" on public.%1$I as restrictive for update to authenticated using (not (select private.is_read_only()))', t);
    execute format('create policy "read-only: no delete" on public.%1$I as restrictive for delete to authenticated using (not (select private.is_read_only()))', t);
  end loop;
end $$;

-- Tables without foreign keys to other user rows.
create policy "accounts: insert own" on public.accounts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "accounts: update own" on public.accounts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "investments: insert own" on public.investments for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "investments: update own" on public.investments for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "simulations: insert own" on public.simulations for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "simulations: update own" on public.simulations for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Rows that point to a category or account must point to the user's own.
create policy "recurring_expenses: insert own" on public.recurring_expenses for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())))
    and (account_id is null or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );
create policy "recurring_expenses: update own" on public.recurring_expenses for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())))
    and (account_id is null or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );

drop policy "transactions: insert own" on public.transactions;
create policy "transactions: insert own" on public.transactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())))
    and (account_id is null or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );
drop policy "transactions: update own" on public.transactions;
create policy "transactions: update own" on public.transactions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = (select auth.uid())))
    and (account_id is null or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid())))
  );

-- First release note.
insert into public.app_updates (version, published_at, title_es, body_es, title_en, body_en) values (
  '0.1.0', '2026-09-27',
  'Primera versión de mypocket',
  'Ya puedes crear tu cuenta, añadir tus cuentas y tu efectivo, tus inversiones y tus gastos fijos, y ver todo tu dinero en un solo sitio. También hay modo oscuro y la app está en español e inglés.',
  'First mypocket release',
  'You can now create your account, add your bank accounts and cash, your investments and your recurring expenses, and see all your money in one place. Dark mode is here too, and the app is available in Spanish and English.'
);
