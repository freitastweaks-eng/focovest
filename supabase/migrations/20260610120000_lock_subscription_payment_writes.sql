-- Payment and subscription rows are server-owned.
-- Authenticated clients may read their own records, but only the service role
-- may create or mutate transactions and active subscriptions after payment.

revoke insert, update on public.lofypay_transactions from authenticated;
revoke insert, update on public.user_subscriptions from authenticated;

drop policy if exists lofypay_transactions_insert_own on public.lofypay_transactions;
drop policy if exists lofypay_transactions_update_own on public.lofypay_transactions;
drop policy if exists user_subscriptions_insert_own on public.user_subscriptions;
drop policy if exists user_subscriptions_update_own on public.user_subscriptions;

grant select on public.lofypay_transactions to authenticated;
grant select on public.user_subscriptions to authenticated;
grant all on public.lofypay_transactions to service_role;
grant all on public.user_subscriptions to service_role;

notify pgrst, 'reload schema';
