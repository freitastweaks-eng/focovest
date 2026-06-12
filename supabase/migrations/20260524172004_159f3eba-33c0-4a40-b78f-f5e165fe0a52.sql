
-- Groups
CREATE TABLE public.study_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  subject text,
  emoji text NOT NULL DEFAULT '📚',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.study_group_members (
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  display_name text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '🎯',
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursive RLS when checking membership
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.study_group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.study_groups WHERE id = _group_id AND owner_id = _user_id);
$$;

-- study_groups policies
CREATE POLICY "Groups: select all authenticated" ON public.study_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Groups: insert own" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Groups: update owner" ON public.study_groups FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Groups: delete owner" ON public.study_groups FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- members policies
CREATE POLICY "Members: select all authenticated" ON public.study_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members: join self" ON public.study_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members: leave self" ON public.study_group_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_group_owner(group_id, auth.uid()));

-- Posts
CREATE TABLE public.study_group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  author_avatar text NOT NULL DEFAULT '🎯',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_group_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GPosts: select members" ON public.study_group_posts FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "GPosts: insert member" ON public.study_group_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "GPosts: delete own" ON public.study_group_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Materials
CREATE TABLE public.study_group_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text,
  file_url text,
  file_name text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_group_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GMat: select members" ON public.study_group_materials FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "GMat: insert member" ON public.study_group_materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "GMat: delete own" ON public.study_group_materials FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Events
CREATE TABLE public.study_group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_group_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GEv: select members" ON public.study_group_events FOR SELECT TO authenticated USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "GEv: insert member" ON public.study_group_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "GEv: delete own" ON public.study_group_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER trg_groups_updated BEFORE UPDATE ON public.study_groups FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Premium waitlist
CREATE TABLE public.premium_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid,
  source text NOT NULL DEFAULT 'groups',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Waitlist: anyone insert" ON public.premium_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Waitlist: select own" ON public.premium_waitlist FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_group_members_user ON public.study_group_members(user_id);
CREATE INDEX idx_group_posts_group ON public.study_group_posts(group_id, created_at DESC);
CREATE INDEX idx_group_materials_group ON public.study_group_materials(group_id, created_at DESC);
CREATE INDEX idx_group_events_group ON public.study_group_events(group_id, starts_at);
