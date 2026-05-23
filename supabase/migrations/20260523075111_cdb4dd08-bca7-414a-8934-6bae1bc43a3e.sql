
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS wordpress_site_id text,
  ADD COLUMN IF NOT EXISTS wordpress_auto_sync boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wordpress_default_status text NOT NULL DEFAULT 'publish',
  ADD COLUMN IF NOT EXISTS wordpress_last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS wordpress_last_run_summary jsonb;

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS wordpress_post_id bigint,
  ADD COLUMN IF NOT EXISTS wordpress_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS wordpress_sync_error text;

CREATE INDEX IF NOT EXISTS idx_talent_profiles_wp_sync
  ON public.talent_profiles (wordpress_synced_at)
  WHERE approved = true AND published = true AND visible_publicly = true;

-- Ensure the singleton settings row exists
INSERT INTO public.app_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
