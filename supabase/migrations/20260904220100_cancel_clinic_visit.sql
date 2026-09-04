-- Cancel a visit, and block further edits once it is canceled.

create or replace function public.cancel_clinic_visit(p_id uuid)
returns public.visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.visits;
begin
  if not public.has_permission('visits.update') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  update public.visits
  set status = 'canceled'
  where id = p_id
    and status is distinct from 'canceled'
  returning * into v_visit;

  if v_visit.id is null then
    if exists (select 1 from public.visits where id = p_id) then
      raise exception using errcode = '22023', message = 'Visit is canceled';
    end if;

    raise exception using errcode = 'P0002', message = 'Visit not found';
  end if;

  return v_visit;
end;
$$;

comment on function public.cancel_clinic_visit is
  'Marks a visit as canceled. Canceled visits cannot be examined or edited.';

revoke all on function public.cancel_clinic_visit(uuid) from public;

grant execute on function public.cancel_clinic_visit(uuid) to authenticated, service_role;

create or replace function public.prevent_canceled_visit_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'canceled'::public.visit_status then
    raise exception using errcode = '22023', message = 'Visit is canceled';
  end if;

  return new;
end;
$$;

comment on function public.prevent_canceled_visit_edits() is
  'Blocks updates to visits that have already been canceled.';

create trigger visits_prevent_canceled_edits
before update on public.visits
for each row
execute function public.prevent_canceled_visit_edits();
