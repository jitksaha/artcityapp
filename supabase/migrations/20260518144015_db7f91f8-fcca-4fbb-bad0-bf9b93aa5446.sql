-- 1. Pin search_path on remaining functions
alter function public.set_updated_at() set search_path = public;
alter function public.stamp_workflow_times() set search_path = public;

-- 2. Tighten public casting_requests insert (no bare TRUE)
drop policy if exists "Anyone submits casting request" on public.casting_requests;
create policy "Anyone submits casting request"
  on public.casting_requests for insert
  to anon, authenticated
  with check (
    contact_person is not null and length(contact_person) between 1 and 150
    and email is not null and length(email) between 5 and 255
    and production_title is not null and length(production_title) between 1 and 200
    and (phone is null or length(phone) <= 40)
    and (company_name is null or length(company_name) <= 200)
    and (message is null or length(message) <= 5000)
    and (role_description is null or length(role_description) <= 5000)
    and (shooting_location is null or length(shooting_location) <= 200)
    and (shooting_dates is null or length(shooting_dates) <= 200)
    and (production_type is null or length(production_type) <= 80)
    and (budget_range is null or length(budget_range) <= 80)
    and (requested_talent_name is null or length(requested_talent_name) <= 200)
  );

-- 3. Stop anonymous listing of talent-media (public file URLs still work)
drop policy if exists "Public reads talent-media" on storage.objects;
create policy "Authenticated reads talent-media metadata"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'talent-media');

-- 4. Lock down SECURITY DEFINER helpers — only authenticated callers
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant  execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke execute on function public.is_staff(uuid) from public, anon;
grant  execute on function public.is_staff(uuid) to authenticated;

-- Trigger-only definers — revoke direct execute entirely
revoke execute on function public.handle_new_user()    from public, anon, authenticated;
revoke execute on function public.guard_talent_flags() from public, anon, authenticated;
revoke execute on function public.log_talent_status()  from public, anon, authenticated;
