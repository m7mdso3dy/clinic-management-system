import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  const { t } = useTranslation('errors')

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <p className="text-muted-foreground font-mono text-sm">404</p>
        <h1 className="font-heading text-xl font-medium">{t('notFoundTitle')}</h1>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link to={ROUTES.home}>{t('backToApp')}</Link>
      </Button>
    </div>
  )
}
