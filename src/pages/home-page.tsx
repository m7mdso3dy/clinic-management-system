import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

const PLANNED_MODULES = [
  'patients',
  'visits',
  'payments',
  'doctorDashboard',
  'secretaryWorkflow',
  'editRequests',
  'reports',
] as const

/** Placeholder route that confirms the foundation is wired up end to end. */
export function HomePage() {
  const { t } = useTranslation('home')
  const { t: tCommon } = useTranslation()
  const { user, profile, role } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('signedInUser')}</CardTitle>
          <CardDescription>{t('signedInUserDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted-foreground">{tCommon('name')}</dt>
            <dd>{profile?.full_name ?? '—'}</dd>

            <dt className="text-muted-foreground">{tCommon('email')}</dt>
            <dd>{user?.email ?? '—'}</dd>

            <dt className="text-muted-foreground">{tCommon('role')}</dt>
            <dd>{role ? tCommon(`roles.${role}`) : t('noProfile')}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('plannedModules')}</CardTitle>
          <CardDescription>{t('plannedModulesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {PLANNED_MODULES.map((module) => (
              <li key={module} className="bg-muted rounded-md px-2 py-1 text-xs">
                {t(`modules.${module}`)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
