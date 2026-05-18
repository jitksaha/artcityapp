-- Update guard to honor a per-transaction bypass set by trusted functions
CREATE OR REPLACE FUNCTION public.guard_talent_flags()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(current_setting('app.bypass_talent_guard', true), '') = 'on' then
    return new;
  end if;

  if public.is_staff(auth.uid()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approved := false;
    new.published := false;
    new.vip := false;
    new.featured := false;
    new.visible_publicly := false;
    new.status := coalesce(new.status, 'draft');
    if new.status not in ('draft','submitted') then
      new.status := 'draft';
    end if;
    new.admin_feedback := null;
    new.approved_at := null;
    new.published_at := null;
    new.reviewed_at := null;
    return new;
  end if;

  new.approved := old.approved;
  new.published := old.published;
  new.vip := old.vip;
  new.featured := old.featured;
  new.visible_publicly := old.visible_publicly;
  new.featured_order := old.featured_order;
  new.admin_feedback := old.admin_feedback;
  new.approved_at := old.approved_at;
  new.published_at := old.published_at;
  new.reviewed_at := old.reviewed_at;

  if new.status is distinct from old.status then
    if old.status = 'draft' and new.status in ('draft','submitted') then
      null;
    elsif old.status = 'needs_revision' and new.status in ('needs_revision','submitted') then
      null;
    elsif old.status = 'submitted' and new.status = 'draft' then
      null;
    else
      new.status := old.status;
    end if;
  end if;

  if new.status = 'submitted' and old.status <> 'submitted' then
    new.submitted_at := now();
  end if;

  return new;
end;
$function$;

-- Admin-only seeding function. Caller must be authenticated as admin.
CREATE OR REPLACE FUNCTION public.seed_published_talent(
  _user_id uuid,
  _payload jsonb,
  _actor uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF NOT public.has_role(_actor, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  PERFORM set_config('app.bypass_talent_guard', 'on', true);

  INSERT INTO public.talent_profiles (
    user_id, slug, stage_name, full_name, gender, age, playing_age,
    location, nationality, native_language, categories, bio, headshot_url,
    status, approved, published, visible_publicly,
    approved_at, published_at, submitted_at, reviewed_at
  ) VALUES (
    _user_id,
    NULLIF(_payload->>'slug',''),
    NULLIF(_payload->>'stage_name',''),
    NULLIF(_payload->>'full_name',''),
    NULLIF(_payload->>'gender',''),
    NULLIF(_payload->>'age','')::int,
    NULLIF(_payload->>'playing_age',''),
    NULLIF(_payload->>'location',''),
    NULLIF(_payload->>'nationality',''),
    NULLIF(_payload->>'native_language',''),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(_payload->'categories'))::talent_category[],
      '{}'::talent_category[]
    ),
    NULLIF(_payload->>'bio',''),
    NULLIF(_payload->>'headshot_url',''),
    'published',
    true, true, true,
    now(), now(), now(), now()
  )
  RETURNING id INTO _id;

  PERFORM set_config('app.bypass_talent_guard', 'off', true);

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.seed_published_talent(uuid, jsonb, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_published_talent(uuid, jsonb, uuid) TO authenticated, service_role;