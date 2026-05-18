-- Submissions snapshot table
CREATE TABLE public.talent_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL,
  user_id uuid NOT NULL,
  version integer NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL,
  media_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (talent_id, version)
);

CREATE INDEX idx_talent_submissions_talent ON public.talent_submissions (talent_id, version DESC);

ALTER TABLE public.talent_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own submissions"
  ON public.talent_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff reads all submissions"
  ON public.talent_submissions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- INSERT only through the SECURITY DEFINER function below

CREATE OR REPLACE FUNCTION public.record_talent_submission(_talent_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _next_version integer;
  _snapshot jsonb;
  _media jsonb;
BEGIN
  SELECT user_id INTO _user_id FROM public.talent_profiles WHERE id = _talent_id;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Talent profile not found';
  END IF;
  IF auth.uid() <> _user_id AND NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COALESCE(MAX(version), 0) + 1 INTO _next_version
    FROM public.talent_submissions WHERE talent_id = _talent_id;

  SELECT to_jsonb(t.*) INTO _snapshot FROM public.talent_profiles t WHERE id = _talent_id;
  SELECT COALESCE(jsonb_agg(to_jsonb(m.*) ORDER BY m.position, m.created_at), '[]'::jsonb)
    INTO _media FROM public.media_uploads m WHERE talent_id = _talent_id;

  INSERT INTO public.talent_submissions (talent_id, user_id, version, snapshot, media_snapshot)
  VALUES (_talent_id, _user_id, _next_version, _snapshot, _media);

  RETURN _next_version;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_talent_submission(uuid) TO authenticated;