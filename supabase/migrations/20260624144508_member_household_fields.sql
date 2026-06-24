-- ============================================================
-- Gate 3c: household fields, structured names, relationships, storage bucket
-- ============================================================

-- ---------- NEW COLUMNS ON MEMBERS ----------
alter table public.members
  add column first_name text,
  add column last_name text,
  -- Structured birthday parts (month+day always; year optional)
  -- The existing "birthday" date column is retained as legacy.
  add column birth_month int check (birth_month between 1 and 12),
  add column birth_day int check (birth_day between 1 and 31),
  add column birth_year int,
  add column church_email text,
  add column marital_status text check (marital_status in ('single','married','widowed','divorced','separated')),
  add column anniversary_date date,
  add column education_level text,
  add column education_other text,
  add column preferred_communication text[],
  add column address_street text,
  add column address_unit text,
  add column address_city text,
  add column address_state text,
  add column address_zip text,
  add column address_formatted text,
  add column submission_type text check (submission_type in ('self','household','child'));

-- ---------- MEMBER_RELATIONSHIPS ----------
create table public.member_relationships (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.orgs(id) on delete cascade,
  member_id           uuid not null references public.members(id) on delete cascade,
  related_member_id   uuid not null references public.members(id) on delete cascade,
  relationship_type   text not null check (relationship_type in ('spouse','parent','child','guardian')),
  created_at          timestamptz not null default now()
);

create index member_relationships_member_id_idx on public.member_relationships(member_id);
create index member_relationships_related_member_id_idx on public.member_relationships(related_member_id);
create index member_relationships_org_id_idx on public.member_relationships(org_id);

-- RLS (same pattern as members)
alter table public.member_relationships enable row level security;

create policy "member_relationships: read same org"
  on public.member_relationships for select
  using (org_id = public.current_org_id());

create policy "member_relationships: super admin manages"
  on public.member_relationships for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

-- ---------- BACKFILL: split full_name → first_name / last_name ----------
-- Best-effort: first token = first_name, remainder = last_name.
-- Idempotent: only updates rows where first_name is still null.
update public.members
set
  first_name = case
    when position(' ' in full_name) > 0
    then left(full_name, position(' ' in full_name) - 1)
    else full_name
  end,
  last_name = case
    when position(' ' in full_name) > 0
    then substring(full_name from position(' ' in full_name) + 1)
    else null
  end
where first_name is null;

-- ---------- STORAGE BUCKET: member-photos (public-read) ----------
-- Public-read so photo URLs work anywhere in the app without signed URLs.
-- Supabase migrations can insert directly into storage.buckets.
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload to their org's folder.
-- Files are stored as: {org_id}/{member_id}.{ext}
create policy "member-photos: auth users can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'member-photos');

create policy "member-photos: auth users can update own uploads"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'member-photos');

create policy "member-photos: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'member-photos');

create policy "member-photos: auth users can delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'member-photos');
