-- =============================================================================
-- edit_requests — secretary -> doctor approval workflow (structure only)
-- =============================================================================
-- Stores the requested change as a JSONB diff. Applying an approved diff to the
-- target visit is NOT implemented yet; it will be a SECURITY DEFINER function
-- in a later migration so the change is atomic and auditable.
-- =============================================================================

create table public.edit_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles (id) on delete restrict,
  visit_id uuid not null references public.visits (id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 3 and 1000),
  old_data jsonb not null default '{}'::jsonb check (jsonb_typeof(old_data) = 'object'),
  new_data jsonb not null default '{}'::jsonb check (jsonb_typeof(new_data) = 'object'),
  status public.edit_request_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),

  -- A request is either untouched, or fully reviewed (who + when).
  constraint edit_requests_review_consistency check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (status <> 'pending' and reviewed_by is not null and reviewed_at is not null)
  )
);

comment on table public.edit_requests is
  'Change requests raised against a visit, awaiting doctor approval.';
comment on column public.edit_requests.old_data is
  'Snapshot of the affected visit fields before the requested change.';
comment on column public.edit_requests.new_data is
  'Requested values for the affected visit fields.';

create index edit_requests_visit_id_idx on public.edit_requests (visit_id);
create index edit_requests_requested_by_idx on public.edit_requests (requested_by);
create index edit_requests_pending_idx on public.edit_requests (created_at desc)
where status = 'pending';
