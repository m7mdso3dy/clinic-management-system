-- =============================================================================
-- profiles — application identity + role for every Supabase Auth user
-- =============================================================================
-- `auth.users` stays the source of truth for credentials. `profiles` holds the
-- clinic-specific data (display name, role) and is the table the app reads.
-- =============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 160),
  email text not null unique,
  role public.user_role not null default 'secretary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Clinic staff profile for each auth user. Role drives all authorization.';
comment on column public.profiles.email is
  'Denormalised copy of auth.users.email so staff lists can be queried directly.';

create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Role helpers
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so RLS policies can read the caller's role without causing
-- infinite recursion when the policy is attached to `profiles` itself.
-- -----------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid());
$$;

create or replace function public.is_doctor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'doctor'::public.user_role, false);
$$;

-- Any user that has a clinic profile (currently: doctor or secretary).
create or replace function public.is_clinic_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_role() is not null;
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_doctor() from public;
revoke all on function public.is_clinic_staff() from public;

grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.is_doctor() to authenticated, service_role;
grant execute on function public.is_clinic_staff() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Profile provisioning
-- -----------------------------------------------------------------------------
-- The role is deliberately NOT read from sign-up metadata: that would let any
-- user register as a doctor. New accounts always start as 'secretary' and are
-- promoted by an administrator (see README, "Manual Supabase setup").
--
-- Assumes email-based sign-up: profiles.email is NOT NULL, so a phone-only
-- account would fail here by design.
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'staff'), '@', 1)
    ),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Blocks self-promotion: role changes are rejected for any request that carries
-- an end-user JWT. Administrators (SQL editor / service role) have no auth.uid()
-- and are therefore allowed through.
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and (select auth.uid()) is not null then
    raise exception 'Profile role cannot be changed by application users';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_change
before update of role on public.profiles
for each row
execute function public.prevent_profile_role_change();
