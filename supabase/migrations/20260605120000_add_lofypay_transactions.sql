create table if not exists public.lofypay_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_reference text not null,
  plan_id text not null,
  amount numeric not null,
  status text not null default 'WAITING',
  id_transaction text not null,
  payment_code text not null,
  payment_code_base64 text not null,
  paid_at timestamptz,
  notification_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lofypay_transactions_external_reference_unique unique (external_reference),
  constraint lofypay_transactions_id_transaction_unique unique (id_transaction)
);

alter table public.lofypay_transactions enable row level security;

grant select, insert, update on public.lofypay_transactions to authenticated;
grant all on public.lofypay_transactions to service_role;

create policy lofypay_transactions_select_own
  on public.lofypay_transactions for select to authenticated
  using (auth.uid() = user_id);

create policy lofypay_transactions_insert_own
  on public.lofypay_transactions for insert to authenticated
  with check (auth.uid() = user_id);

create policy lofypay_transactions_update_own
  on public.lofypay_transactions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists lofypay_transactions_user_id_idx
  on public.lofypay_transactions (user_id);

notify pgrst, 'reload schema';
