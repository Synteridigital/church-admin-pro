-- ============================================================
-- Gate 3e: public form infrastructure
-- Token table + public household intake function (accepts explicit org_id)
-- NO existing RLS policies are weakened.
-- ============================================================

-- ---------- PUBLIC_FORM_TOKENS ----------
create table public.public_form_tokens (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  form_type   text not null,
  token       text unique not null,
  expires_at  timestamptz,
  used_at     timestamptz,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index public_form_tokens_org_id_idx on public.public_form_tokens(org_id);
create index public_form_tokens_token_idx on public.public_form_tokens(token);

-- RLS: org-scoped read for logged-in users, super-admin manage.
-- Anonymous users NEVER read this table directly; the server route uses service role.
alter table public.public_form_tokens enable row level security;

create policy "public_form_tokens: read same org"
  on public.public_form_tokens for select
  using (org_id = public.current_org_id());

create policy "public_form_tokens: super admin manages"
  on public.public_form_tokens for all
  using (org_id = public.current_org_id() and public.is_super_admin())
  with check (org_id = public.current_org_id() and public.is_super_admin());

-- ---------- PUBLIC HOUSEHOLD INTAKE FUNCTION ----------
-- Accepts an explicit org_id (trusted because the caller is the service-role route).
-- Marks all records with submission_type containing 'public_' prefix.
-- Uses the same atomic logic as handle_household_intake.
create or replace function public.handle_public_household_intake(
  p_org_id  uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_primary_id   uuid;
  v_spouse_id    uuid;
  v_child_id     uuid;
  v_child        jsonb;
  v_created_ids  uuid[] := '{}';
  v_sub_type     text;
begin
  -- Verify org exists
  if not exists (select 1 from orgs where id = p_org_id) then
    raise exception 'Organization not found';
  end if;

  v_sub_type := 'public_' || coalesce(p_payload->>'submission_type', 'self');

  -- 1. Insert primary member
  insert into members (
    org_id, first_name, last_name, full_name,
    email, church_email, phone,
    birth_month, birth_day, birth_year,
    marital_status, anniversary_date,
    education_level, education_other,
    preferred_communication,
    address_street, address_unit, address_city, address_state, address_zip, address_formatted,
    submission_type, membership_status
  ) values (
    p_org_id,
    p_payload->>'first_name',
    p_payload->>'last_name',
    coalesce(p_payload->>'first_name', '') || ' ' || coalesce(p_payload->>'last_name', ''),
    nullif(p_payload->>'email', ''),
    nullif(p_payload->>'church_email', ''),
    nullif(p_payload->>'phone', ''),
    case when p_payload->>'birth_month' = '' or p_payload->>'birth_month' is null then null
         else (p_payload->>'birth_month')::int end,
    case when p_payload->>'birth_day' = '' or p_payload->>'birth_day' is null then null
         else (p_payload->>'birth_day')::int end,
    case when p_payload->>'birth_year' = '' or p_payload->>'birth_year' is null then null
         else (p_payload->>'birth_year')::int end,
    nullif(p_payload->>'marital_status', ''),
    case when p_payload->>'anniversary_date' = '' or p_payload->>'anniversary_date' is null then null
         else (p_payload->>'anniversary_date')::date end,
    nullif(p_payload->>'education_level', ''),
    nullif(p_payload->>'education_other', ''),
    case when p_payload->'preferred_communication' is not null
         then array(select jsonb_array_elements_text(p_payload->'preferred_communication'))
         else null end,
    nullif(p_payload->>'address_street', ''),
    nullif(p_payload->>'address_unit', ''),
    nullif(p_payload->>'address_city', ''),
    nullif(p_payload->>'address_state', ''),
    nullif(p_payload->>'address_zip', ''),
    nullif(p_payload->>'address_formatted', ''),
    v_sub_type,
    'active'
  )
  returning id into v_primary_id;
  v_created_ids := v_created_ids || v_primary_id;

  -- 2. Insert spouse if provided
  if p_payload->'spouse' is not null and p_payload->>'spouse' != 'null' then
    insert into members (
      org_id, first_name, last_name, full_name,
      email, phone, birth_month, birth_day, birth_year,
      education_level, education_other, preferred_communication,
      address_street, address_unit, address_city, address_state, address_zip, address_formatted,
      submission_type, membership_status
    ) values (
      p_org_id,
      p_payload->'spouse'->>'first_name',
      p_payload->'spouse'->>'last_name',
      coalesce(p_payload->'spouse'->>'first_name', '') || ' ' || coalesce(p_payload->'spouse'->>'last_name', ''),
      nullif(p_payload->'spouse'->>'email', ''),
      nullif(p_payload->'spouse'->>'phone', ''),
      case when p_payload->'spouse'->>'birth_month' = '' or p_payload->'spouse'->>'birth_month' is null then null
           else (p_payload->'spouse'->>'birth_month')::int end,
      case when p_payload->'spouse'->>'birth_day' = '' or p_payload->'spouse'->>'birth_day' is null then null
           else (p_payload->'spouse'->>'birth_day')::int end,
      case when p_payload->'spouse'->>'birth_year' = '' or p_payload->'spouse'->>'birth_year' is null then null
           else (p_payload->'spouse'->>'birth_year')::int end,
      nullif(p_payload->'spouse'->>'education_level', ''),
      nullif(p_payload->'spouse'->>'education_other', ''),
      case when p_payload->'spouse'->'preferred_communication' is not null
           then array(select jsonb_array_elements_text(p_payload->'spouse'->'preferred_communication'))
           else null end,
      nullif(p_payload->>'address_street', ''),
      nullif(p_payload->>'address_unit', ''),
      nullif(p_payload->>'address_city', ''),
      nullif(p_payload->>'address_state', ''),
      nullif(p_payload->>'address_zip', ''),
      nullif(p_payload->>'address_formatted', ''),
      'public_household',
      'active'
    )
    returning id into v_spouse_id;
    v_created_ids := v_created_ids || v_spouse_id;

    insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
    values (p_org_id, v_primary_id, v_spouse_id, 'spouse'),
           (p_org_id, v_spouse_id, v_primary_id, 'spouse');
  end if;

  -- 3. Insert children
  if p_payload->'children' is not null and jsonb_array_length(p_payload->'children') > 0 then
    for v_child in select * from jsonb_array_elements(p_payload->'children') loop
      insert into members (
        org_id, first_name, last_name, full_name,
        email, phone, birth_month, birth_day, birth_year,
        education_level, education_other,
        address_street, address_unit, address_city, address_state, address_zip, address_formatted,
        submission_type, membership_status
      ) values (
        p_org_id,
        v_child->>'first_name', v_child->>'last_name',
        coalesce(v_child->>'first_name', '') || ' ' || coalesce(v_child->>'last_name', ''),
        nullif(v_child->>'email', ''), nullif(v_child->>'phone', ''),
        case when v_child->>'birth_month' = '' or v_child->>'birth_month' is null then null else (v_child->>'birth_month')::int end,
        case when v_child->>'birth_day' = '' or v_child->>'birth_day' is null then null else (v_child->>'birth_day')::int end,
        case when v_child->>'birth_year' = '' or v_child->>'birth_year' is null then null else (v_child->>'birth_year')::int end,
        nullif(v_child->>'education_level', ''),
        nullif(v_child->>'education_other', ''),
        nullif(p_payload->>'address_street', ''),
        nullif(p_payload->>'address_unit', ''),
        nullif(p_payload->>'address_city', ''),
        nullif(p_payload->>'address_state', ''),
        nullif(p_payload->>'address_zip', ''),
        nullif(p_payload->>'address_formatted', ''),
        'public_child', 'active'
      )
      returning id into v_child_id;
      v_created_ids := v_created_ids || v_child_id;

      insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
      values (p_org_id, v_primary_id, v_child_id, 'parent'),
             (p_org_id, v_child_id, v_primary_id, 'child');

      if v_spouse_id is not null then
        insert into member_relationships (org_id, member_id, related_member_id, relationship_type)
        values (p_org_id, v_spouse_id, v_child_id, 'parent'),
               (p_org_id, v_child_id, v_spouse_id, 'child');
      end if;
    end loop;
  end if;

  return jsonb_build_object('ok', true, 'created_ids', to_jsonb(v_created_ids));
end;
$$;
