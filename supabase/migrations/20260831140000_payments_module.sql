-- =============================================================================
-- Payments module: daily visit fees
-- =============================================================================
-- Payments are the visit `amount` values for a chosen calendar day.
-- Catalogue name:
--   payments.list — open the payments page and read visit fees for that day
-- =============================================================================

insert into public.permissions (name)
values ('payments.list')
on conflict (name) do nothing;

insert into public.role_permissions (role_id, permission_id)
select clinic_role.id, perm.id
from public.roles as clinic_role
cross join public.permissions as perm
where clinic_role.name in ('doctor', 'secretary')
  and perm.name = 'payments.list'
on conflict (role_id, permission_id) do nothing;

drop policy if exists "Staff with permission can list or view visits" on public.visits;

create policy "Staff with permission can list or view visits"
on public.visits
for select
to authenticated
using (
  public.has_permission('visits.list')
  or public.has_permission('visits.view')
  or public.has_permission('payments.list')
);
