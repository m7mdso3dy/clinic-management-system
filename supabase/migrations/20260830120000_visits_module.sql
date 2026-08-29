-- =============================================================================
-- Visits module: examination type, permissions, RLS
-- =============================================================================
-- Catalogue names:
--   visits.list    — see the visits directory
--   visits.view    — open a visit record
--   visits.create  — add a visit (UI in a later step)
--   visits.update  — edit a visit
--   visits.delete  — delete a visit
-- =============================================================================

alter table public.visits
  add column examination_type_id uuid references public.examination_types (id) on delete restrict;

comment on column public.visits.examination_type_id is
  'Examination performed during the visit.';

create index visits_examination_type_id_idx on public.visits (examination_type_id);

insert into public.permissions (name)
values
  ('visits.list'),
  ('visits.view'),
  ('visits.create'),
  ('visits.update'),
  ('visits.delete')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select clinic_role.id, perm.id
from public.roles as clinic_role
cross join public.permissions as perm
where clinic_role.name in ('doctor', 'secretary')
  and perm.name in (
    'visits.list',
    'visits.view',
    'visits.create',
    'visits.update',
    'visits.delete'
  )
on conflict (role_id, permission_id) do nothing;

drop policy if exists "Clinic staff can read visits" on public.visits;
drop policy if exists "Clinic staff can create visits" on public.visits;
drop policy if exists "Doctors can update visits" on public.visits;

grant delete on table public.visits to authenticated;

create policy "Staff with permission can list or view visits"
on public.visits
for select
to authenticated
using (
  public.has_permission('visits.list')
  or public.has_permission('visits.view')
);

create policy "Staff with permission can create visits"
on public.visits
for insert
to authenticated
with check (public.has_permission('visits.create'));

create policy "Staff with permission can update visits"
on public.visits
for update
to authenticated
using (public.has_permission('visits.update'))
with check (public.has_permission('visits.update'));

create policy "Staff with permission can delete visits"
on public.visits
for delete
to authenticated
using (public.has_permission('visits.delete'));
