-- Foco Vest database bootstrap
-- Run on a fresh Supabase project or after intentionally resetting the app schema.
-- This script rebuilds the public app schema, RLS policies, storage buckets, and RPCs.

begin;

-- Extensions
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Clean previous app objects
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

drop policy if exists "Community files: public read" on storage.objects;
drop policy if exists "Community files: authenticated read" on storage.objects;
drop policy if exists "Community files: user upload own folder" on storage.objects;
drop policy if exists "Community files: user update own" on storage.objects;
drop policy if exists "Community files: user delete own" on storage.objects;
drop policy if exists community_files_authenticated_read on storage.objects;
drop policy if exists community_files_upload_own_folder on storage.objects;
drop policy if exists community_files_update_own_folder on storage.objects;
drop policy if exists community_files_delete_own_folder on storage.objects;

drop policy if exists "Group files: member read" on storage.objects;
drop policy if exists "Group files: member upload own folder" on storage.objects;
drop policy if exists "Group files: user update own" on storage.objects;
drop policy if exists "Group files: user delete own" on storage.objects;
drop policy if exists group_files_member_read on storage.objects;
drop policy if exists group_files_member_upload_own_folder on storage.objects;
drop policy if exists group_files_update_own_folder on storage.objects;
drop policy if exists group_files_delete_own_folder on storage.objects;

drop table if exists public.quick_review_results cascade;
drop table if exists public.topic_progress cascade;
drop table if exists public.user_subscriptions cascade;
drop table if exists public.lofypay_transactions cascade;
drop table if exists public.flashcard_reviews cascade;
drop table if exists public.flashcards cascade;
drop table if exists public.flashcard_decks cascade;
drop table if exists public.simulado_results cascade;
drop table if exists public.simulado_questions cascade;
drop table if exists public.simulados cascade;
drop table if exists public.premium_waitlist cascade;
drop table if exists public.study_group_events cascade;
drop table if exists public.study_group_materials cascade;
drop table if exists public.study_group_posts cascade;
drop table if exists public.study_group_members cascade;
drop table if exists public.study_groups cascade;
drop table if exists public.community_likes cascade;
drop table if exists public.community_comments cascade;
drop table if exists public.community_posts cascade;
drop table if exists public.calendar_events cascade;
drop table if exists public.repertoire_favorites cascade;
drop table if exists public.content_favorites cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.profiles cascade;

drop function if exists public.get_simulado_percentile(uuid, numeric);
drop function if exists public.get_simulado_aggregate(uuid);
drop function if exists public.storage_folder_uuid(text, integer);
drop function if exists public.is_group_owner(uuid, uuid);
drop function if exists public.is_group_member(uuid, uuid);
drop function if exists public.handle_new_user();
drop function if exists public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.tg_set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Users and personal study data
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar text not null default 'target',
  vestibular text not null default 'ENEM',
  target_score integer not null default 850 check (target_score between 0 and 1000),
  study_styles text[] not null default '{}'::text[],
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.tg_set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1),
      ''
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar', 'target')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now()
);

alter table public.study_sessions enable row level security;

create policy study_sessions_select_own
on public.study_sessions for select to authenticated
using (auth.uid() = user_id);

create policy study_sessions_insert_own
on public.study_sessions for insert to authenticated
with check (auth.uid() = user_id);

create policy study_sessions_delete_own
on public.study_sessions for delete to authenticated
using (auth.uid() = user_id);

create index study_sessions_user_created_idx
on public.study_sessions (user_id, created_at desc);

create table public.content_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.content_favorites enable row level security;

create policy content_favorites_select_own
on public.content_favorites for select to authenticated
using (auth.uid() = user_id);

create policy content_favorites_insert_own
on public.content_favorites for insert to authenticated
with check (auth.uid() = user_id);

create policy content_favorites_delete_own
on public.content_favorites for delete to authenticated
using (auth.uid() = user_id);

create table public.repertoire_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  repertoire_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, repertoire_id)
);

alter table public.repertoire_favorites enable row level security;

