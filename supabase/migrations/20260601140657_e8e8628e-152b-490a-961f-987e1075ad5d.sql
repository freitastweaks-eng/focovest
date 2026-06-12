REVOKE EXECUTE ON FUNCTION public.get_simulado_aggregate(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_simulado_aggregate(uuid) TO authenticated;