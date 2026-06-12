-- Enforce storage limits at the server, not only in the browser.
UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
WHERE id IN ('community-files', 'group-files');

-- These helper functions are used by RLS and must not answer questions about
-- another user's membership when called directly.
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.study_group_members
      WHERE group_id = _group_id AND user_id = _user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.study_groups
      WHERE id = _group_id AND owner_id = _user_id
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) TO authenticated;
