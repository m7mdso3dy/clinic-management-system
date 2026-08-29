import { NavLink } from 'react-router-dom'
import { StethoscopeIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Separator } from '@/components/ui/separator'
import { getVisibleNavItems } from '@/constants/navigation'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/utils/cn'

interface AppSidebarProps {
  onNavigate?: () => void
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const items = getVisibleNavItems(role)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 py-3 ps-4 pe-12 md:pe-4">
        <StethoscopeIcon className="text-primary size-5 shrink-0" aria-hidden="true" />
        <span className="font-heading text-sm font-medium">{t('appName')}</span>
      </div>

      <Separator />

      <nav aria-label={t('nav.label')} className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  end={item.path === ROUTES.home}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {t(`nav.${item.id}`)}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