create policy repertoire_favorites_select_own
on public.repertoire_favorites for select to authenticated
using (auth.uid() = user_id);

create policy repertoire_favorites_insert_own
on public.repertoire_favorites for insert to authenticated
with check (auth.uid() = user_id);

create policy repertoire_favorites_delete_own
on public.repertoire_favorites for delete to authenticated
using (auth.uid() = user_id);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject text,
  event_type text not null default 'study',
  color text not null default '#B8FF4F',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_events_valid_range check (ends_at >= starts_at)
);

alter table public.calendar_events enable row level security;

create policy calendar_events_select_own
on public.calendar_events for select to authenticated
using (auth.uid() = user_id);

create policy calendar_events_insert_own
on public.calendar_events for insert to authenticated
with check (auth.uid() = user_id);

create policy calendar_events_update_own
on public.calendar_events for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy calendar_events_delete_own
on public.calendar_events for delete to authenticated
using (auth.uid() = user_id);

create index calendar_events_user_starts_idx
on public.calendar_events (user_id, starts_at);

create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default 'target',
  title text not null check (char_length(title) <= 140),
  content text not null check (char_length(content) <= 4000),
  category text not null default 'discussao',
  subject text,
  attachment_url text,
  attachment_type text,
  attachment_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_attachment_path_scope check (
    attachment_url is null
    or (
      attachment_url !~* '^https?://'
      and split_part(attachment_url, '/', 1) = user_id::text
    )
  )
);

alter table public.community_posts enable row level security;

create policy community_posts_select_authenticated
on public.community_posts for select to authenticated
using (true);

create policy community_posts_insert_own
on public.community_posts for insert to authenticated
with check (auth.uid() = user_id);

create policy community_posts_update_own
on public.community_posts for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy community_posts_delete_own
on public.community_posts for delete to authenticated
using (auth.uid() = user_id);

create index community_posts_created_idx on public.community_posts (created_at desc);
create index community_posts_category_idx on public.community_posts (category);

