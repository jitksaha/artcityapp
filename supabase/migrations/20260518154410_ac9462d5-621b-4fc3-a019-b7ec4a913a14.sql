-- Internal role checks are only needed for signed-in users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

-- Restrict all staff/admin role-checking policies to authenticated sessions.
ALTER POLICY "Staff manages admin notes" ON public.admin_notes TO authenticated;

ALTER POLICY "Admin updates settings" ON public.app_settings TO authenticated;

ALTER POLICY "Admin deletes casting requests" ON public.casting_requests TO authenticated;
ALTER POLICY "Staff reads casting requests" ON public.casting_requests TO authenticated;
ALTER POLICY "Staff updates casting requests" ON public.casting_requests TO authenticated;

ALTER POLICY "Staff reads all status logs" ON public.status_logs TO authenticated;
ALTER POLICY "Staff writes status logs" ON public.status_logs TO authenticated;

ALTER POLICY "Admins manage roles" ON public.user_roles TO authenticated;
ALTER POLICY "Users view own roles" ON public.user_roles TO authenticated;