ALTER TABLE public.media_uploads
  ADD COLUMN IF NOT EXISTS thumbnail_path text,
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer;

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS headshot_thumb_url text;