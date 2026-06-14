begin;

create table if not exists public.premium_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'groups',
  created_at timestamptz not null default now()
);

alter table public.premium_waitlist enable row level security;

drop policy if exists "Waitlist: anyone insert" on public.premium_waitlist;
drop policy if exists "Waitlist: insert own" on public.premium_waitlist;
drop policy if exists premium_waitlist_insert_own on public.premium_waitlist;
drop policy if exists "Waitlist: select own" on public.premium_waitlist;
drop policy if exists premium_waitlist_select_own on public.premium_waitlist;

create policy premium_waitlist_insert_own
on public.premium_waitlist for insert to authenticated
with check (
  auth.uid() = user_id
  and char_length(email) <= 320
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

create policy premium_waitlist_select_own
on public.premium_waitlist for select to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';

commit;
