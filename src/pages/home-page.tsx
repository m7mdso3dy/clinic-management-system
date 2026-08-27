import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROLE_LABELS } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

const PLANNED_MODULES = [
  'Patients',
  'Visits',
  'Payments',
  'Doctor dashboard',
  'Secretary workflow',
  'Edit requests & approvals',
  'Reports',
]

/** Placeholder route that confirms the foundation is wired up end to end. */
export function HomePage() {
  const { user, profile, role } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-medium">Foundation ready</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          React, Supabase Auth, the database schema and row level security are in place. Clinic
          features are not implemented yet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signed-in user</CardTitle>
          <CardDescription>Resolved from Supabase Auth and the profiles table.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{profile?.full_name ?? '—'}</dd>

            <dt className="text-muted-foreground">Email</dt>
            <dd>{user?.email ?? '—'}</dd>

            <dt className="text-muted-foreground">Role</dt>
            <dd>{role ? ROLE_LABELS[role] : 'No profile row found'}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned modules</CardTitle>
          <CardDescription>Delivered in the next phases.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {PLANNED_MODULES.map((module) => (
              <li key={module} className="bg-muted rounded-md px-2 py-1 text-xs">
                {module}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
