import { LogOutIcon, StethoscopeIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

import { LanguageSwitcher } from '@/components/common/language-switcher'
import { Button } from '@/components/ui/button'
import { displayRoleName } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

interface AppHeaderProps {
  menu?: ReactNode
}

export function AppHeader({ menu }: AppHeaderProps) {
  const { t } = useTranslation()
  const { profile, role, signOut } = useAuth()

  return (
    <header className="bg-card sticky top-0 z-20 border-b">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {menu}
          <div className="flex items-center gap-2 md:hidden">
            <StethoscopeIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
            <span className="font-heading truncate text-sm font-medium">{t('appName')}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />

          <div className="text-end text-xs leading-tight">
            <p className="font-medium">{profile?.full_name ?? '—'}</p>
            <p className="text-muted-foreground">
              {role ? displayRoleName(role, (key) => t(`roles.${key}`)) : t('noRoleAssigned')}
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOutIcon className="rtl:-scale-x-100" aria-hidden="true" />
            <span className="hidden sm:inline">{t('signOut')}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
