-- ============================================================
-- Church Admin Pro — Core multi-tenant schema (Gate 1a)
-- orgs, profiles, roles, user_roles, org_modules
-- ============================================================

-- ---------- ORGS (one row per church) ----------
create table public.orgs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  brand_color  text not null default '#7A1E2B',
  created_at   timestamptz not null default now()
);

-- ---------- PROFILES (one row per user, extends auth.users) ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  org_id        uuid not null references public.orgs(id) on delete cascade,
  full_name     text,
  email         text,
  phone         text,
  is_super_admin boolean not null default false,
  created_at    timestamptz not null default now()
);
create index profiles_org_id_idx on public.profiles(org_id);

-- ---------- ROLES (catalog of department roles, global) ----------
create table public.roles (
  key         text primary key,
  label       text not null,
  module_key  text not null,
  sort_order  int not null default 0
);

-- ---------- ORG_MODULES (which departments a church has enabled) ----------
create table public.org_modules (
  org_id      uuid not null references public.orgs(id) on delete cascade,
  module_key  text not null,
  enabled_at  timestamptz not null default now(),
  primary key (org_id, module_key)
);

-- ---------- USER_ROLES (which roles a user holds) ----------
create table public.user_roles (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role_key    text not null references public.roles(key) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_key)
);
create index user_roles_org_id_idx on public.user_roles(org_id);

-- ============================================================
-- SEED: module catalog (the departments from the spec)
-- ============================================================
-- A "module" is a department or cross-cutting feature an org can enable.
create table public.modules (
  key         text primary key,
  label       text not null,
  is_core     boolean not null default false,
  sort_order  int not null default 0
);

insert into public.modules (key, label, is_core, sort_order) values
  ('dashboard',       'Dashboard',              true,  0),
  ('announcements',   'Announcements',          true,  1),
  ('members',         'Member Directory',       true,  2),
  ('sabbath_ops',     'Sabbath Operations',     false, 10),
  ('treasury',        'Treasury / Finance',     false, 11),
  ('coordination',    'Coordination',           false, 12),
  ('leadership',      'Church Leadership',      false, 13),
  ('education',       'Education',              false, 14),
  ('health',          'Health Ministry',        false, 15),
  ('womens',          'Women''s Ministry',      false, 16),
  ('mens',            'Men''s Ministry',        false, 17),
  ('young_womens',    'Young Women''s Ministry',false, 18),
  ('young_mens',      'Young Men''s Ministry',  false, 19),
  ('sabbath_school',  'Sabbath School',         false, 20),
  ('youth',           'Youth Department',       false, 21),
  ('children',        'Children''s Ministry',   false, 22),
  ('ushers',          'Usher Department',       false, 23),
  ('music',           'Music / Worship',        false, 24),
  ('evangelism',      'Evangelism',             false, 25),
  ('community',       'Community Services',     false, 26),
  ('deacons',         'Deacon / Deaconess',     false, 27),
  ('stewardship',     'Stewardship',            false, 28),
  ('prayer',          'Prayer Ministry',        false, 29);

-- ============================================================
-- SEED: role catalog (roles grouped under modules)
-- ============================================================
insert into public.roles (key, label, module_key, sort_order) values
  ('super_admin',        'Super Admin',           'dashboard',     0),
  ('announce_manager',   'Communication Lead',    'announcements', 1),
  ('member_manager',     'Member Directory Admin','members',       2),
  ('elder',              'Elder',                 'sabbath_ops',   10),
  ('sabbath_coord',      'Sabbath Coordinator',   'sabbath_ops',   11),
  ('treasurer',          'Treasurer',             'treasury',      20),
  ('coord_reviewer',     'Coordination Reviewer', 'coordination',  30),
  ('education_lead',     'Education Lead',         'education',     40),
  ('health_lead',        'Health Ministry Lead',  'health',        50),
  ('womens_lead',        'Women''s Ministry Lead','womens',        60),
  ('mens_lead',          'Men''s Ministry Lead',  'mens',          61),
  ('youth_lead',         'Youth Lead',            'youth',         70),
  ('sabbath_school_lead','Sabbath School Lead',   'sabbath_school',80),
  ('dept_staff',         'Department Staff',      'dashboard',     99);

-- ============================================================
-- FUNCTION: handle_new_org
-- Atomically creates a church + its first super-admin profile +
-- enables the core modules. Called from the signup flow.
-- ============================================================
create or replace function public.handle_new_org(
  p_user_id     uuid,
  p_org_name    text,
  p_slug        text,
  p_brand_color text,
  p_full_name   text,
  p_email       text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_module record;
begin
  -- 1. create the church
  insert into public.orgs (name, slug, brand_color)
  values (p_org_name, p_slug, coalesce(nullif(p_brand_color, ''), '#7A1E2B'))
  returning id into v_org_id;

  -- 2. create the first profile as super admin
  insert into public.profiles (id, org_id, full_name, email, is_super_admin)
  values (p_user_id, v_org_id, p_full_name, p_email, true);

  -- 3. assign super_admin role
  insert into public.user_roles (user_id, role_key, org_id)
  values (p_user_id, 'super_admin', v_org_id);

  -- 4. enable all core modules by default
  for v_module in select key from public.modules where is_core = true loop
    insert into public.org_modules (org_id, module_key)
    values (v_org_id, v_module.key);
  end loop;

  return v_org_id;
end;
$$;