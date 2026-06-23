-- handle_new_staff: called after admin creates a staff auth user.
-- Inserts profile + user_roles rows atomically.
create or replace function public.handle_new_staff(
  p_user_id   uuid,
  p_org_id    uuid,
  p_full_name text,
  p_email     text,
  p_role_keys text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  -- Upsert profile (idempotent)
  insert into profiles (id, org_id, full_name, email, is_super_admin)
  values (p_user_id, p_org_id, p_full_name, p_email, false)
  on conflict (id) do nothing;

  -- Insert one user_roles row per key
  foreach v_key in array p_role_keys loop
    insert into user_roles (role_key, user_id, org_id)
    values (v_key, p_user_id, p_org_id)
    on conflict do nothing;
  end loop;
end;
$$;
