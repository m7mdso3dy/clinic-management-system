import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getVisibleNavItems } from '@/constants/navigation'
import { useAuth } from '@/hooks/use-auth'

/** Placeholder route that confirms the foundation is wired up end to end. */
export function HomePage() {
  const { t } = useTranslation('home')
  const { t: tCommon } = useTranslation()
  const { user, profile, role } = useAuth()

  const modules = getVisibleNavItems(role).filter((item) => item.id !== 'home')

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
          {modules.length === 0 ? (
            <p className="text-muted-foreground text-sm">{tCommon('noRoleAssigned')}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {modules.map((module) => (
                <li key={module.id}>
                  <Link
                    to={module.path}
                    className="bg-muted hover:bg-muted/80 inline-flex rounded-md px-2 py-1 text-xs transition-colors"
                  >
                    {tCommon(`nav.${module.id}`)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
