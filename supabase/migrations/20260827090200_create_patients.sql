-- =============================================================================
-- patients — minimal demographic record
-- =============================================================================
-- Only the fields needed by the foundation. Clinical detail belongs to `visits`
-- and to future modules.
-- =============================================================================

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 160),
  phone text check (char_length(btrim(phone)) between 4 and 32),
  date_of_birth date check (date_of_birth >= '1900-01-01'::date),
  gender public.gender,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.patients is 'Patient directory for the clinic.';

create index patients_full_name_idx on public.patients (lower(full_name));
create index patients_phone_idx on public.patients (phone);

create trigger patients_set_updated_at
before update on public.patients
for each row
execute function public.set_updated_at();
