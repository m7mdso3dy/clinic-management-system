-- =============================================================================
-- Visit clinical details: vitals, extra notes (visits.notes), Rx, lab orders
-- =============================================================================

alter table public.visits
  add column heart_rate integer check (heart_rate is null or heart_rate between 20 and 300),
  add column blood_pressure_systolic integer check (
    blood_pressure_systolic is null or blood_pressure_systolic between 40 and 250
  ),
  add column blood_pressure_diastolic integer check (
    blood_pressure_diastolic is null or blood_pressure_diastolic between 20 and 200
  ),
  add column temperature numeric(4, 1) check (temperature is null or temperature between 30 and 45),
  add column weight_kg numeric(5, 2) check (weight_kg is null or weight_kg between 0.5 and 400),
  add column height_cm numeric(5, 1) check (height_cm is null or height_cm between 30 and 250),
  add column respiratory_rate integer check (
    respiratory_rate is null or respiratory_rate between 5 and 80
  ),
  add column oxygen_saturation numeric(4, 1) check (
    oxygen_saturation is null or oxygen_saturation between 50 and 100
  ),
  add column blood_glucose numeric(6, 1) check (
    blood_glucose is null or blood_glucose between 20 and 800
  );

comment on column public.visits.heart_rate is 'Pulse in beats per minute.';
comment on column public.visits.blood_pressure_systolic is 'Systolic blood pressure in mmHg.';
comment on column public.visits.blood_pressure_diastolic is 'Diastolic blood pressure in mmHg.';
comment on column public.visits.temperature is 'Body temperature in Celsius.';
comment on column public.visits.weight_kg is 'Body weight in kilograms.';
comment on column public.visits.height_cm is 'Body height in centimetres.';
comment on column public.visits.respiratory_rate is 'Breaths per minute.';
comment on column public.visits.oxygen_saturation is 'SpO2 percentage.';
comment on column public.visits.blood_glucose is 'Blood glucose in mg/dL.';
comment on column public.visits.notes is 'Free-text extra findings recorded by the clinician.';

-- -----------------------------------------------------------------------------
-- Prescription line items
-- -----------------------------------------------------------------------------

create table public.visit_prescription_items (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  sort_order integer not null default 0,
  medication_name text not null check (
    medication_name = btrim(medication_name)
    and char_length(medication_name) between 1 and 160
  ),
  dosage text check (dosage is null or char_length(btrim(dosage)) between 1 and 80),
  frequency text check (frequency is null or char_length(btrim(frequency)) between 1 and 80),
  duration text check (duration is null or char_length(btrim(duration)) between 1 and 80),
  instructions text check (
    instructions is null or char_length(btrim(instructions)) between 1 and 500
  )
);

create index visit_prescription_items_visit_id_idx
  on public.visit_prescription_items (visit_id, sort_order);

comment on table public.visit_prescription_items is
  'Medicines prescribed during a visit, printed for the patient.';

alter table public.visit_prescription_items enable row level security;

revoke all on table public.visit_prescription_items from anon, authenticated;
grant select, insert, update, delete on table public.visit_prescription_items to authenticated;

create policy "Staff with permission can read visit prescriptions"
on public.visit_prescription_items
for select
to authenticated
using (
  public.has_permission('visits.list')
  or public.has_permission('visits.view')
);

create policy "Staff with permission can add visit prescriptions"
on public.visit_prescription_items
for insert
to authenticated
with check (
  public.has_permission('visits.create')
  or public.has_permission('visits.update')
);

create policy "Staff with permission can update visit prescriptions"
on public.visit_prescription_items
for update
to authenticated
using (public.has_permission('visits.update'))
with check (public.has_permission('visits.update'));

create policy "Staff with permission can delete visit prescriptions"
on public.visit_prescription_items
for delete
to authenticated
using (
  public.has_permission('visits.update')
  or public.has_permission('visits.delete')
);

-- -----------------------------------------------------------------------------
-- Lab analysis orders
-- -----------------------------------------------------------------------------

