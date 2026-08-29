-- =============================================================================
-- Roles module: catalogue permissions, staff helpers, save/delete RPCs
-- =============================================================================
-- JWT callers still cannot write `roles` / `role_permissions` directly.
-- Create, update, and delete go through SECURITY DEFINER RPCs gated by
-- roles.create / roles.update / roles.delete.
--
-- Custom role names must not break clinic-staff detection: is_clinic_staff()
-- is "has a profile", and is_doctor() matches roles.name = 'doctor'.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Staff helpers (custom role names are valid)
-- -----------------------------------------------------------------------------

create or replace function public.is_clinic_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
  );
$$;

comment on function public.is_clinic_staff() is
  'True when the caller has a clinic profile, regardless of role name.';

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    inner join public.roles as clinic_role on clinic_role.id = profile.role_id
    where profile.id = (select auth.uid())
      and clinic_role.name = 'doctor'
  );
$$;

comment on function public.is_doctor() is
  'True when the caller''s clinic role is the built-in doctor role.';

drop function if exists public.current_user_role();

-- -----------------------------------------------------------------------------
-- Catalogue: roles.{list,create,update,delete} — doctor only by default
-- -----------------------------------------------------------------------------

insert into public.permissions (name)
values
  ('roles.list'),
  ('roles.create'),
  ('roles.update'),
  ('roles.delete')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select clinic_role.id, perm.id
from public.roles as clinic_role
cross join public.permissions as perm
where clinic_role.name = 'doctor'
  and perm.name in (
    'roles.list',
    'roles.create',
    'roles.update',
    'roles.delete'
  )
on conflict (role_id, permission_id) do nothing;

comment on column public.roles.name is
  'Unique role name. doctor and secretary are built-in and cannot be renamed or deleted.';

-- -----------------------------------------------------------------------------
-- save_clinic_role: create (p_id null) or update name + permission list
-- -----------------------------------------------------------------------------

create or replace function public.save_clinic_role(
  p_name text,
  p_permission_ids uuid[],
  p_id uuid default null
)
returns public.roles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.roles;
  v_ids uuid[];
  v_existing_name text;
begin
  if p_id is null then
    if not public.has_permission('roles.create') then
      raise exception using errcode = '42501', message = 'Not allowed';
    end if;
  else
    if not public.has_permission('roles.update') then
      raise exception using errcode = '42501', message = 'Not allowed';
    end if;
  end if;

  v_ids := coalesce(p_permission_ids, '{}'::uuid[]);

  if exists (
    select 1
    from pg_catalog.unnest(v_ids) as pid
    left join public.permissions as perm on perm.id = pid
    where perm.id is null
  ) then
    raise exception using errcode = '23503', message = 'Unknown permission';
  end if;

  if p_id is null then
    insert into public.roles (name)
    values (btrim(p_name))
    returning * into v_role;
  else
    select clinic_role.name into v_existing_name
    from public.roles as clinic_role
    where clinic_role.id = p_id;

    if v_existing_name is null then
      raise exception using errcode = 'P0002', message = 'Role not found';
    end if;

    if v_existing_name in ('doctor', 'secretary')
      and btrim(p_name) is distinct from v_existing_name then
      raise exception using errcode = 'P0001', message = 'Cannot rename built-in role';
    end if;

    update public.roles
    set name = btrim(p_name)
    where id = p_id
    returning * into v_role;

    delete from public.role_permissions
    where role_id = v_role.id;
  end if;

  insert into public.role_permissions (role_id, permission_id)
  select distinct v_role.id, pid
  from pg_catalog.unnest(v_ids) as pid
  where pid is not null;

  return v_role;
end;
$$;

comment on function public.save_clinic_role(text, uuid[], uuid) is
  'Creates or updates a clinic role and replaces its permission assignments.';

revoke all on function public.save_clinic_role(text, uuid[], uuid) from public;
grant execute on function public.save_clinic_role(text, uuid[], uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- delete_clinic_role: custom roles only, and only when no profile uses them
-- -----------------------------------------------------------------------------

create or replace function public.delete_clinic_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if not public.has_permission('roles.delete') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  select clinic_role.name into v_name
  from public.roles as clinic_role
  where clinic_role.id = p_id;

  if v_name is null then
    raise exception using errcode = 'P0002', message = 'Role not found';
  end if;

  if v_name in ('doctor', 'secretary') then
    raise exception using errcode = 'P0001', message = 'Cannot delete built-in role';
  end if;

  if exists (
    select 1
    from public.profiles as profile
    where profile.role_id = p_id
  ) then
    raise exception using errcode = '23503', message = 'Role is in use';
  end if;

  delete from public.roles
  where id = p_id;
end;
$$;

comment on function public.delete_clinic_role(uuid) is
  'Deletes a custom clinic role that is not assigned to any profile.';

revoke all on function public.delete_clinic_role(uuid) from public;
grant execute on function public.delete_clinic_role(uuid) to authenticated, service_role;
