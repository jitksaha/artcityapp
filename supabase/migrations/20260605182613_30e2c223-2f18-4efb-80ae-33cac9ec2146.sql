
-- Auto-grant admin role to the designated super admin email on user creation
CREATE OR REPLACE FUNCTION public.auto_grant_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'itkanan2025@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_grant_super_admin ON auth.users;
CREATE TRIGGER trg_auto_grant_super_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_super_admin();

-- Ensure existing row is present (idempotent)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'itkanan2025@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
