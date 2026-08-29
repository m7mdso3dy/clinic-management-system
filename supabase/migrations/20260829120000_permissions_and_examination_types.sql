-- =============================================================================
-- Permissions catalogue + examination_types lookup
-- =============================================================================
-- `permissions` is the per-role, per-resource action list (create / update /
-- delete). RLS on other tables calls `has_permission()` so the UI cannot
-- grant more than the database allows.
--
-- JWT callers can read permissions but cannot insert/update/delete them —
-- changing grants is an administrator action (SQL editor / service role).
-- =============================================================================

create type public.permission_action as enum ('create', 'update', 'delete');

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  role public.user_role not null,
  resource text not null check (
    resource = btrim(resource)
    and char_length(resource) between 1 and 64
  ),
  action public.permission_action not null,
  unique (role, resource, action)
);

comment on table public.permissions is
  'Role grants for application resources. Seeded per module; not writable via the API.';
comment on column public.permissions.resource is
  'Stable key matching the table or module, e.g. examination_types.';

create index permissions_role_resource_idx on public.permissions (role, resource);

create or replace function public.has_permission(
  p_resource text,
  p_action public.permission_action
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.permissions perm
    where perm.role = public.current_user_role()
      and perm.resource = p_resource
      and perm.action = p_action
  );
$$;

comment on function public.has_permission(text, public.permission_action) is
  'True when the caller''s clinic role is granted the given resource action.';

revoke all on function public.has_permission(text, public.permission_action) from public;
grant execute on function public.has_permission(text, public.permission_action)
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- examination_types — fee lookup (name may be English or Arabic)
-- -----------------------------------------------------------------------------

create table public.examination_types (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  cost numeric(10, 2) not null check (cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.examination_types is
  'Lookup of examination kinds and their fees. Name may be English or Arabic.';
comment on column public.examination_types.cost is
  'Fee for this examination, in the clinic base currency.';

create unique index examination_types_name_lower_idx
  on public.examination_types (lower(btrim(name)));

create trigger examination_types_set_updated_at
before update on public.examination_types
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Seed: examination_types create / update / delete for both clinic roles
-- -----------------------------------------------------------------------------

insert into public.permissions (role, resource, action)
values
  ('doctor', 'examination_types', 'create'),
  ('doctor', 'examination_types', 'update'),
  ('doctor', 'examination_types', 'delete'),
  ('secretary', 'examination_types', 'create'),
  ('secretary', 'examination_types', 'update'),
  ('secretary', 'examination_types', 'delete');

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table public.permissions enable row level security;
alter table public.examination_types enable row level security;

revoke all on table public.permissions from anon, authenticated;
revoke all on table public.examination_types from anon, authenticated;

grant select on table public.permissions to authenticated;
grant select, insert, update, delete on table public.examination_types to authenticated;

create policy "Clinic staff can read permissions"
on public.permissions
for select
to authenticated
using (public.is_clinic_staff());

create policy "Clinic staff can read examination types"
on public.examination_types
for select
to authenticated
using (public.is_clinic_staff());

create policy "Staff with permission can create examination types"
on public.examination_types
for insert
to authenticated
with check (public.has_permission('examination_types', 'create'));

create policy "Staff with permission can update examination types"
on public.examination_types
for update
to authenticated
using (public.has_permission('examination_types', 'update'))
with check (public.has_permission('examination_types', 'update'));

create policy "Staff with permission can delete examination types"
on public.examination_types
for delete
to authenticated
using (public.has_permission('examination_types', 'delete'));
