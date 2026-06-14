-- This migration is intentionally self-contained because some deployed
-- projects were initialized without the original study-groups migration.
create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  subject text,
  emoji text not null default 'book',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null default '',
  avatar text not null default 'target',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.study_group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  author_avatar text not null default 'target',
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_group_materials (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default '',
  title text not null,
  description text,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.study_group_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.study_group_posts enable row level security;
alter table public.study_group_materials enable row level security;
alter table public.study_group_events enable row level security;

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
      select 1 from public.study_group_members
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
      select 1 from public.study_groups
      where id = _group_id and owner_id = _user_id
    );
$$;

revoke execute on function public.is_group_member(uuid, uuid) from public, anon;
revoke execute on function public.is_group_owner(uuid, uuid) from public, anon;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_owner(uuid, uuid) to authenticated;

alter table public.study_groups
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private'));

create table if not exists public.study_group_invites (
  group_id uuid primary key references public.study_groups(id) on delete cascade,
  invite_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);

alter table public.study_group_invites enable row level security;

drop policy if exists study_groups_select_authenticated on public.study_groups;
drop policy if exists "Groups: select all authenticated" on public.study_groups;
create policy study_groups_select_available
on public.study_groups for select to authenticated
using (
  visibility = 'public'
  or owner_id = auth.uid()
  or public.is_group_member(id, auth.uid())
);

drop policy if exists study_groups_insert_own on public.study_groups;
drop policy if exists "Groups: insert own" on public.study_groups;

drop policy if exists study_groups_update_owner on public.study_groups;
drop policy if exists "Groups: update owner" on public.study_groups;
create policy study_groups_update_owner
on public.study_groups for update to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists study_groups_delete_owner on public.study_groups;
drop policy if exists "Groups: delete owner" on public.study_groups;
create policy study_groups_delete_owner
on public.study_groups for delete to authenticated
using (auth.uid() = owner_id);

drop policy if exists study_group_members_select_authenticated on public.study_group_members;
drop policy if exists "Members: select all authenticated" on public.study_group_members;
create policy study_group_members_select_group_members
on public.study_group_members for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists study_group_members_join_self on public.study_group_members;
drop policy if exists "Members: join self" on public.study_group_members;

drop policy if exists study_group_members_leave_self_or_owner on public.study_group_members;
drop policy if exists "Members: leave self" on public.study_group_members;
create policy study_group_members_leave_self_or_owner
on public.study_group_members for delete to authenticated
using (auth.uid() = user_id or public.is_group_owner(group_id, auth.uid()));

drop policy if exists "GPosts: select members" on public.study_group_posts;
drop policy if exists study_group_posts_select_members on public.study_group_posts;
create policy study_group_posts_select_members
on public.study_group_posts for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "GPosts: insert member" on public.study_group_posts;
drop policy if exists study_group_posts_insert_members on public.study_group_posts;
create policy study_group_posts_insert_members
on public.study_group_posts for insert to authenticated
with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

drop policy if exists "GPosts: delete own" on public.study_group_posts;
drop policy if exists study_group_posts_delete_own on public.study_group_posts;
create policy study_group_posts_delete_own
on public.study_group_posts for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "GMat: select members" on public.study_group_materials;
drop policy if exists study_group_materials_select_members on public.study_group_materials;
create policy study_group_materials_select_members
on public.study_group_materials for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "GMat: insert member" on public.study_group_materials;
drop policy if exists study_group_materials_insert_members on public.study_group_materials;
create policy study_group_materials_insert_members
on public.study_group_materials for insert to authenticated
with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

drop policy if exists "GMat: delete own" on public.study_group_materials;
drop policy if exists study_group_materials_delete_own on public.study_group_materials;
create policy study_group_materials_delete_own
on public.study_group_materials for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "GEv: select members" on public.study_group_events;
drop policy if exists study_group_events_select_members on public.study_group_events;
create policy study_group_events_select_members
on public.study_group_events for select to authenticated
using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "GEv: insert member" on public.study_group_events;
drop policy if exists study_group_events_insert_members on public.study_group_events;
create policy study_group_events_insert_members
on public.study_group_events for insert to authenticated
with check (auth.uid() = user_id and public.is_group_member(group_id, auth.uid()));

