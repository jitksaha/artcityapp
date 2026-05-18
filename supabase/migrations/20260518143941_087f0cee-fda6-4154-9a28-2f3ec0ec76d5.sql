-- =====================================================================
-- ART CITY CASTING — FOUNDATION SCHEMA
-- Profiles, roles, talent applications, media, casting requests,
-- admin notes, status history. Strict RLS. Storage buckets.
-- =====================================================================

-- ---------- Enums ----------
create type public.app_role as enum ('applicant', 'casting_manager', 'admin');

create type public.application_status as enum (
  'draft','submitted','under_review','needs_revision','approved','published','rejected'
);

create type public.talent_category as enum (
  'actor','actress','model','performer','voice_talent'
);

-- ---------- Helper: updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = user_id);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- user_roles ----------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','casting_manager')
  )
$$;

create policy "Users view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_staff(auth.uid()));

create policy "Admins manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- Auto-create profile + applicant role on signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'applicant')
  on conflict (user_id, role) do nothing;

  -- Bootstrap admin: itkanan2025@gmail.com
  if new.email = 'itkanan2025@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- talent_profiles ----------
create table public.talent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  slug text unique,

  -- Extracted searchable columns
  stage_name text,
  full_name text,
  gender text,
  age int,
  playing_age text,
  location text,
  nationality text,
  native_language text,
  categories public.talent_category[] default '{}',
  bio text,
  headshot_url text,
  showreel_link text,

  -- Section JSONB blobs (mirror the multi-step form)
  basic_info jsonb not null default '{}'::jsonb,
  physical jsonb not null default '{}'::jsonb,
  skills jsonb not null default '{}'::jsonb,
  languages jsonb not null default '{}'::jsonb,
  experience jsonb not null default '{}'::jsonb,
  agent jsonb not null default '{}'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  agreements jsonb not null default '{}'::jsonb,
  extra_notes jsonb not null default '{}'::jsonb,

  -- Workflow
  status public.application_status not null default 'draft',
  approved boolean not null default false,
  published boolean not null default false,
  vip boolean not null default false,
  featured boolean not null default false,
  visible_publicly boolean not null default false,
  featured_order int,
  admin_feedback text,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index talent_profiles_status_idx on public.talent_profiles (status);
create index talent_profiles_public_idx on public.talent_profiles
  (published, approved, visible_publicly) where published and approved and visible_publicly;
create index talent_profiles_categories_idx on public.talent_profiles using gin (categories);

alter table public.talent_profiles enable row level security;

-- Public can read approved+published+visible profiles
create policy "Public reads public talents"
  on public.talent_profiles for select
  using (approved and published and visible_publicly);

create policy "Owner reads own talent"
  on public.talent_profiles for select
  using (auth.uid() = user_id);

create policy "Staff reads all talents"
  on public.talent_profiles for select
  using (public.is_staff(auth.uid()));

create policy "Owner creates own talent"
  on public.talent_profiles for insert
  with check (auth.uid() = user_id);

-- Owner may update ONLY when status is draft or needs_revision
-- and may NEVER mutate workflow flags (enforced via trigger below).
create policy "Owner updates own draft"
  on public.talent_profiles for update
  using (
    auth.uid() = user_id
    and status in ('draft','needs_revision')
  )
  with check (auth.uid() = user_id);

create policy "Staff updates all talents"
  on public.talent_profiles for update
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "Admin deletes talents"
  on public.talent_profiles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Guard: applicants cannot self-publish or flip workflow flags
create or replace function public.guard_talent_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_staff(auth.uid()) then
    -- staff/admin can change anything
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

  -- UPDATE by non-staff: force-protect flags
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

  -- Allow status transitions only: draft<->submitted, needs_revision->submitted
  if new.status is distinct from old.status then
    if old.status = 'draft' and new.status in ('draft','submitted') then
      null;
    elsif old.status = 'needs_revision' and new.status in ('needs_revision','submitted') then
      null;
    elsif old.status = 'submitted' and new.status = 'draft' then
      null; -- allow withdraw to draft
    else
      new.status := old.status;
    end if;
  end if;

  if new.status = 'submitted' and old.status <> 'submitted' then
    new.submitted_at := now();
  end if;

  return new;
end;
$$;

create trigger trg_talent_guard_ins
  before insert on public.talent_profiles
  for each row execute function public.guard_talent_flags();

create trigger trg_talent_guard_upd
  before update on public.talent_profiles
  for each row execute function public.guard_talent_flags();

create trigger trg_talent_updated
  before update on public.talent_profiles
  for each row execute function public.set_updated_at();

-- Auto-stamp workflow timestamps when staff updates
create or replace function public.stamp_workflow_times()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved' and new.approved_at is null then
      new.approved_at := now();
      new.approved := true;
    end if;
    if new.status = 'published' and new.published_at is null then
      new.published_at := now();
      new.published := true;
      new.approved := true;
      new.visible_publicly := true;
    end if;
    if new.status in ('under_review','needs_revision','rejected') then
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_talent_workflow_stamp
  before update on public.talent_profiles
  for each row execute function public.stamp_workflow_times();

-- ---------- media_uploads ----------
create table public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  user_id uuid not null,
  kind text not null check (kind in ('headshot','medium_shot','full_body','voice_reel','cv','driving_license','other')),
  bucket text not null,
  path text not null,
  mime_type text,
  size_bytes bigint,
  position int default 0,
  created_at timestamptz not null default now()
);

