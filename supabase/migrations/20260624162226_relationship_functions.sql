-- ============================================================
-- Gate 3d finishing: atomic relationship link/unlink functions
-- Both-direction consistency guaranteed in a single transaction.
-- ============================================================

-- LINK SPOUSE: creates mutual spouse rows + sets marital_status='married' on both members
create or replace function public.link_spouse(p_member_id uuid, p_spouse_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from profiles where id = auth.uid();
  if v_org_id is null then raise exception 'No profile for current user'; end if;

  -- Verify both members belong to the caller's org
  if not exists (select 1 from members where id = p_member_id and org_id = v_org_id) then
    raise exception 'Member not found in your organization';
  end if;
  if not exists (select 1 from members where id = p_spouse_id and org_id = v_org_id) then
    raise exception 'Spouse not found in your organization';
  end if;

  -- Insert mutual relationship rows (idempotent)
  insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
  values (v_org_id, p_member_id, p_spouse_id, 'spouse')
  on conflict do nothing;

  insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
  values (v_org_id, p_spouse_id, p_member_id, 'spouse')
  on conflict do nothing;

  -- Set both to married
  update members set marital_status = 'married' where id in (p_member_id, p_spouse_id) and org_id = v_org_id;
end;
$$;

-- LINK CHILD: creates parent→child and child→parent rows
create or replace function public.link_child(p_parent_id uuid, p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from profiles where id = auth.uid();
  if v_org_id is null then raise exception 'No profile for current user'; end if;

  if not exists (select 1 from members where id = p_parent_id and org_id = v_org_id) then
    raise exception 'Parent not found in your organization';
  end if;
  if not exists (select 1 from members where id = p_child_id and org_id = v_org_id) then
    raise exception 'Child not found in your organization';
  end if;

  insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
  values (v_org_id, p_parent_id, p_child_id, 'parent')
  on conflict do nothing;

  insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
  values (v_org_id, p_child_id, p_parent_id, 'child')
  on conflict do nothing;
end;
$$;

-- UNLINK RELATIONSHIP: deletes BOTH directions of a relationship between two members
create or replace function public.unlink_relationship(p_member_id uuid, p_related_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select org_id into v_org_id from profiles where id = auth.uid();
  if v_org_id is null then raise exception 'No profile for current user'; end if;

  -- Delete both directions
  delete from member_relationships
  where org_id = v_org_id
    and (
      (member_id = p_member_id and related_member_id = p_related_id)
      or
      (member_id = p_related_id and related_member_id = p_member_id)
    );
end;
$$;
