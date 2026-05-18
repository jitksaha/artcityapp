REVOKE EXECUTE ON FUNCTION public.seed_published_talent(uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_published_talent(uuid, jsonb, uuid) TO service_role;