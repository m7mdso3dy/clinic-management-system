-- Daily visit numbers: each calendar day starts again at 1.

alter table public.visits
  add column visit_day date,
  add column daily_number integer;

update public.visits
set visit_day = (visit_date at time zone 'Africa/Cairo')::date;

with numbered as (
  select
    id,
    row_number() over (
      partition by visit_day
      order by created_at asc, id asc
    )::integer as daily_number
  from public.visits
)
update public.visits as visit
set daily_number = numbered.daily_number
from numbered
where visit.id = numbered.id;

alter table public.visits
  alter column visit_day set not null,
  alter column daily_number set not null,
  add constraint visits_daily_number_positive check (daily_number >= 1),
  add constraint visits_visit_day_daily_number_key unique (visit_day, daily_number);

create index visits_visit_day_daily_number_idx
  on public.visits (visit_day, daily_number);

comment on column public.visits.visit_day is
  'Clinic calendar day used for daily visit numbering.';
comment on column public.visits.daily_number is
  'Queue number for the visit on visit_day. Restarts at 1 each day.';

drop function if exists public.open_clinic_visit(uuid, uuid, timestamptz, numeric);

create function public.open_clinic_visit(
  p_patient_id uuid,
  p_examination_type_id uuid,
  p_visit_date timestamptz,
  p_amount numeric,
  p_visit_day date default null
)
returns public.visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.visits;
  v_day date;
  v_number integer;
begin
  if not public.has_permission('visits.create') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  v_day := coalesce(
    p_visit_day,
    (p_visit_date at time zone 'Africa/Cairo')::date
  );

  perform pg_catalog.pg_advisory_xact_lock(
    8421901,
    pg_catalog.hashtext(v_day::text)
  );

  select coalesce(pg_catalog.max(daily_number), 0) + 1
  into v_number
  from public.visits
  where visit_day = v_day;

  insert into public.visits (
    patient_id,
    doctor_id,
    examination_type_id,
    visit_date,
    visit_day,
    daily_number,
    amount,
    status
  )
  values (
    p_patient_id,
    (select auth.uid()),
    p_examination_type_id,
    p_visit_date,
    v_day,
    v_number,
    coalesce(p_amount, 0),
    'opened'
  )
  returning * into v_visit;

  return v_visit;
end;
$$;

comment on function public.open_clinic_visit is
  'Creates a visit with patient, examination type, fee, date, and the next daily queue number.';

revoke all on function public.open_clinic_visit(uuid, uuid, timestamptz, numeric, date) from public;

grant execute on function public.open_clinic_visit(uuid, uuid, timestamptz, numeric, date)
  to authenticated, service_role;