create trigger community_posts_set_updated_at
before update on public.community_posts
for each row execute function public.tg_set_updated_at();

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default 'target',
  content text not null check (char_length(content) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.community_comments enable row level security;

create policy community_comments_select_authenticated
on public.community_comments for select to authenticated
using (true);

create policy community_comments_insert_own
on public.community_comments for insert to authenticated
with check (auth.uid() = user_id);

create policy community_comments_update_own
on public.community_comments for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy community_comments_delete_own
on public.community_comments for delete to authenticated
using (auth.uid() = user_id);

create index community_comments_post_created_idx
on public.community_comments (post_id, created_at);

create table public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.community_likes enable row level security;

create policy community_likes_select_authenticated
on public.community_likes for select to authenticated
using (true);

create policy community_likes_insert_own
on public.community_likes for insert to authenticated
with check (auth.uid() = user_id);

create policy community_likes_delete_own
on public.community_likes for delete to authenticated
using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Study groups
-- ---------------------------------------------------------------------------

create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  subject text,
  emoji text not null default 'book',
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_groups enable row level security;

create table public.study_group_invites (
  group_id uuid primary key references public.study_groups(id) on delete cascade,
  invite_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

alter table public.study_group_invites enable row level security;

create table public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null default '',
  avatar text not null default 'target',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.study_group_members enable row level security;

create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    _user_id = auth.uid()
    and exists (
      select 1
      from public.study_group_members
      where group_id = _group_id and user_id = _user_id
    );
$$;

create or replace function public.is_group_owner(_group_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    _user_id = auth.uid()
    and exists (
      select 1
      from public.study_groups
      where id = _group_id and owner_id = _user_id
    );
$$;

revoke execute on function public.is_group_member(uuid, uuid) from public, anon;
revoke execute on function public.is_group_owner(uuid, uuid) from public, anon;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_owner(uuid, uuid) to authenticated;

create policy study_groups_select_available
on public.study_groups for select to authenticated
using (
  visibility = 'public'
  or owner_id = auth.uid()
  or public.is_group_member(id, auth.uid())
);

create policy study_groups_update_owner
on public.study_groups for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy study_groups_delete_owner
on public.study_groups for delete to authenticated
using (auth.uid() = owner_id);

create trigger study_groups_set_updated_at
before update on public.study_groups
for each row execute function public.tg_set_updated_at();

create policy study_group_members_select_group_members
on public.study_group_members for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy study_group_members_leave_self_or_owner
on public.study_group_members for delete to authenticated
using (auth.uid() = user_id or public.is_group_owner(group_id, auth.uid()));

create index study_group_members_user_idx on public.study_group_members (user_id);

create or replace function public.create_study_group(
  _name text,
  _description text default null,
  _subject text default null,
  _emoji text default 'book',
  _visibility text default 'public'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _group_id uuid;
  _display_name text;
  _avatar text;
begin
  if _user_id is null then raise exception 'Authentication required'; end if;
  if nullif(trim(_name), '') is null or char_length(trim(_name)) > 80 then
    raise exception 'Group name must contain between 1 and 80 characters';
  end if;
  if _visibility not in ('public', 'private') then raise exception 'Invalid group visibility'; end if;

  select display_name, avatar into _display_name, _avatar
  from public.profiles where id = _user_id;

  insert into public.study_groups (owner_id, name, description, subject, emoji, visibility)
  values (_user_id, trim(_name), nullif(trim(_description), ''), nullif(trim(_subject), ''),
    coalesce(nullif(trim(_emoji), ''), 'book'), _visibility)
  returning id into _group_id;

  insert into public.study_group_members (group_id, user_id, role, display_name, avatar)
  values (_group_id, _user_id, 'owner', coalesce(_display_name, ''), coalesce(_avatar, 'target'));
  if _visibility = 'private' then
    insert into public.study_group_invites (group_id) values (_group_id);
  end if;
  return _group_id;
end;
$$;

create or replace function public.join_public_study_group(_group_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _user_id uuid := auth.uid();
  _display_name text;
  _avatar text;
begin
  if _user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.study_groups where id = _group_id and visibility = 'public') then
    raise exception 'Public group not found';
  end if;
  select display_name, avatar into _display_name, _avatar from public.profiles where id = _user_id;
  insert into public.study_group_members (group_id, user_id, display_name, avatar)
  values (_group_id, _user_id, coalesce(_display_name, ''), coalesce(_avatar, 'target'))
  on conflict (group_id, user_id) do nothing;
  return _group_id;
end;
$$;

create or replace function public.join_study_group_by_invite(_invite_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _user_id uuid := auth.uid();
  _group_id uuid;
  _display_name text;
  _avatar text;
begin
  if _user_id is null then raise exception 'Authentication required'; end if;
  select g.id into _group_id from public.study_groups g
  join public.study_group_invites i on i.group_id = g.id
  where i.invite_token = _invite_token and g.visibility = 'private';
  if _group_id is null then raise exception 'Invalid or expired invite'; end if;
  select display_name, avatar into _display_name, _avatar from public.profiles where id = _user_id;
  insert into public.study_group_members (group_id, user_id, display_name, avatar)
  values (_group_id, _user_id, coalesce(_display_name, ''), coalesce(_avatar, 'target'))
  on conflict (group_id, user_id) do nothing;
  return _group_id;
end;
$$;

create or replace function public.get_study_group_invite_token(_group_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select i.invite_token from public.study_group_invites i
  join public.study_groups g on g.id = i.group_id
  where g.id = _group_id and g.owner_id = auth.uid() and g.visibility = 'private';
$$;

revoke execute on function public.create_study_group(text, text, text, text, text) from public, anon;
revoke execute on function public.join_public_study_group(uuid) from public, anon;
revoke execute on function public.join_study_group_by_invite(text) from public, anon;
revoke execute on function public.get_study_group_invite_token(uuid) from public, anon;
grant execute on function public.create_study_group(text, text, text, text, text) to authenticated;
grant execute on function public.join_public_study_group(uuid) to authenticated;
grant execute on function public.join_study_group_by_invite(text) to authenticated;
grant execute on function public.get_study_group_invite_token(uuid) to authenticated;

create table public.study_group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default 'target',
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.study_group_posts enable row level security;

create policy study_group_posts_select_members
on public.study_group_posts for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy study_group_posts_insert_members
on public.study_group_posts for insert to authenticated
with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

create policy study_group_posts_delete_own
on public.study_group_posts for delete to authenticated
using (auth.uid() = user_id);

create index study_group_posts_group_created_idx
on public.study_group_posts (group_id, created_at desc);

create table public.study_group_materials (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz not null default now(),
  constraint study_group_materials_file_path_scope check (
    file_url is null
    or (
      file_url !~* '^https?://'
      and split_part(file_url, '/', 1) = group_id::text
      and split_part(file_url, '/', 2) = user_id::text
    )
  )
);

alter table public.study_group_materials enable row level security;

create policy study_group_materials_select_members
on public.study_group_materials for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy study_group_materials_insert_members
on public.study_group_materials for insert to authenticated
with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

create policy study_group_materials_delete_own
on public.study_group_materials for delete to authenticated
using (auth.uid() = user_id);

create index study_group_materials_group_created_idx
on public.study_group_materials (group_id, created_at desc);

create table public.study_group_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint study_group_events_valid_range check (ends_at >= starts_at)
);

alter table public.study_group_events enable row level security;

create policy study_group_events_select_members
on public.study_group_events for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy study_group_events_insert_members
on public.study_group_events for insert to authenticated
with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

create policy study_group_events_delete_own
on public.study_group_events for delete to authenticated
using (auth.uid() = user_id);

create index study_group_events_group_starts_idx
on public.study_group_events (group_id, starts_at);

create table public.premium_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  source text not null default 'groups',
  created_at timestamptz not null default now()
);

alter table public.premium_waitlist enable row level security;

create policy premium_waitlist_insert_own
on public.premium_waitlist for insert to authenticated
with check (
  auth.uid() = user_id
  and email is not null
  and char_length(email) <= 320
  and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

create policy premium_waitlist_select_own
on public.premium_waitlist for select to authenticated
using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Simulados and review
-- ---------------------------------------------------------------------------

create table public.simulados (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  vestibular text not null,
  subject text,
  total_questions integer not null check (total_questions > 0),
  time_limit_minutes integer not null check (time_limit_minutes > 0),
  difficulty text not null default 'Medio',
  created_at timestamptz not null default now()
);

alter table public.simulados enable row level security;

create policy simulados_select_authenticated
on public.simulados for select to authenticated
using (true);

grant select on public.simulados to authenticated;
grant all on public.simulados to service_role;

create table public.simulado_questions (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  question_number integer not null check (question_number > 0),
  subject text,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  option_e text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D', 'E')),
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (simulado_id, question_number)
);

alter table public.simulado_questions enable row level security;

create policy simulado_questions_select_authenticated
on public.simulado_questions for select to authenticated
using (true);

grant select on public.simulado_questions to authenticated;
grant all on public.simulado_questions to service_role;

create index simulado_questions_simulado_number_idx
on public.simulado_questions (simulado_id, question_number);

create table public.simulado_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulado_id uuid not null references public.simulados(id) on delete cascade,
  score integer not null check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  percentage numeric not null check (percentage between 0 and 100),
  time_spent_minutes integer check (time_spent_minutes is null or time_spent_minutes >= 0),
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

alter table public.simulado_results enable row level security;

create policy simulado_results_select_own
on public.simulado_results for select to authenticated
using (auth.uid() = user_id);

create policy simulado_results_insert_own
on public.simulado_results for insert to authenticated
with check (auth.uid() = user_id);

create policy simulado_results_update_own
on public.simulado_results for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy simulado_results_delete_own
on public.simulado_results for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.simulado_results to authenticated;
grant all on public.simulado_results to service_role;

create index simulado_results_user_completed_idx
on public.simulado_results (user_id, completed_at desc);

create index simulado_results_simulado_percentage_idx
on public.simulado_results (simulado_id, percentage);

create table public.quick_review_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  score integer not null check (score >= 0),
  total integer not null default 10 check (total > 0),
  time_seconds integer check (time_seconds is null or time_seconds >= 0),
  completed_at timestamptz not null default now()
);

alter table public.quick_review_results enable row level security;

create policy quick_review_results_select_own
on public.quick_review_results for select to authenticated
using (auth.uid() = user_id);

create policy quick_review_results_insert_own
on public.quick_review_results for insert to authenticated
with check (auth.uid() = user_id);

create policy quick_review_results_delete_own
on public.quick_review_results for delete to authenticated
using (auth.uid() = user_id);

create index quick_review_results_user_completed_idx
on public.quick_review_results (user_id, completed_at desc);

create or replace function public.get_simulado_aggregate(_simulado_id uuid)
returns table (
  avg_score numeric,
  avg_percentage numeric,
  total_attempts bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    avg(score)::numeric as avg_score,
    avg(percentage)::numeric as avg_percentage,
    count(*)::bigint as total_attempts
  from public.simulado_results
  where simulado_id = _simulado_id;
$$;

create or replace function public.get_simulado_percentile(
  _simulado_id uuid,
  _percentage numeric
)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    round(
      100 * count(*) filter (where percentage < _percentage)::numeric
      / nullif(count(*), 0)
    ),
    0
  )
  from public.simulado_results
  where simulado_id = _simulado_id;
$$;

revoke execute on function public.get_simulado_aggregate(uuid) from public, anon;
revoke execute on function public.get_simulado_percentile(uuid, numeric) from public, anon;
grant execute on function public.get_simulado_aggregate(uuid) to authenticated;
grant execute on function public.get_simulado_percentile(uuid, numeric) to authenticated;

-- ---------------------------------------------------------------------------
-- Flashcards
-- ---------------------------------------------------------------------------

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  subject text not null,
  emoji text not null default 'cards',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint flashcard_decks_owner_for_custom check (
    (is_default = true and user_id is null)
    or (is_default = false and user_id is not null)
  )
);

alter table public.flashcard_decks enable row level security;

create policy flashcard_decks_select_default_or_own
on public.flashcard_decks for select to authenticated
using (is_default = true or auth.uid() = user_id);

create policy flashcard_decks_insert_own
on public.flashcard_decks for insert to authenticated
with check (auth.uid() = user_id and is_default = false);

create policy flashcard_decks_update_own
on public.flashcard_decks for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and is_default = false);

create policy flashcard_decks_delete_own
on public.flashcard_decks for delete to authenticated
using (auth.uid() = user_id and is_default = false);

grant select, insert, update, delete on public.flashcard_decks to authenticated;
grant all on public.flashcard_decks to service_role;

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  created_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy flashcards_select_own_or_default_deck
on public.flashcards for select to authenticated
using (
  exists (
    select 1
    from public.flashcard_decks d
    where d.id = flashcards.deck_id
      and (d.is_default = true or d.user_id = auth.uid())
  )
);

create policy flashcards_insert_own_deck
on public.flashcards for insert to authenticated
with check (
  exists (
    select 1
    from public.flashcard_decks d
    where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
      and d.is_default = false
  )
);

create policy flashcards_update_own_deck
on public.flashcards for update to authenticated
using (
  exists (
    select 1
    from public.flashcard_decks d
    where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
      and d.is_default = false
  )
)
with check (
  exists (
    select 1
    from public.flashcard_decks d
    where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
      and d.is_default = false
  )
);

create policy flashcards_delete_own_deck
on public.flashcards for delete to authenticated
using (
  exists (
    select 1
    from public.flashcard_decks d
    where d.id = flashcards.deck_id
      and d.user_id = auth.uid()
      and d.is_default = false
  )
);

grant select, insert, update, delete on public.flashcards to authenticated;
grant all on public.flashcards to service_role;

create index flashcards_deck_idx on public.flashcards (deck_id);

create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  rating text not null check (rating in ('forgotten', 'hard', 'good', 'easy')),
  next_review_date date not null,
  review_count integer not null default 1 check (review_count > 0),
  reviewed_at timestamptz not null default now(),
  unique (user_id, flashcard_id)
);

alter table public.flashcard_reviews enable row level security;

create policy flashcard_reviews_select_own
on public.flashcard_reviews for select to authenticated
using (auth.uid() = user_id);

create policy flashcard_reviews_insert_own
on public.flashcard_reviews for insert to authenticated
with check (auth.uid() = user_id);

create policy flashcard_reviews_update_own
on public.flashcard_reviews for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy flashcard_reviews_delete_own
on public.flashcard_reviews for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.flashcard_reviews to authenticated;
grant all on public.flashcard_reviews to service_role;

create index flashcard_reviews_user_due_idx
on public.flashcard_reviews (user_id, next_review_date);

create table public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  topic_key text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, subject, topic_key)
);

