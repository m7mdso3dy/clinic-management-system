-- =============================================================================
-- visits — one consultation record
-- =============================================================================
-- `on delete restrict` on both foreign keys: a patient or a staff member can
-- never be removed while clinical records still reference them.
-- =============================================================================

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete restrict,
  doctor_id uuid not null references public.profiles (id) on delete restrict,
  visit_date timestamptz not null default now(),
  symptoms text,
  diagnosis text,
  treatment text,
  notes text,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.visits is 'Consultation record. Editable by doctors only (see RLS).';
comment on column public.visits.amount is 'Fee charged for the visit, in the clinic base currency.';

create index visits_patient_id_idx on public.visits (patient_id);
create index visits_doctor_id_idx on public.visits (doctor_id);
create index visits_visit_date_idx on public.visits (visit_date desc);

create trigger visits_set_updated_at
before update on public.visits
for each row
execute function public.set_updated_at();
