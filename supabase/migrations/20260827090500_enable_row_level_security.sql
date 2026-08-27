-- =============================================================================
-- Row Level Security — initial foundation
-- =============================================================================
-- Principles applied here:
--   * RLS is enabled on every application table.
--   * `anon` gets no access at all; every policy targets `authenticated`.
--   * Being authenticated is not enough — the caller must also have a clinic
--     profile (`public.is_clinic_staff()`).
--   * Table privileges are granted to match the policies (least privilege), so
--     an accidentally permissive policy cannot grant more than intended.
--
-- Workflow rule already encoded at the database level:
--   a secretary can INSERT visits but cannot UPDATE them, which is what forces
--   changes to go through `edit_requests`.
--
-- INTENTIONALLY DEFERRED (do not treat the absence as an oversight):
--   * DELETE on every table. No grant, no policy — nothing can be deleted
--     through the API. Soft-delete/archival will be designed later.
--   * Applying an approved edit_request to its visit. Needs a SECURITY DEFINER
--     function so the update is atomic; until then approval only flips status.
--   * Per-doctor data partitioning (doctors currently read all clinic data).
--   * Validating that visits.doctor_id points at a profile whose role is
--     'doctor' (currently only the foreign key is enforced).
--   * Finer-grained secretary limits on patients (e.g. edit window, ownership).
--   * Cancelling / withdrawing an own pending edit_request.
--   * Role assignment from the UI. Promoting a secretary to doctor is an
--     administrator action (see README) and is blocked for JWT callers by
--     `public.prevent_profile_role_change()`.
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.edit_requests enable row level security;

-- -----------------------------------------------------------------------------
-- Table privileges
-- -----------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.patients from anon, authenticated;
revoke all on table public.visits from anon, authenticated;
revoke all on table public.edit_requests from anon, authenticated;

-- profiles: rows are created by the on_auth_user_created trigger, never by the client.
grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.patients to authenticated;
grant select, insert, update on table public.visits to authenticated;
grant select, insert, update on table public.edit_requests to authenticated;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

create policy "Staff can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

-- Doctors need the staff directory (assigning visits, reviewing requests).
create policy "Doctors can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_doctor());

-- Role changes are rejected by the prevent_profile_role_change trigger.
create policy "Staff can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- -----------------------------------------------------------------------------
-- patients
-- -----------------------------------------------------------------------------

create policy "Clinic staff can read patients"
on public.patients
for select
to authenticated
using (public.is_clinic_staff());

create policy "Clinic staff can create patients"
on public.patients
for insert
to authenticated
with check (public.is_clinic_staff());

create policy "Clinic staff can update patients"
on public.patients
for update
to authenticated
using (public.is_clinic_staff())
with check (public.is_clinic_staff());

-- -----------------------------------------------------------------------------
-- visits
-- -----------------------------------------------------------------------------

create policy "Clinic staff can read visits"
on public.visits
for select
to authenticated
using (public.is_clinic_staff());

create policy "Clinic staff can create visits"
on public.visits
for insert
to authenticated
with check (public.is_clinic_staff());

-- No UPDATE policy for secretaries: they must raise an edit_request instead.
create policy "Doctors can update visits"
on public.visits
for update
to authenticated
using (public.is_doctor())
with check (public.is_doctor());

-- -----------------------------------------------------------------------------
-- edit_requests
-- -----------------------------------------------------------------------------

create policy "Staff can read their own edit requests"
on public.edit_requests
for select
to authenticated
using ((select auth.uid()) = requested_by);

create policy "Doctors can read all edit requests"
on public.edit_requests
for select
to authenticated
using (public.is_doctor());

-- A request always starts unreviewed and is always attributed to its author.
create policy "Clinic staff can raise edit requests"
on public.edit_requests
for insert
to authenticated
with check (
  public.is_clinic_staff()
  and (select auth.uid()) = requested_by
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

-- Only doctors review, and only by stamping themselves as the reviewer.
create policy "Doctors can review edit requests"
on public.edit_requests
for update
to authenticated
using (public.is_doctor() and status = 'pending')
with check (
  public.is_doctor()
  and status <> 'pending'
  and (select auth.uid()) = reviewed_by
);
