
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_group_owner(uuid, uuid) FROM anon, authenticated, public;
