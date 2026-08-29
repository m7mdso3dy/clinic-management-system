import { LogOutIcon, StethoscopeIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/common/language-switcher'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function AppHeader() {
  const { t } = useTranslation()
  const { profile, role, signOut } = useAuth()

  return (
    <header className="bg-card border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <StethoscopeIcon className="text-primary size-5" aria-hidden="true" />
          <span className="font-heading text-sm font-medium">{t('appName')}</span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <div className="text-end text-xs leading-tight">
            <p className="font-medium">{profile?.full_name ?? '—'}</p>
            <p className="text-muted-foreground">
              {role ? t(`roles.${role}`) : t('noRoleAssigned')}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOutIcon aria-hidden="true" />
            {t('signOut')}
          </Button>
        </div>
      </div>
    </header>
  )
}
