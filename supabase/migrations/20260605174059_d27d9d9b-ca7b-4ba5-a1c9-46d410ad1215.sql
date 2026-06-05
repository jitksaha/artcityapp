GRANT SELECT ON public.talent_profiles TO anon;
GRANT SELECT ON public.media_uploads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_uploads TO authenticated;
GRANT ALL ON public.talent_profiles TO service_role;
GRANT ALL ON public.media_uploads TO service_role;