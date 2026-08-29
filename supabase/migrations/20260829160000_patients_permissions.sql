-- =============================================================================
-- Patients module permissions + RLS
-- =============================================================================
-- Catalogue names:
--   patients.list    — see the patient directory
--   patients.view    — open a patient record
--   patients.create  — add a patient
--   patients.update  — edit patient data
--   patients.delete  — delete a patient
-- =============================================================================

insert into public.permissions (name)
values
  ('patients.list'),
  ('patients.view'),
  ('patients.create'),
  ('patients.update'),
  ('patients.delete')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select clinic_role.id, perm.id
from public.roles as clinic_role
cross join public.permissions as perm
where clinic_role.name in ('doctor', 'secretary')
  and perm.name in (
    'patients.list',
    'patients.view',
    'patients.create',
    'patients.update',
    'patients.delete'
  )
on conflict (role_id, permission_id) do nothing;

drop policy if exists "Clinic staff can read patients" on public.patients;
drop policy if exists "Clinic staff can create patients" on public.patients;
drop policy if exists "Clinic staff can update patients" on public.patients;

grant delete on table public.patients to authenticated;

create policy "Staff with permission can list or view patients"
on public.patients
for select
to authenticated
using (
  public.has_permission('patients.list')
  or public.has_permission('patients.view')
);

create policy "Staff with permission can create patients"
on public.patients
for insert
to authenticated
with check (public.has_permission('patients.create'));

create policy "Staff with permission can update patients"
on public.patients
for update
to authenticated
using (public.has_permission('patients.update'))
with check (public.has_permission('patients.update'));

create policy "Staff with permission can delete patients"
on public.patients
for delete
to authenticated
using (public.has_permission('patients.delete'));
