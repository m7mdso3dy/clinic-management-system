-- =============================================================================
-- Clinic Management System — foundation types and shared helpers
-- =============================================================================
-- Enum types are used instead of free-text columns so that the generated
-- TypeScript types (`npm run db:types`) expose exact string unions.
-- =============================================================================

create type public.user_role as enum ('doctor', 'secretary');

create type public.gender as enum ('male', 'female', 'other');

create type public.edit_request_status as enum ('pending', 'approved', 'rejected');

-- Keeps updated_at accurate regardless of what the client sends.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger function: stamps updated_at on every UPDATE.';
