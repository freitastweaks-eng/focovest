-- Community posts
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_avatar TEXT NOT NULL DEFAULT '🎯',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'discussao',
  subject TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts: select all authenticated" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Posts: insert own" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Posts: update own" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Posts: delete own" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_category ON public.community_posts(category);

CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Comments
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_avatar TEXT NOT NULL DEFAULT '🎯',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments: select all authenticated" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Comments: insert own" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments: update own" ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Comments: delete own" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_community_comments_post ON public.community_comments(post_id, created_at);

-- Likes
CREATE TABLE public.community_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes: select all authenticated" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Likes: insert own" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Likes: delete own" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('community-files', 'community-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community files: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-files');

CREATE POLICY "Community files: user upload own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Community files: user update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Community files: user delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);