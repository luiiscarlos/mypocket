-- Messages from the public contact form. Written only by the API with the secret key
-- (service_role bypasses RLS); no client role can read or write them. Read them in the dashboard.
create table public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null check (length(trim(name)) between 1 and 100),
  email text not null check (length(email) between 3 and 254),
  topic text not null check (topic in ('support', 'bank', 'billing', 'other')),
  message text not null check (length(trim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
