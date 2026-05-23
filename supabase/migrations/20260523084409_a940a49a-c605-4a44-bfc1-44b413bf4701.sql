-- 1) app_settings: remove public read, allow only staff/admin
DROP POLICY IF EXISTS "Anyone reads settings" ON public.app_settings;

CREATE POLICY "Staff reads settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 2) talent_profiles: restrict anon column access to non-sensitive columns only.
--    Public-facing reads via the anon role can only SELECT the allow-list below.
--    Authenticated owners/staff continue to see all columns (RLS already scopes rows).
REVOKE SELECT ON public.talent_profiles FROM anon;
GRANT SELECT (
  id, slug, stage_name, full_name, gender, age, playing_age,
  location, nationality, native_language, bio, headshot_url,
  showreel_link, categories, skills, experience,
  vip, featured, featured_order, published_at,
  approved, published, visible_publicly
) ON public.talent_profiles TO anon;

-- 3) Lock down SECURITY DEFINER helpers so anon cannot invoke them.
REVOKE EXECUTE ON FUNCTION public.seed_published_talent(uuid, jsonb, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_talent_submission(uuid) FROM PUBLIC, anon;
-- record_talent_submission remains executable by authenticated callers (it has
-- internal owner/staff checks); seed_published_talent is only called from a
-- server function using the service-role key.