create table public.visit_lab_orders (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  sort_order integer not null default 0,
  analysis_name text not null check (
    analysis_name = btrim(analysis_name)
    and char_length(analysis_name) between 1 and 160
  ),
  notes text check (notes is null or char_length(btrim(notes)) between 1 and 500)
);

create index visit_lab_orders_visit_id_idx
  on public.visit_lab_orders (visit_id, sort_order);

comment on table public.visit_lab_orders is
  'Laboratory analyses requested during a visit, printed for the patient.';

alter table public.visit_lab_orders enable row level security;

revoke all on table public.visit_lab_orders from anon, authenticated;
grant select, insert, update, delete on table public.visit_lab_orders to authenticated;

create policy "Staff with permission can read visit lab orders"
on public.visit_lab_orders
for select
to authenticated
using (
  public.has_permission('visits.list')
  or public.has_permission('visits.view')
);

create policy "Staff with permission can add visit lab orders"
on public.visit_lab_orders
for insert
to authenticated
with check (
  public.has_permission('visits.create')
  or public.has_permission('visits.update')
);

create policy "Staff with permission can update visit lab orders"
on public.visit_lab_orders
for update
to authenticated
using (public.has_permission('visits.update'))
with check (public.has_permission('visits.update'));

create policy "Staff with permission can delete visit lab orders"
on public.visit_lab_orders
for delete
to authenticated
using (
  public.has_permission('visits.update')
  or public.has_permission('visits.delete')
);

-- -----------------------------------------------------------------------------
-- Atomic create/update of a visit and its Rx / lab lists
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
    if not public.has_permission('visits.create') then
      raise exception using errcode = '42501', message = 'Not allowed';
    end if;
  else
    if not public.has_permission('visits.update') then
      raise exception using errcode = '42501', message = 'Not allowed';
    end if;
  end if;

  v_prescriptions := coalesce(p_prescriptions, '[]'::jsonb);
  v_lab_orders := coalesce(p_lab_orders, '[]'::jsonb);

  if pg_catalog.jsonb_typeof(v_prescriptions) <> 'array'
    or pg_catalog.jsonb_typeof(v_lab_orders) <> 'array' then
    raise exception using errcode = '22P02', message = 'Invalid line items';
  end if;

  if p_id is null then
    insert into public.visits (
      patient_id,
      doctor_id,
      examination_type_id,
      visit_date,
      amount,
      heart_rate,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      temperature,
      weight_kg,
      height_cm,
      respiratory_rate,
      oxygen_saturation,
      blood_glucose,
      symptoms,
      diagnosis,
      treatment,
      notes
    )
    values (
      p_patient_id,
      (select auth.uid()),
      p_examination_type_id,
      p_visit_date,
      coalesce(p_amount, 0),
      p_heart_rate,
      p_blood_pressure_systolic,
      p_blood_pressure_diastolic,
      p_temperature,
      p_weight_kg,
      p_height_cm,
      p_respiratory_rate,
      p_oxygen_saturation,
      p_blood_glucose,
      nullif(btrim(coalesce(p_symptoms, '')), ''),
      nullif(btrim(coalesce(p_diagnosis, '')), ''),
      nullif(btrim(coalesce(p_treatment, '')), ''),
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    returning * into v_visit;
  else
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
      notes = nullif(btrim(coalesce(p_notes, '')), '')
    where id = p_id
    returning * into v_visit;

    if v_visit.id is null then
      raise exception using errcode = 'P0002', message = 'Visit not found';
    end if;

    delete from public.visit_prescription_items where visit_id = v_visit.id;
    delete from public.visit_lab_orders where visit_id = v_visit.id;
  end if;

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
  'Creates or updates a visit and replaces its prescription and lab-order lists.';

revoke all on function public.save_clinic_visit(
  uuid, uuid, timestamptz, numeric, integer, integer, integer, numeric, numeric, numeric,
  integer, numeric, numeric, text, text, text, text, jsonb, jsonb, uuid
) from public;

grant execute on function public.save_clinic_visit(
  uuid, uuid, timestamptz, numeric, integer, integer, integer, numeric, numeric, numeric,
  integer, numeric, numeric, text, text, text, text, jsonb, jsonb, uuid
) to authenticated, service_role;