drop policy if exists "GEv: delete own" on public.study_group_events;
drop policy if exists study_group_events_delete_own on public.study_group_events;
create policy study_group_events_delete_own
on public.study_group_events for delete to authenticated
using (auth.uid() = user_id);

create index if not exists study_group_members_user_idx
on public.study_group_members (user_id);
create index if not exists study_group_posts_group_created_idx
on public.study_group_posts (group_id, created_at desc);
create index if not exists study_group_materials_group_created_idx
on public.study_group_materials (group_id, created_at desc);
create index if not exists study_group_events_group_starts_idx
on public.study_group_events (group_id, starts_at);

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
  if _user_id is null then
    raise exception 'Authentication required';
  end if;

  if nullif(trim(_name), '') is null or char_length(trim(_name)) > 80 then
    raise exception 'Group name must contain between 1 and 80 characters';
  end if;

  if _visibility not in ('public', 'private') then
    raise exception 'Invalid group visibility';
  end if;

  select display_name, avatar
  into _display_name, _avatar
  from public.profiles
  where id = _user_id;

  insert into public.study_groups (owner_id, name, description, subject, emoji, visibility)
  values (
    _user_id,
    trim(_name),
    nullif(trim(_description), ''),
    nullif(trim(_subject), ''),
    coalesce(nullif(trim(_emoji), ''), 'book'),
    _visibility
  )
  returning id into _group_id;

  insert into public.study_group_members (group_id, user_id, role, display_name, avatar)
  values (
    _group_id,
    _user_id,
    'owner',
    coalesce(_display_name, ''),
    coalesce(_avatar, 'target')
  );

  if _visibility = 'private' then
    insert into public.study_group_invites (group_id) values (_group_id);
  end if;

  return _group_id;
end;
$$;

create or replace function public.join_public_study_group(_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _user_id uuid := auth.uid();
  _display_name text;
  _avatar text;
begin
  if _user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.study_groups
    where id = _group_id and visibility = 'public'
  ) then
    raise exception 'Public group not found';
  end if;

  select display_name, avatar
  into _display_name, _avatar
  from public.profiles
  where id = _user_id;

  insert into public.study_group_members (group_id, user_id, display_name, avatar)
  values (_group_id, _user_id, coalesce(_display_name, ''), coalesce(_avatar, 'target'))
  on conflict (group_id, user_id) do nothing;

  return _group_id;
end;
$$;

create or replace function public.join_study_group_by_invite(_invite_token text)
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
  if _user_id is null then
    raise exception 'Authentication required';
  end if;

  select g.id into _group_id
  from public.study_groups g
  join public.study_group_invites i on i.group_id = g.id
  where i.invite_token = _invite_token and g.visibility = 'private';

  if _group_id is null then
    raise exception 'Invalid or expired invite';
  end if;

  select display_name, avatar
  into _display_name, _avatar
  from public.profiles
  where id = _user_id;

  insert into public.study_group_members (group_id, user_id, display_name, avatar)
  values (_group_id, _user_id, coalesce(_display_name, ''), coalesce(_avatar, 'target'))
  on conflict (group_id, user_id) do nothing;

  return _group_id;
end;
$$;

create or replace function public.get_study_group_invite_token(_group_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select i.invite_token
  from public.study_group_invites i
  join public.study_groups g on g.id = i.group_id
  where g.id = _group_id
    and g.owner_id = auth.uid()
    and g.visibility = 'private';
$$;

revoke execute on function public.create_study_group(text, text, text, text, text) from public, anon;
revoke execute on function public.join_public_study_group(uuid) from public, anon;
revoke execute on function public.join_study_group_by_invite(text) from public, anon;
revoke execute on function public.get_study_group_invite_token(uuid) from public, anon;

grant execute on function public.create_study_group(text, text, text, text, text) to authenticated;
grant execute on function public.join_public_study_group(uuid) to authenticated;
grant execute on function public.join_study_group_by_invite(text) to authenticated;
grant execute on function public.get_study_group_invite_token(uuid) to authenticated;
