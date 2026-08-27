# Clinic Management System

A small, production-oriented clinic management application for a doctor and a secretary.

> **Status: foundation only.** This repository currently contains the project skeleton,
> the Supabase integration, the database schema with row level security, and the
> authentication/role plumbing. **None of the clinic workflows are implemented yet** —
> there is no patient, visit, payment, dashboard, reporting or approval UI.

## Tech stack

| Layer   | Choice                                           |
| ------- | ------------------------------------------------ |
| UI      | React 19, TypeScript (strict), Vite              |
| Styling | Tailwind CSS v4, shadcn/ui (Radix), lucide-react |
| Routing | React Router                                     |
| State   | React Context + custom hooks (no Redux)          |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security)  |
| Tooling | ESLint (type-aware), Prettier, Supabase CLI      |

There is no custom Node.js/Express backend — Supabase is the backend.

## Architecture

```
React UI (components, pages, layouts)
    ↓
Hooks / Context (src/hooks, src/stores)
    ↓
Services (src/services)
    ↓
Supabase client (src/services/supabase/client.ts)
    ↓
PostgreSQL + Row Level Security
```

Rules the codebase follows:

- Components never import the Supabase client; only services do.
- Business logic lives in services and hooks, not in JSX.
- Authentication state has exactly one owner: `AuthProvider`.
- Domain types are derived from the generated database types, never duplicated.

## Getting started

### 1. Install

```bash
npm install
```

Requires Node.js 20.19+ (Node 22 recommended).

### 2. Configure environment variables

```bash
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
```

| Variable                        | Where to find it                                                   |
| ------------------------------- | ------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | Supabase dashboard → Project Settings → API → Project URL          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase dashboard → Project Settings → API Keys → publishable key |

Only the **publishable** key (`sb_publishable_…`) belongs in this file. Never put the
secret key (`sb_secret_…`) or the service role key in a `VITE_*` variable — everything
prefixed `VITE_` is inlined into the browser bundle. `.env` is git-ignored; if a
required variable is missing the app renders a configuration screen listing it
instead of failing silently.

Legacy projects issue a JWT-style `anon` key instead; it works the same way and goes
in the same variable.

### 3. Run the frontend

```bash
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

## Connecting to Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and publishable key into `.env` (see above).
3. Link the local CLI to that project (needs the project ref from the dashboard URL):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

## Database migrations

The schema lives in `supabase/migrations` and is applied with the CLI — do not create
tables by hand in the dashboard, or the migrations and the database will drift.

```bash
npm run db:push     # apply pending migrations to the linked project
npm run db:reset    # recreate the LOCAL database from scratch (destructive)
npm run db:start    # start the local Supabase stack (requires Docker)
npm run db:stop     # stop the local stack
```

Applying migrations to the local stack instead of the cloud project:

```bash
npm run db:start
npm run db:reset
```

## Generating TypeScript database types

`src/types/database.types.ts` mirrors the SQL schema and is meant to be generated:

```bash
npm run db:types         # from the linked remote project
npm run db:types:local   # from the local stack (npm run db:start first)
```

The file checked into the repository was written by hand to match the migrations so
the project type-checks before a Supabase project exists. Regenerate it after every
schema change and prefer generated output over hand-editing. Application-level types
are derived from it in `src/types/models.ts`, so they update automatically.

## Project structure

```
src/
├── assets/                    static assets
├── components/
│   ├── common/                shared presentational components
│   ├── layout/                header / chrome
│   └── ui/                    shadcn/ui primitives (generated)
├── config/env.ts              environment validation
├── constants/                 routes, role labels
├── hooks/use-auth.ts          typed access to auth context
├── layouts/                   app shell + auth shell
├── pages/                     route components
├── routes/                    route tree + route guards
├── services/
│   ├── auth/                  auth.service.ts, profile.service.ts
│   └── supabase/client.ts     the only place the client is created
├── stores/                    auth context + provider
├── types/                     database.types.ts (generated), models, auth
├── utils/cn.ts                Tailwind class merge helper
├── App.tsx
└── main.tsx

