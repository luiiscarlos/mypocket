-- Admin role and support tickets.
-- is_admin is readable by the user but never writable from the client (no column grant): it is set
-- here or by hand in the SQL editor. Admins read and answer every ticket through the API, which checks
-- is_admin and then uses the secret key; RLS only ever lets a user see and create their own tickets.

alter table public.profiles add column is_admin boolean not null default false;

create table public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject text not null check (length(trim(subject)) between 3 and 120),
  category text not null default 'other' check (category in ('bug', 'account', 'bank', 'billing', 'idea', 'other')),
  message text not null check (length(trim(message)) between 10 and 5000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply text check (admin_reply is null or length(admin_reply) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_user_id_created_idx on public.support_tickets (user_id, created_at desc);
create index support_tickets_status_created_idx on public.support_tickets (status, created_at desc);

alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from anon, authenticated;
grant select, insert (subject, category, message) on public.support_tickets to authenticated;

create policy "support_tickets: select own" on public.support_tickets for select to authenticated
  using (user_id = (select auth.uid()));
create policy "support_tickets: insert own" on public.support_tickets for insert to authenticated
  with check (user_id = (select auth.uid()));
-- The read-only demo account can't open tickets.
create policy "support_tickets: read_only" on public.support_tickets as restrictive for insert to authenticated
  with check (not private.is_read_only());
