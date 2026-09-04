-- =============================================================================
-- Split opening a visit from recording the examination.
-- opened  = patient, exam type, fee, and date only
-- completed = examination details have been saved at least once
-- =============================================================================

create type public.visit_status as enum ('opened', 'completed');

alter table public.visits
  add column status public.visit_status not null default 'completed';

comment on column public.visits.status is
  'opened: visit created without exam notes. completed: examination details have been saved.';

-- New visits start as opened. Existing rows stay completed (old all-in-one form).
alter table public.visits
  alter column status set default 'opened';

create index visits_status_visit_date_idx on public.visits (status, visit_date desc);

-- -----------------------------------------------------------------------------
-- Open a visit (front desk): patient, examination type, fee, date
-- -----------------------------------------------------------------------------

create or replace function public.open_clinic_visit(
  p_patient_id uuid,
  p_examination_type_id uuid,
  p_visit_date timestamptz,
  p_amount numeric
)
returns public.visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.visits;
begin
  if not public.has_permission('visits.create') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  insert into public.visits (
    patient_id,
    doctor_id,
    examination_type_id,
    visit_date,
    amount,
    status
  )
  values (
    p_patient_id,
    (select auth.uid()),
    p_examination_type_id,
    p_visit_date,
    coalesce(p_amount, 0),
    'opened'
  )
  returning * into v_visit;

  return v_visit;
end;
$$;

comment on function public.open_clinic_visit is
  'Creates a visit with patient, examination type, fee, and date. Examination details are recorded later.';

revoke all on function public.open_clinic_visit(uuid, uuid, timestamptz, numeric) from public;

grant execute on function public.open_clinic_visit(uuid, uuid, timestamptz, numeric)
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Saving examination details marks the visit completed
-- -----------------------------------------------------------------------------

create or replace function public.save_clinic_visit(
  p_patient_id uuid,
  p_examination_type_id uuid,
  p_visit_date timestamptz,
  p_amount numeric,
  p_heart_rate integer default null,
  p_blood_pressure_systolic integer default null,
  p_blood_pressure_diastolic integer default null,
  p_temperature numeric default null,
  p_weight_kg numeric default null,
  p_height_cm numeric default null,
  p_respiratory_rate integer default null,
  p_oxygen_saturation numeric default null,
  p_blood_glucose numeric default null,
  p_symptoms text default null,
  p_diagnosis text default null,
  p_treatment text default null,
  p_notes text default null,
  p_prescriptions jsonb default '[]'::jsonb,
  p_lab_orders jsonb default '[]'::jsonb,
  p_id uuid default null
)
returns public.visits
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.visits;
  v_prescriptions jsonb;
  v_lab_orders jsonb;
begin
  if p_id is null then
    raise exception using errcode = '22023', message = 'Visit id is required';
  end if;

  if not public.has_permission('visits.update') then
    raise exception using errcode = '42501', message = 'Not allowed';
  end if;

  v_prescriptions := coalesce(p_prescriptions, '[]'::jsonb);
  v_lab_orders := coalesce(p_lab_orders, '[]'::jsonb);

  if pg_catalog.jsonb_typeof(v_prescriptions) <> 'array'
    or pg_catalog.jsonb_typeof(v_lab_orders) <> 'array' then
    raise exception using errcode = '22P02', message = 'Invalid line items';
  end if;

  update public.visits
  set
    patient_id = p_patient_id,
    examination_type_id = p_examination_type_id,
    visit_date = p_visit_date,
    amount = coalesce(p_amount, 0),
    heart_rate = p_heart_rate,
    blood_pressure_systolic = p_blood_pressure_systolic,
    blood_pressure_diastolic = p_blood_pressure_diastolic,
    temperature = p_temperature,
    weight_kg = p_weight_kg,
    height_cm = p_height_cm,
    respiratory_rate = p_respiratory_rate,
    oxygen_saturation = p_oxygen_saturation,
    blood_glucose = p_blood_glucose,
    symptoms = nullif(btrim(coalesce(p_symptoms, '')), ''),
    diagnosis = nullif(btrim(coalesce(p_diagnosis, '')), ''),
    treatment = nullif(btrim(coalesce(p_treatment, '')), ''),
    notes = nullif(btrim(coalesce(p_notes, '')), ''),
    status = 'completed'
  where id = p_id
  returning * into v_visit;

  if v_visit.id is null then
    raise exception using errcode = 'P0002', message = 'Visit not found';
  end if;

  delete from public.visit_prescription_items where visit_id = v_visit.id;
  delete from public.visit_lab_orders where visit_id = v_visit.id;

  insert into public.visit_prescription_items (
    visit_id,
    sort_order,
    medication_name,
    dosage,
    frequency,
    duration,
    instructions
  )
  select
    v_visit.id,
    (item.ordinality - 1)::integer,
    btrim(item.elem ->> 'medication_name'),
    nullif(btrim(coalesce(item.elem ->> 'dosage', '')), ''),
    nullif(btrim(coalesce(item.elem ->> 'frequency', '')), ''),
    nullif(btrim(coalesce(item.elem ->> 'duration', '')), ''),
    nullif(btrim(coalesce(item.elem ->> 'instructions', '')), '')
  from pg_catalog.jsonb_array_elements(v_prescriptions) with ordinality as item (elem, ordinality)
  where btrim(coalesce(item.elem ->> 'medication_name', '')) <> '';

  insert into public.visit_lab_orders (
    visit_id,
    sort_order,
    analysis_name,
    notes
  )
  select
    v_visit.id,
    (item.ordinality - 1)::integer,
    btrim(item.elem ->> 'analysis_name'),
    nullif(btrim(coalesce(item.elem ->> 'notes', '')), '')
  from pg_catalog.jsonb_array_elements(v_lab_orders) with ordinality as item (elem, ordinality)
  where btrim(coalesce(item.elem ->> 'analysis_name', '')) <> '';

  return v_visit;
end;
$$;

comment on function public.save_clinic_visit is
  'Updates examination details for an existing visit and marks it completed.';
