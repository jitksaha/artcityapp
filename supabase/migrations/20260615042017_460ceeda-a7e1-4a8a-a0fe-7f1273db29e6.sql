-- Auto-generate slug from stage_name/full_name when missing, ensuring uniqueness.
CREATE OR REPLACE FUNCTION public.generate_talent_slug(_name text, _id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  n int := 1;
BEGIN
  base := lower(coalesce(_name, ''));
  -- Replace any non a-z 0-9 with hyphens
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  IF base IS NULL OR base = '' THEN
    base := 'talent';
  END IF;
  -- Cap length
  base := left(base, 60);
  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM public.talent_profiles
    WHERE slug = candidate AND (id IS DISTINCT FROM _id)
  ) LOOP
    n := n + 1;
    candidate := base || '-' || n::text;
  END LOOP;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_talent_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := public.generate_talent_slug(
      coalesce(NEW.stage_name, NEW.full_name),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_talent_slug ON public.talent_profiles;
CREATE TRIGGER trg_ensure_talent_slug
BEFORE INSERT OR UPDATE OF stage_name, full_name, slug ON public.talent_profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_talent_slug();

-- Backfill existing rows with missing slugs
UPDATE public.talent_profiles
SET slug = public.generate_talent_slug(coalesce(stage_name, full_name), id)
WHERE slug IS NULL OR btrim(slug) = '';