create index media_uploads_talent_idx on public.media_uploads (talent_id);

alter table public.media_uploads enable row level security;

create policy "Owner manages own media"
  on public.media_uploads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Staff reads all media"
  on public.media_uploads for select
  using (public.is_staff(auth.uid()));

create policy "Staff manages media"
  on public.media_uploads for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "Public reads media of public talents"
  on public.media_uploads for select
  using (
    bucket = 'talent-media'
    and exists (
      select 1 from public.talent_profiles t
      where t.id = media_uploads.talent_id
        and t.approved and t.published and t.visible_publicly
    )
  );

-- ---------- casting_requests ----------
create table public.casting_requests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid references public.talent_profiles(id) on delete set null,
  requested_talent_name text,
  production_title text not null,
  production_type text,
  role_description text,
  shooting_dates text,
  shooting_location text,
  budget_range text,
  company_name text,
  contact_person text not null,
  phone text,
  email text not null,
  message text,
  status text not null default 'new' check (status in ('new','in_progress','closed','rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.casting_requests enable row level security;

create policy "Anyone submits casting request"
  on public.casting_requests for insert
  with check (true);

create policy "Staff reads casting requests"
  on public.casting_requests for select
  using (public.is_staff(auth.uid()));

create policy "Staff updates casting requests"
  on public.casting_requests for update
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "Admin deletes casting requests"
  on public.casting_requests for delete
  using (public.has_role(auth.uid(), 'admin'));

create trigger trg_casting_requests_updated
  before update on public.casting_requests
  for each row execute function public.set_updated_at();

-- ---------- admin_notes ----------
create table public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  author_id uuid not null,
  note text not null,
  visible_to_applicant boolean not null default false,
  created_at timestamptz not null default now()
);

create index admin_notes_talent_idx on public.admin_notes (talent_id);

alter table public.admin_notes enable row level security;

create policy "Staff manages admin notes"
  on public.admin_notes for all
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

create policy "Applicant reads visible notes"
  on public.admin_notes for select
  using (
    visible_to_applicant
    and exists (
      select 1 from public.talent_profiles t
      where t.id = admin_notes.talent_id and t.user_id = auth.uid()
    )
  );

-- ---------- status_logs ----------
create table public.status_logs (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talent_profiles(id) on delete cascade,
  actor_id uuid,
  from_status public.application_status,
  to_status public.application_status not null,
  reason text,
  created_at timestamptz not null default now()
);

create index status_logs_talent_idx on public.status_logs (talent_id, created_at desc);

alter table public.status_logs enable row level security;

create policy "Owner reads own status logs"
  on public.status_logs for select
  using (
    exists (
      select 1 from public.talent_profiles t
      where t.id = status_logs.talent_id and t.user_id = auth.uid()
    )
  );

create policy "Staff reads all status logs"
  on public.status_logs for select
  using (public.is_staff(auth.uid()));

create policy "Staff writes status logs"
  on public.status_logs for insert
  with check (public.is_staff(auth.uid()) or exists (
    select 1 from public.talent_profiles t
    where t.id = status_logs.talent_id and t.user_id = auth.uid()
  ));

-- Auto-write status_logs on talent status change
create or replace function public.log_talent_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.status_logs (talent_id, actor_id, from_status, to_status, reason)
    values (new.id, auth.uid(), old.status, new.status, new.admin_feedback);
  end if;
  return new;
end;
$$;

create trigger trg_talent_status_log
  after update on public.talent_profiles
  for each row execute function public.log_talent_status();

-- ---------- app_settings (singleton) ----------
create table public.app_settings (
  id int primary key default 1,
  casting_notification_email text,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id, casting_notification_email)
values (1, 'itkanan2025@gmail.com')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

create policy "Anyone reads settings"
  on public.app_settings for select using (true);

create policy "Admin updates settings"
  on public.app_settings for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create trigger trg_app_settings_updated
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public)
values
  ('talent-media', 'talent-media', true),
  ('talent-docs',  'talent-docs',  false)
on conflict (id) do nothing;

-- talent-media (public read; owner writes their own folder; staff writes anywhere)
create policy "Public reads talent-media"
  on storage.objects for select
  using (bucket_id = 'talent-media');

create policy "Owner uploads to own folder (talent-media)"
  on storage.objects for insert
  with check (
    bucket_id = 'talent-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owner updates own files (talent-media)"
  on storage.objects for update
  using (
    bucket_id = 'talent-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owner deletes own files (talent-media)"
  on storage.objects for delete
  using (
    bucket_id = 'talent-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Staff manages talent-media"
  on storage.objects for all
  using (bucket_id = 'talent-media' and public.is_staff(auth.uid()))
  with check (bucket_id = 'talent-media' and public.is_staff(auth.uid()));

-- talent-docs (private; only owner and staff)
create policy "Owner reads talent-docs"
  on storage.objects for select
  using (
    bucket_id = 'talent-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owner uploads talent-docs"
  on storage.objects for insert
  with check (
    bucket_id = 'talent-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owner updates talent-docs"
  on storage.objects for update
  using (
    bucket_id = 'talent-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Owner deletes talent-docs"
  on storage.objects for delete
  using (
    bucket_id = 'talent-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Staff manages talent-docs"
  on storage.objects for all
  using (bucket_id = 'talent-docs' and public.is_staff(auth.uid()))
  with check (bucket_id = 'talent-docs' and public.is_staff(auth.uid()));
