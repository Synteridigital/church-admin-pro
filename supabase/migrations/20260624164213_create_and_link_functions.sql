-- ============================================================
-- Atomic create-and-link functions for spouse and child.
-- Creates a new member + both-direction relationship in one tx.
-- org_id derived from auth.uid() → profiles.org_id.
-- ============================================================

create or replace function public.create_and_link_spouse(
  p_payload jsonb,
  p_existing_member uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id    uuid;
  v_new_id    uuid;
begin
  select org_id into v_org_id from profiles where id = auth.uid();
  if v_org_id is null then raise exception 'No profile for current user'; end if;

  -- Verify existing member belongs to caller's org
  if not exists (select 1 from members where id = p_existing_member and org_id = v_org_id) then
    raise exception 'Member not found in your organization';
  end if;

  -- Create the new spouse member
  insert into members (
    org_id, first_name, last_name, full_name, gender,
    email, church_email, phone,
    birth_month, birth_day, birth_year,
    education_level, education_other,
    photo_url, submission_type, membership_status, marital_status
  ) values (
    v_org_id,
    p_payload->>'first_name',
    p_payload->>'last_name',
    coalesce(p_payload->>'first_name', '') || ' ' || coalesce(p_payload->>'last_name', ''),
    nullif(p_payload->>'gender', ''),
    nullif(p_payload->>'email', ''),
    nullif(p_payload->>'church_email', ''),
    nullif(p_payload->>'phone', ''),
    case when p_payload->>'birth_month' = '' or p_payload->>'birth_month' is null then null
         else (p_payload->>'birth_month')::int end,
    case when p_payload->>'birth_day' = '' or p_payload->>'birth_day' is null then null
         else (p_payload->>'birth_day')::int end,
    case when p_payload->>'birth_year' = '' or p_payload->>'birth_year' is null then null
         else (p_payload->>'birth_year')::int end,
    nullif(p_payload->>'education_level', ''),
    case when p_payload->>'education_level' = 'Other'
         then nullif(p_payload->>'education_other', '')
         else null end,
    nullif(p_payload->>'photo_url', ''),
    'household',
    'active',
    'married'
  )
  returning id into v_new_id;

  -- Mutual spouse relationships
  insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
  values (v_org_id, p_existing_member, v_new_id, 'spouse'),
         (v_org_id, v_new_id, p_existing_member, 'spouse');

  -- Set existing member to married too
  update members set marital_status = 'married'
  where id = p_existing_member and org_id = v_org_id;

  return v_new_id;
end;
$$;

create or replace function public.create_and_link_child(
  p_payload jsonb,
  p_parent uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id    uuid;
  v_new_id    uuid;
begin
  select org_id into v_org_id from profiles where id = auth.uid();
  if v_org_id is null then raise exception 'No profile for current user'; end if;

  if not exists (select 1 from members where id = p_parent and org_id = v_org_id) then
    raise exception 'Parent not found in your organization';
  end if;

  -- Create the new child member
  insert into members (
    org_id, first_name, last_name, full_name, gender,
    email, church_email, phone,
    birth_month, birth_day, birth_year,
    education_level, education_other,
    photo_url, submission_type, membership_status
  ) values (
    v_org_id,
    p_payload->>'first_name',
    p_payload->>'last_name',
    coalesce(p_payload->>'first_name', '') || ' ' || coalesce(p_payload->>'last_name', ''),
    nullif(p_payload->>'gender', ''),
    nullif(p_payload->>'email', ''),
    nullif(p_payload->>'church_email', ''),
    nullif(p_payload->>'phone', ''),
    case when p_payload->>'birth_month' = '' or p_payload->>'birth_month' is null then null
         else (p_payload->>'birth_month')::int end,
    case when p_payload->>'birth_day' = '' or p_payload->>'birth_day' is null then null
         else (p_payload->>'birth_day')::int end,
    case when p_payload->>'birth_year' = '' or p_payload->>'birth_year' is null then null
         else (p_payload->>'birth_year')::int end,
    nullif(p_payload->>'education_level', ''),
    case when p_payload->>'education_level' = 'Other'
         then nullif(p_payload->>'education_other', '')
         else null end,
    nullif(p_payload->>'photo_url', ''),
    'child',
    'active'
  )
  returning id into v_new_id;

  -- Parent→child and child→parent
  insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
  values (v_org_id, p_parent, v_new_id, 'parent'),
         (v_org_id, v_new_id, p_parent, 'child');

  return v_new_id;
end;
$$;
