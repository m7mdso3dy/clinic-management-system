-- Record which clinic days the doctor started, and close leftover queue items
-- on the latest started day and earlier. Future / unstarted days are left alone.

create table public.clinic_days (
  visit_day date primary key,
  started_at timestamptz not null default now(),
  started_by uuid not null references public.profiles (id) on delete restrict,
  ended_at timestamptz,
  ended_by uuid references public.profiles (id) on delete restrict
);

comment on table public.clinic_days is
  'Clinic days the doctor has started. End-of-day cleanup uses the latest started day.';

alter table public.clinic_days enable row level security;

insert into public.clinic_days (visit_day, started_at, started_by)
select
  visit.visit_day,
  pg_catalog.min(visit.updated_at),
  (
    select completed.doctor_id
    from public.visits as completed
    where completed.visit_day = visit.visit_day
      and completed.status = 'completed'
    order by completed.updated_at asc, completed.id asc
    limit 1
  )
from public.visits as visit
where visit.status = 'completed'
group by visit.visit_day
on conflict (visit_day) do nothing;

create or replace function public.mark_clinic_day_started(p_visit_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  v_user := (select auth.uid());

  if v_user is null then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  insert into public.clinic_days (visit_day, started_at, started_by)
  values (p_visit_day, pg_catalog.now(), v_user)
  on conflict (visit_day) do nothing;
end;
$$;

comment on function public.mark_clinic_day_started(date) is
  'Records that the doctor started examinations on this clinic day.';

revoke all on function public.mark_clinic_day_started(date) from public;

create or replace function public.start_clinic_day(p_visit_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if not public.has_permission('visits.update') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  v_user := (select auth.uid());

  if v_user is null then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  insert into public.clinic_days (visit_day, started_at, started_by)
  values (p_visit_day, pg_catalog.now(), v_user)
  on conflict (visit_day) do update
  set
    ended_at = null,
    ended_by = null;
end;
$$;

comment on function public.start_clinic_day(date) is
  'Marks a clinic day as started when the doctor begins the queue.';

revoke all on function public.start_clinic_day(date) from public;

grant execute on function public.start_clinic_day(date) to authenticated, service_role;

create or replace function public.visits_mark_day_started()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.mark_clinic_day_started(new.visit_day);
  return new;
end;
$$;

create trigger visits_mark_day_started
after update of status on public.visits
for each row
when (new.status = 'completed'::public.visit_status)
execute function public.visits_mark_day_started();

create or replace function public.prevent_canceled_visit_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'canceled'::public.visit_status then
    if new.status is distinct from 'canceled'::public.visit_status
      or (to_jsonb(new) - 'daily_number' - 'updated_at')
        is distinct from (to_jsonb(old) - 'daily_number' - 'updated_at')
    then
      raise exception using errcode = '22023', message = 'Visit is canceled';
    end if;

    return new;
  end if;

  if old.status = 'held'::public.visit_status
    and new.status is distinct from 'held'::public.visit_status
    and new.status is distinct from 'opened'::public.visit_status
    and new.status is distinct from 'canceled'::public.visit_status then
    raise exception using errcode = '22023', message = 'Held visit cannot be examined';
  end if;

  return new;
end;
$$;

comment on function public.prevent_canceled_visit_edits() is
  'Blocks edits to canceled visits except queue-number reshuffles, and blocks examining a held visit until it is returned to the queue or canceled at end of day.';

create or replace function public.end_clinic_day()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_latest date;
  v_count integer;
begin
  if not public.has_permission('visits.update') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  v_user := (select auth.uid());

  if v_user is null then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(8421902);

  select pg_catalog.max(visit_day)
  into v_latest
  from public.clinic_days;

  if v_latest is null then
    raise exception using errcode = 'P0002', message = 'No clinic day has been started';
  end if;

  update public.visits
  set status = 'canceled'
  where visit_day <= v_latest
    and status in ('opened'::public.visit_status, 'held'::public.visit_status);

  get diagnostics v_count = row_count;

  update public.clinic_days
  set
    ended_at = pg_catalog.now(),
    ended_by = v_user
  where visit_day <= v_latest
    and ended_at is null;

  return v_count;
end;
$$;

comment on function public.end_clinic_day() is
  'Cancels unstarted and held visits on the latest started clinic day and earlier. Future and unstarted later days are not changed.';

revoke all on function public.end_clinic_day() from public;

grant execute on function public.end_clinic_day() to authenticated, service_role;
