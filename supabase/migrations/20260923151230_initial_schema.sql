-- categories: user_id null = default category shared by everyone (read-only)
create table public.categories (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  icon text,
  color text,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, name)
);

create table public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  category_id bigint references public.categories (id) on delete set null,
  occurred_on date not null default current_date,
  note text,
  source text not null default 'manual' check (source in ('manual', 'ocr', 'bank')),
  created_at timestamptz not null default now()
);

create index transactions_user_id_occurred_on_idx on public.transactions (user_id, occurred_on desc);
create index transactions_category_id_idx on public.transactions (category_id);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;

revoke all on public.categories, public.transactions from anon;
grant select, insert, update, delete on public.categories, public.transactions to authenticated;

create policy "categories: read own and defaults" on public.categories
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "categories: insert own" on public.categories
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "categories: update own" on public.categories
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories: delete own" on public.categories
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions: read own" on public.transactions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "transactions: insert own" on public.transactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and (c.user_id is null or c.user_id = (select auth.uid()))
    ))
  );

create policy "transactions: update own" on public.transactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (category_id is null or exists (
      select 1 from public.categories c
      where c.id = category_id and (c.user_id is null or c.user_id = (select auth.uid()))
    ))
  );

create policy "transactions: delete own" on public.transactions
  for delete to authenticated
  using (user_id = (select auth.uid()));

insert into public.categories (name, icon, color) values
  ('Alimentación', 'shopping-cart', '#16a34a'),
  ('Transporte', 'car', '#2563eb'),
  ('Vivienda', 'home', '#9333ea'),
  ('Ocio', 'party-popper', '#db2777'),
  ('Salud', 'heart-pulse', '#dc2626'),
  ('Suscripciones', 'repeat', '#ea580c'),
  ('Nómina', 'wallet', '#0d9488'),
  ('Otros', 'circle-ellipsis', '#64748b');
