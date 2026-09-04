-- Reenqueue after the visit currently being seen (not only after completed ones).
-- Example: held as 3, now serving 7 (still opened) → skip 8, 9, 10 → number 11.
-- Also allow daily_number changes on canceled visits so the queue can reshuffle.

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
    and new.status is distinct from 'opened'::public.visit_status then
    raise exception using errcode = '22023', message = 'Held visit cannot be examined';
  end if;

  return new;
end;
$$;

comment on function public.prevent_canceled_visit_edits() is
  'Blocks edits to canceled visits except queue-number reshuffles, and blocks examining a held visit until it is returned to the queue.';

create or replace function public.reenqueue_held_visit(p_id uuid)
returns public.visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.visits;
  v_day date;
  v_last_completed integer;
  v_current integer;
  v_third integer;
  v_new integer;
begin
  if not public.has_permission('visits.update') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  select * into v_visit from public.visits where id = p_id;

  if v_visit.id is null then
    raise exception using errcode = 'P0002', message = 'Visit not found';
  end if;

  if v_visit.status is distinct from 'held' then
    raise exception using errcode = '22023', message = 'Visit is not held';
  end if;

  v_day := v_visit.visit_day;

  perform pg_catalog.pg_advisory_xact_lock(
    8421901,
    pg_catalog.hashtext(v_day::text)
  );

  select coalesce(pg_catalog.max(daily_number), 0)
  into v_last_completed
  from public.visits
  where visit_day = v_day
    and status = 'completed';

  -- Current turn: the opened visit being seen (or next up), else last completed.
  select coalesce(pg_catalog.min(daily_number), v_last_completed)
  into v_current
  from public.visits
  where visit_day = v_day
    and status = 'opened'
    and daily_number > v_last_completed;

  select daily_number
  into v_third
  from public.visits
  where visit_day = v_day
    and status = 'opened'
    and daily_number > v_current
    and id <> p_id
  order by daily_number
  offset 2
  limit 1;

  if v_third is not null then
    v_new := v_third + 1;
  else
    select coalesce(pg_catalog.max(daily_number), 0) + 1
    into v_new
    from public.visits
    where visit_day = v_day
      and id <> p_id;
  end if;

  update public.visits
  set daily_number = daily_number + 1000000
  where id = p_id;

  update public.visits
  set daily_number = daily_number + 1000000
  where visit_day = v_day
    and id <> p_id
    and daily_number >= v_new;

  update public.visits
  set daily_number = daily_number - 1000000 + 1
  where visit_day = v_day
    and id <> p_id
    and daily_number >= v_new + 1000000;

  update public.visits
  set
    daily_number = v_new,
    status = 'opened'
  where id = p_id
  returning * into v_visit;

  return v_visit;
end;
$$;

comment on function public.reenqueue_held_visit is
  'Returns a held visit three opened visits after the current turn, or last if fewer remain.';