supabase/
├── config.toml                Supabase CLI configuration
└── migrations/                schema + RLS, applied in filename order
```

## Database schema

| Table           | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `profiles`      | Clinic identity + role for each `auth.users` row (`doctor`/`secretary`) |
| `patients`      | Patient directory                                                       |
| `visits`        | Consultation record, linked to a patient and a doctor                   |
| `edit_requests` | Secretary → doctor change requests (`pending`/`approved`/`rejected`)    |

Enum types: `user_role`, `gender`, `edit_request_status`.
`updated_at` is maintained by database triggers, and a profile row is created
automatically when a Supabase Auth user is created.

## Security model

Row level security is **enabled on all four tables**. `anon` has no access at all;
every policy targets `authenticated` and additionally requires the caller to have a
clinic profile. Table privileges are granted to match the policies, so authorization
does not depend on the frontend.

Currently enforced:

| Table           | Doctor                            | Secretary                    |
| --------------- | --------------------------------- | ---------------------------- |
| `profiles`      | read all, update own              | read own, update own         |
| `patients`      | read, create, update              | read, create, update         |
| `visits`        | read, create, **update**          | read, create (**no update**) |
| `edit_requests` | read all, review (approve/reject) | create own, read own         |

The secretary's inability to update `visits` is what forces changes through the
`edit_requests` workflow — enforced by the database, not the UI. Roles cannot be
changed by any request carrying a user JWT, so self-promotion is impossible.

Intentionally deferred (documented in
`supabase/migrations/20260827090500_enable_row_level_security.sql`):

- `DELETE` on every table — no grant and no policy exist yet.
- Applying an approved `edit_request` to its visit (needs a `SECURITY DEFINER` function).
- Per-doctor data partitioning and finer-grained secretary limits.
- Validating that `visits.doctor_id` points at a profile whose role is `doctor`.
- Cancelling an own pending edit request.

## Manual Supabase setup still required

1. **Enable email/password sign-in** — Authentication → Providers → Email.
2. **Create the staff accounts** — Authentication → Users → Add user. A `profiles` row
   is created automatically by a trigger.
3. **Promote the doctor.** Every new account starts as `secretary` by design (reading
   the role from sign-up metadata would let anyone register as a doctor). In the SQL
   editor, run:

   ```sql
   update public.profiles
   set role = 'doctor'
   where email = 'doctor@example.com';
   ```

   This works from the SQL editor because the guard only blocks requests that carry a
   user JWT.

4. **Disable public sign-ups** if only invited staff should have accounts —
   Authentication → Sign In / Providers → "Allow new users to sign up".

## Code quality

```bash
npm run typecheck      # tsc -b (strict, noUncheckedIndexedAccess)
npm run lint           # ESLint, type-aware rules
npm run format         # Prettier write
npm run format:check   # Prettier check
npm run validate       # all of the above + production build
```

## Current implementation scope

Included:

- React + TypeScript + Vite project with strict compiler settings and the `@/*` alias.
- Tailwind CSS v4 and shadcn/ui configured (button, card, input, label).
- Routing foundation with `ProtectedRoute` / `PublicOnlyRoute` guards and layouts.
- Lazily created, schema-typed Supabase client and environment validation.
- `authService` (sign in, sign out, current user, current session, auth subscription)
  and `profileService` for role resolution.
- `AuthProvider` + `useAuth` exposing session, profile, role and loading state.
- Six migrations: enums and helpers, the four tables, and the RLS policy set.
- A minimal placeholder sign-in screen and a placeholder home screen, present only to
  verify the auth flow end to end.

Not included yet: patient CRUD UI, visit UI, payment UI, dashboards, reports, the edit
request UI, the doctor approval UI, and any non-trivial business logic.

## Future planned modules

1. Authentication experience (proper login, session handling, role-aware redirects).
2. Doctor dashboard.
3. Secretary workflow.
4. Patients module.
5. Visits module.
6. Payments.
7. Edit requests and doctor approval workflow.
8. Reports.
