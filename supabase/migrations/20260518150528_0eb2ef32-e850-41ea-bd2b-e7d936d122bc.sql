
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0;
