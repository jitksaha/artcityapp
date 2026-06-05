
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS wordpress_retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wordpress_next_retry_at timestamptz;

CREATE INDEX IF NOT EXISTS talent_profiles_wp_next_retry_idx
  ON public.talent_profiles (wordpress_next_retry_at)
  WHERE wordpress_next_retry_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.wordpress_sync_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  success boolean NOT NULL,
  post_id bigint,
  error text,
  duration_ms integer,
  trigger text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wordpress_sync_attempts TO authenticated;
GRANT ALL ON public.wordpress_sync_attempts TO service_role;

ALTER TABLE public.wordpress_sync_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read sync attempts"
  ON public.wordpress_sync_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS wp_sync_attempts_talent_idx
  ON public.wordpress_sync_attempts (talent_id, created_at DESC);
