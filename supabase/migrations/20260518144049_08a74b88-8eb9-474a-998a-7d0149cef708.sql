-- Convert helpers + non-bootstrap triggers to SECURITY INVOKER
alter function public.has_role(uuid, public.app_role)  security invoker;
alter function public.is_staff(uuid)                   security invoker;
alter function public.guard_talent_flags()             security invoker;
alter function public.log_talent_status()              security invoker;

-- Re-grant execute now that they run as invoker (needed for RLS policy use)
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_staff(uuid)                  to authenticated;

-- Scope talent-media listing: owner-folder OR staff
drop policy if exists "Authenticated reads talent-media metadata" on storage.objects;

create policy "Owner lists own talent-media folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'talent-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Staff lists talent-media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'talent-media'
    and public.is_staff(auth.uid())
  );
