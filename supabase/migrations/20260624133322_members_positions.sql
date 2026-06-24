-- ============================================================
-- Gate 3a: members + positions tables, RLS, backfill
-- ============================================================

-- ---------- MEMBERS ----------
create table public.members (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.orgs(id) on delete cascade,
  profile_id        uuid references public.profiles(id) on delete set null,
  full_name         text not null,
  gender            text check (gender in ('male', 'female')),
  email             text,
  phone             text,
  birthday          date,
  membership_status text not null default 'active',
  photo_url         text,
  created_at        timestamptz not null default now()
);

create index members_org_id_idx on public.members(org_id);
create index members_profile_id_idx on public.members(profile_id);
-- One member record per login (partial unique: only where profile_id is set)
create unique index members_profile_id_uniq on public.members(profile_id)
  where profile_id is not null;

-- ---------- POSITIONS ----------
create table public.positions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  module_key  text not null references public.modules(key),
  type        text not null check (type in ('church_leader','director','staff','volunteer')),
  title       text,
  created_at  timestamptz not null default now()
);

create index positions_member_id_idx on public.positions(member_id);
create index positions_org_id_idx on public.positions(org_id);
create index positions_module_key_idx on public.positions(module_key);

-- ============================================================
-- RLS — follows the exact pattern from Gate 1b
-- ============================================================

-- ---------- MEMBERS RLS ----------
alter table public.members enable row level security;

create policy "members: read same org"
  on public.members for select
  using (org_id = public.current_org_id());

create policy "members: super admin manages"
  on public.members for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

-- ---------- POSITIONS RLS ----------
alter table public.positions enable row level security;

create policy "positions: read same org"
  on public.positions for select
  using (org_id = public.current_org_id());

create policy "positions: super admin manages"
  on public.positions for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

-- ============================================================
-- BACKFILL: existing profiles → members, user_roles → positions
-- Idempotent — safe to re-run.
-- ============================================================

-- 1. Create a member row for every profile that doesn't already have one.
insert into public.members (org_id, profile_id, full_name, email)
select p.org_id, p.id, coalesce(p.full_name, p.email, 'Unknown'), p.email
from public.profiles p
where not exists (
  select 1 from public.members m where m.profile_id = p.id
);

-- 2. Create position rows from user_roles.
--
-- MAPPING (role_key → position type):
--   super_admin    → SKIP (it's the account flag, not a position)
--   elder          → church_leader  (elders are church officers)
--   treasurer      → director       (heads a department)
--   *_lead         → director       (department lead roles)
--   everything else → staff          (general department member)
--
-- title = the role's label (e.g. 'Elder', 'Treasurer', 'Communication Lead')
-- module_key = the role's module_key (preserves department access)

insert into public.positions (member_id, org_id, module_key, type, title)
select
  m.id as member_id,
  ur.org_id,
  r.module_key,
  case
    when r.key = 'elder' then 'church_leader'
    when r.key = 'treasurer' then 'director'
    when r.key like '%_lead' then 'director'
    when r.key = 'coord_reviewer' then 'director'
    when r.key = 'sabbath_coord' then 'staff'
    when r.key = 'announce_manager' then 'director'
    when r.key = 'member_manager' then 'director'
    else 'staff'
  end as type,
  r.label as title
from public.user_roles ur
join public.roles r on r.key = ur.role_key
join public.members m on m.profile_id = ur.user_id
where r.key != 'super_admin'
  and not exists (
    -- Idempotent: skip if an equivalent position already exists
    select 1 from public.positions p
    where p.member_id = m.id
      and p.org_id = ur.org_id
      and p.module_key = r.module_key
      and p.title = r.label
  );
