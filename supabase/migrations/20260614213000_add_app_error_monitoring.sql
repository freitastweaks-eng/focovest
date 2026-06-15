begin;

create table if not exists public.app_error_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  stack text,
  route text,
  user_agent text,
  request_hash text,
  release text,
  created_at timestamptz not null default now(),
  constraint app_error_events_source_length check (char_length(source) <= 40),
  constraint app_error_events_message_length check (char_length(message) <= 1000)
);

alter table public.app_error_events enable row level security;

revoke all on table public.app_error_events from anon, authenticated;

create index if not exists app_error_events_created_idx
on public.app_error_events (created_at desc);

create index if not exists app_error_events_release_idx
on public.app_error_events (release, created_at desc);

notify pgrst, 'reload schema';

commit;
