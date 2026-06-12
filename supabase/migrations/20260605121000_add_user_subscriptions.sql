create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  renewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_status_check
    check (status in ('active', 'expired', 'canceled'))
);

grant select, insert, update on public.user_subscriptions to authenticated;
grant all on public.user_subscriptions to service_role;

alter table public.user_subscriptions enable row level security;

drop policy if exists user_subscriptions_select_own on public.user_subscriptions;
drop policy if exists user_subscriptions_insert_own on public.user_subscriptions;
drop policy if exists user_subscriptions_update_own on public.user_subscriptions;

create policy user_subscriptions_select_own
  on public.user_subscriptions for select to authenticated
  using (auth.uid() = user_id);

create policy user_subscriptions_insert_own
  on public.user_subscriptions for insert to authenticated
  with check (auth.uid() = user_id);

create policy user_subscriptions_update_own
  on public.user_subscriptions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_subscriptions_user_expires_idx
  on public.user_subscriptions (user_id, expires_at desc);

notify pgrst, 'reload schema';
