-- =============================================================================
-- Permissions catalogue (id + name), assigned to roles separately
-- =============================================================================
-- Replaces the combined (role, resource, action) rows with:
--   * permissions        — the catalogue of named permissions
--   * role_permissions   — which roles currently hold which catalogue rows
--
-- JWT callers can read both tables but cannot change them.
-- =============================================================================

drop policy if exists "Staff with permission can create examination types"
  on public.examination_types;
drop policy if exists "Staff with permission can update examination types"
  on public.examination_types;
drop policy if exists "Staff with permission can delete examination types"
  on public.examination_types;
drop policy if exists "Clinic staff can read permissions"
  on public.permissions;

drop function if exists public.has_permission(text, public.permission_action);

drop table if exists public.permissions;

drop type if exists public.permission_action;

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (
    name = btrim(name)
    and char_length(name) between 1 and 128
  )
);

comment on table public.permissions is
  'Catalogue of named permissions. Roles receive these through role_permissions.';
comment on column public.permissions.name is
  'Stable unique key, e.g. examination_types.create.';

create table public.role_permissions (
  role public.user_role not null,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role, permission_id)
);

comment on table public.role_permissions is
  'Assignment of catalogue permissions to clinic roles.';

create index role_permissions_permission_id_idx
  on public.role_permissions (permission_id);

insert into public.permissions (name)
values
  ('examination_types.create'),
  ('examination_types.update'),
  ('examination_types.delete');

insert into public.role_permissions (role, permission_id)
select role_name.role, perm.id
from (
  values
    ('doctor'::public.user_role),
    ('secretary'::public.user_role)
) as role_name (role)
cross join public.permissions as perm
where perm.name in (
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
    from public.role_permissions rp
    inner join public.permissions p on p.id = rp.permission_id
    where rp.role = public.current_user_role()
      and p.name = p_name
  );
$$;

comment on function public.has_permission(text) is
  'True when the caller''s clinic role is assigned the named catalogue permission.';

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated, service_role;

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

revoke all on table public.permissions from anon, authenticated;
revoke all on table public.role_permissions from anon, authenticated;

grant select on table public.permissions to authenticated;
grant select on table public.role_permissions to authenticated;

create policy "Clinic staff can read permissions"
on public.permissions
for select
to authenticated
using (public.is_clinic_staff());

create policy "Clinic staff can read role permissions"
on public.role_permissions
for select
to authenticated
using (public.is_clinic_staff());

create policy "Staff with permission can create examination types"
on public.examination_types
for insert
to authenticated
with check (public.has_permission('examination_types.create'));

create policy "Staff with permission can update examination types"
on public.examination_types
for update
to authenticated
using (public.has_permission('examination_types.update'))
with check (public.has_permission('examination_types.update'));

create policy "Staff with permission can delete examination types"
on public.examination_types
for delete
to authenticated
using (public.has_permission('examination_types.delete'));
