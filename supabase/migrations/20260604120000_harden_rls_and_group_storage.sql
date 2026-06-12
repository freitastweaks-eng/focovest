-- Harden ownership invariants on UPDATE policies. In Postgres RLS, USING
-- checks the old row; WITH CHECK is needed to validate the new row.

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "CalEvents: update own" ON public.calendar_events;
CREATE POLICY "CalEvents: update own" ON public.calendar_events
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Posts: update own" ON public.community_posts;
CREATE POLICY "Posts: update own" ON public.community_posts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Comments: update own" ON public.community_comments;
CREATE POLICY "Comments: update own" ON public.community_comments
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Groups: update owner" ON public.study_groups;
CREATE POLICY "Groups: update owner" ON public.study_groups
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Decks: update own" ON public.flashcard_decks;
CREATE POLICY "Decks: update own" ON public.flashcard_decks
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_default = false);

DROP POLICY IF EXISTS "Cards: update own deck" ON public.flashcards;
CREATE POLICY "Cards: update own deck" ON public.flashcards
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks d
    WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flashcard_decks d
    WHERE d.id = flashcards.deck_id AND d.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Reviews: update own" ON public.flashcard_reviews;
CREATE POLICY "Reviews: update own" ON public.flashcard_reviews
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "TP: update own" ON public.topic_progress;
CREATE POLICY "TP: update own" ON public.topic_progress
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Community files: user update own" ON storage.objects;
CREATE POLICY "Community files: user update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'community-files' AND auth.uid()::text = (storage.foldername(name))[1]);

ALTER TABLE public.community_posts
DROP CONSTRAINT IF EXISTS community_posts_attachment_path_scope;
ALTER TABLE public.community_posts
ADD CONSTRAINT community_posts_attachment_path_scope
CHECK (
  attachment_url IS NULL
  OR (
    attachment_url !~* '^https?://'
    AND split_part(attachment_url, '/', 1) = user_id::text
  )
) NOT VALID;

ALTER TABLE public.study_group_materials
DROP CONSTRAINT IF EXISTS study_group_materials_file_path_scope;
ALTER TABLE public.study_group_materials
ADD CONSTRAINT study_group_materials_file_path_scope
CHECK (
  file_url IS NULL
  OR (
    file_url !~* '^https?://'
    AND split_part(file_url, '/', 1) = group_id::text
    AND split_part(file_url, '/', 2) = user_id::text
  )
) NOT VALID;

-- Private bucket for group materials. A path is group_id/user_id/file.
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-files', 'group-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE OR REPLACE FUNCTION public.storage_folder_uuid(_name text, _index integer)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _value text;
BEGIN
  _value := (storage.foldername(_name))[_index];
  RETURN _value::uuid;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.storage_folder_uuid(text, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.storage_folder_uuid(text, integer) TO authenticated;

-- These helpers are referenced by RLS expressions, so authenticated callers
-- need EXECUTE permission for policy evaluation to succeed.
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Group files: member read" ON storage.objects;
CREATE POLICY "Group files: member read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'group-files'
  AND public.is_group_member(public.storage_folder_uuid(name, 1), auth.uid())
);

DROP POLICY IF EXISTS "Group files: member upload own folder" ON storage.objects;
CREATE POLICY "Group files: member upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'group-files'
  AND public.storage_folder_uuid(name, 2) = auth.uid()
  AND public.is_group_member(public.storage_folder_uuid(name, 1), auth.uid())
);

DROP POLICY IF EXISTS "Group files: user update own" ON storage.objects;
CREATE POLICY "Group files: user update own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'group-files'
  AND public.storage_folder_uuid(name, 2) = auth.uid()
)
WITH CHECK (
  bucket_id = 'group-files'
  AND public.storage_folder_uuid(name, 2) = auth.uid()
  AND public.is_group_member(public.storage_folder_uuid(name, 1), auth.uid())
);

DROP POLICY IF EXISTS "Group files: user delete own" ON storage.objects;
CREATE POLICY "Group files: user delete own"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'group-files'
  AND public.storage_folder_uuid(name, 2) = auth.uid()
);

CREATE OR REPLACE FUNCTION public.get_simulado_percentile(_simulado_id uuid, _percentage numeric)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ROUND(
      100 * COUNT(*) FILTER (WHERE percentage < _percentage)::numeric
      / NULLIF(COUNT(*), 0)
    ),
    0
  )
  FROM public.simulado_results
  WHERE simulado_id = _simulado_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_simulado_percentile(uuid, numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_simulado_percentile(uuid, numeric) TO authenticated;
