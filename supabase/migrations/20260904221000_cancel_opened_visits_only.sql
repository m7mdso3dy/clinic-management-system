-- Only unstarted (opened) visits can be canceled.

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
    and status = 'opened'
  returning * into v_visit;

  if v_visit.id is null then
    if not exists (select 1 from public.visits where id = p_id) then
      raise exception using errcode = 'P0002', message = 'Visit not found';
    end if;

    raise exception using errcode = '22023', message = 'Visit cannot be canceled';
  end if;

  return v_visit;
end;
$$;

comment on function public.cancel_clinic_visit is
  'Cancels a visit only if the examination has not been started.';
