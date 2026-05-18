-- Ensure role helper functions are safe to call from RLS policies.
-- SECURITY DEFINER lets these helpers check user_roles without requiring callers
-- to have direct table access or causing recursive RLS evaluation.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::public.app_role, 'casting_manager'::public.app_role)
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO anon, authenticated;

-- Staff/admin/owner rules only need to apply to signed-in users.
-- This prevents anonymous public talent reads from evaluating staff helpers.
ALTER POLICY "Admin deletes talents" ON public.talent_profiles TO authenticated;
ALTER POLICY "Owner creates own talent" ON public.talent_profiles TO authenticated;
ALTER POLICY "Owner reads own talent" ON public.talent_profiles TO authenticated;
ALTER POLICY "Owner updates own draft" ON public.talent_profiles TO authenticated;
ALTER POLICY "Staff reads all talents" ON public.talent_profiles TO authenticated;
ALTER POLICY "Staff updates all talents" ON public.talent_profiles TO authenticated;

ALTER POLICY "Owner manages own media" ON public.media_uploads TO authenticated;
ALTER POLICY "Staff manages media" ON public.media_uploads TO authenticated;
ALTER POLICY "Staff reads all media" ON public.media_uploads TO authenticated;