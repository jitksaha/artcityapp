
-- Embed security settings (singleton)
CREATE TABLE IF NOT EXISTS public.embed_security_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  require_token boolean NOT NULL DEFAULT false,
  signing_secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  allowed_origins text[] NOT NULL DEFAULT '{}',
  token_ttl_seconds integer NOT NULL DEFAULT 86400,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.embed_security_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.embed_security_settings ENABLE ROW LEVEL SECURITY;

-- Only admins may read/write (service role bypasses RLS)
CREATE POLICY "embed_sec_admin_select" ON public.embed_security_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "embed_sec_admin_update" ON public.embed_security_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER embed_sec_set_updated_at
  BEFORE UPDATE ON public.embed_security_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
