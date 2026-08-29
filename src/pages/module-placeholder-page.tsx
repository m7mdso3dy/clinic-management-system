import { useTranslation } from 'react-i18next'

import type { NavItemId } from '@/constants/navigation'

interface ModulePlaceholderPageProps {
  moduleId: Exclude<NavItemId, 'home'>
}

/** Temporary screen until the corresponding clinic module is implemented. */
export function ModulePlaceholderPage({ moduleId }: ModulePlaceholderPageProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <h1 className="font-heading text-xl font-medium">{t(`nav.${moduleId}`)}</h1>
      <p className="text-muted-foreground text-sm">{t('moduleComingSoon')}</p>
    </div>
  )
}
