-- =============================================================================
-- roles table + examination_types.list permission
-- =============================================================================
-- `roles` is the clinic role catalogue (doctor, secretary for now).
-- Each role's permission list lives in `role_permissions` (role_id, permission_id).
-- `profiles.role` (enum) is replaced by `profiles.role_id`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- roles
-- -----------------------------------------------------------------------------

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (
    name = btrim(name)
    and char_length(name) between 1 and 64
  )
);

comment on table public.roles is
  'Clinic roles. Each role is assigned a list of permissions via role_permissions.';
comment on column public.roles.name is
  'Stable unique key. Currently doctor and secretary.';

insert into public.roles (name)
values ('doctor'), ('secretary');

alter table public.roles enable row level security;

revoke all on table public.roles from anon, authenticated;
grant select on table public.roles to authenticated;

create policy "Clinic staff can read roles"
on public.roles
for select
to authenticated
using (public.is_clinic_staff());

-- -----------------------------------------------------------------------------
-- profiles: enum role → roles.id
-- -----------------------------------------------------------------------------

drop trigger if exists profiles_prevent_role_change on public.profiles;

alter table public.profiles
  add column role_id uuid references public.roles (id) on delete restrict;

update public.profiles as profile
set role_id = clinic_role.id
from public.roles as clinic_role
where clinic_role.name = profile.role::text;

alter table public.profiles
  alter column role_id set not null;

drop index if exists profiles_role_idx;

alter table public.profiles
  drop column role;

create index profiles_role_id_idx on public.profiles (role_id);

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role_id is distinct from old.role_id and (select auth.uid()) is not null then
    raise exception 'Profile role cannot be changed by application users';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_change
before update of role_id on public.profiles
for each row
execute function public.prevent_profile_role_change();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select clinic_role.name::public.user_role
  from public.profiles as profile
  inner join public.roles as clinic_role on clinic_role.id = profile.role_id
  where profile.id = (select auth.uid());
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role_id)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'staff'), '@', 1)
    ),
    new.email,
    (select clinic_role.id from public.roles as clinic_role where clinic_role.name = 'secretary')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- role_permissions: list of permissions per role
-- -----------------------------------------------------------------------------

drop policy if exists "Clinic staff can read role permissions"
  on public.role_permissions;

drop table public.role_permissions;

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

comment on table public.role_permissions is
  'The list of catalogue permissions assigned to each role.';

create index role_permissions_permission_id_idx
  on public.role_permissions (permission_id);

alter table public.role_permissions enable row level security;

revoke all on table public.role_permissions from anon, authenticated;
grant select on table public.role_permissions to authenticated;

create policy "Clinic staff can read role permissions"
on public.role_permissions
for select
to authenticated
using (public.is_clinic_staff());

-- -----------------------------------------------------------------------------
-- examination_types.list + re-assign role permission lists
-- -----------------------------------------------------------------------------

insert into public.permissions (name)
values ('examination_types.list')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select clinic_role.id, perm.id
from public.roles as clinic_role
cross join public.permissions as perm
where clinic_role.name in ('doctor', 'secretary')
  and perm.name in (
    'examination_types.list',
    'examination_types.create',
    'examination_types.update',
    'examination_types.delete'
  );

create or replace function public.has_permission(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_permissions as assignment
    inner join public.permissions as perm on perm.id = assignment.permission_id
    inner join public.profiles as profile on profile.role_id = assignment.role_id
    where profile.id = (select auth.uid())
      and perm.name = p_name
  );
$$;

drop policy if exists "Clinic staff can read examination types"
  on public.examination_types;

create policy "Staff with permission can list examination types"
on public.examination_types
for select
to authenticated
using (public.has_permission('examination_types.list'));