alter table public.topic_progress enable row level security;

create policy topic_progress_select_own
on public.topic_progress for select to authenticated
using (auth.uid() = user_id);

create policy topic_progress_insert_own
on public.topic_progress for insert to authenticated
with check (auth.uid() = user_id);

create policy topic_progress_update_own
on public.topic_progress for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy topic_progress_delete_own
on public.topic_progress for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.topic_progress to authenticated;
grant all on public.topic_progress to service_role;

-- ---------------------------------------------------------------------------
-- Billing
-- ---------------------------------------------------------------------------

create table public.lofypay_transactions (
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

create policy lofypay_transactions_select_own
on public.lofypay_transactions for select to authenticated
using (auth.uid() = user_id);

grant select on public.lofypay_transactions to authenticated;
grant all on public.lofypay_transactions to service_role;

create index lofypay_transactions_user_id_idx
on public.lofypay_transactions (user_id);

create table public.user_subscriptions (
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

alter table public.user_subscriptions enable row level security;

create policy user_subscriptions_select_own
on public.user_subscriptions for select to authenticated
using (auth.uid() = user_id);

grant select on public.user_subscriptions to authenticated;
grant all on public.user_subscriptions to service_role;

create index user_subscriptions_user_expires_idx
on public.user_subscriptions (user_id, expires_at desc);

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'community-files',
    'community-files',
    false,
    10485760,
    array['application/pdf', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'group-files',
    'group-files',
    false,
    10485760,
    array['application/pdf', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.storage_folder_uuid(_name text, _index integer)
returns uuid
language plpgsql
stable
security definer
set search_path = public, storage
as $$
declare
  _value text;
begin
  _value := (storage.foldername(_name))[_index];
  return _value::uuid;
exception when others then
  return null;
end;
$$;

revoke execute on function public.storage_folder_uuid(text, integer) from public, anon;
grant execute on function public.storage_folder_uuid(text, integer) to authenticated;

create policy community_files_authenticated_read
on storage.objects for select to authenticated
using (bucket_id = 'community-files');

create policy community_files_upload_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id = 'community-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy community_files_update_own_folder
on storage.objects for update to authenticated
using (
  bucket_id = 'community-files'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'community-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy community_files_delete_own_folder
on storage.objects for delete to authenticated
using (
  bucket_id = 'community-files'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy group_files_member_read
on storage.objects for select to authenticated
using (
  bucket_id = 'group-files'
  and public.is_group_member(public.storage_folder_uuid(name, 1), auth.uid())
);

create policy group_files_member_upload_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id = 'group-files'
  and public.storage_folder_uuid(name, 2) = auth.uid()
  and public.is_group_member(public.storage_folder_uuid(name, 1), auth.uid())
);

create policy group_files_update_own_folder
on storage.objects for update to authenticated
using (
  bucket_id = 'group-files'
  and public.storage_folder_uuid(name, 2) = auth.uid()
)
with check (
  bucket_id = 'group-files'
  and public.storage_folder_uuid(name, 2) = auth.uid()
  and public.is_group_member(public.storage_folder_uuid(name, 1), auth.uid())
);

create policy group_files_delete_own_folder
on storage.objects for delete to authenticated
using (
  bucket_id = 'group-files'
  and public.storage_folder_uuid(name, 2) = auth.uid()
);

notify pgrst, 'reload schema';

commit;
