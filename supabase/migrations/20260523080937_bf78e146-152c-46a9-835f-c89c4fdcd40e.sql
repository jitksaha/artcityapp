
CREATE TABLE IF NOT EXISTS public.wordpress_credentials (
  id integer PRIMARY KEY DEFAULT 1,
  mode text NOT NULL DEFAULT 'connector' CHECK (mode IN ('connector','self_hosted')),
  site_url text,
  username text,
  app_password text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT singleton CHECK (id = 1)
);

INSERT INTO public.wordpress_credentials (id, mode) VALUES (1, 'connector')
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.wordpress_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read wp credentials" ON public.wordpress_credentials
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update wp credentials" ON public.wordpress_credentials
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS wp_credentials_updated_at ON public.wordpress_credentials;
CREATE TRIGGER wp_credentials_updated_at BEFORE UPDATE ON public.wordpress_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
