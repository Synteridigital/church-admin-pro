-- ============================================================
-- Church Admin Pro — Row Level Security (Gate 1b)
-- Every tenant table is isolated by org_id.
-- ============================================================

-- Helper: the org_id of the currently authenticated user.
-- SECURITY DEFINER so it can read profiles without recursing into
-- the very policies we're about to create.
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- Helper: is the current user a super admin in their org?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------- ORGS ----------
alter table public.orgs enable row level security;

create policy "orgs: members read own org"
  on public.orgs for select
  using (id = public.current_org_id());

create policy "orgs: super admin updates own org"
  on public.orgs for update
  using (id = public.current_org_id() and public.is_super_admin());

-- ---------- PROFILES ----------
alter table public.profiles enable row level security;

create policy "profiles: read same org"
  on public.profiles for select
  using (org_id = public.current_org_id());

create policy "profiles: super admin manages org profiles"
  on public.profiles for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

create policy "profiles: user updates self"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- USER_ROLES ----------
alter table public.user_roles enable row level security;

create policy "user_roles: read same org"
  on public.user_roles for select
  using (org_id = public.current_org_id());

create policy "user_roles: super admin manages"
  on public.user_roles for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

-- ---------- ORG_MODULES ----------
alter table public.org_modules enable row level security;

create policy "org_modules: read same org"
  on public.org_modules for select
  using (org_id = public.current_org_id());

create policy "org_modules: super admin manages"
  on public.org_modules for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

-- ---------- MODULES + ROLES (global catalogs, read-only to all authed users) ----------
alter table public.modules enable row level security;
create policy "modules: readable by authed users"
  on public.modules for select
  using (auth.role() = 'authenticated');

alter table public.roles enable row level security;
create policy "roles: readable by authed users"
  on public.roles for select
  using (auth.role() = 'authenticated');