import {
  CalendarDaysIcon,
  ChartColumnIcon,
  ClipboardListIcon,
  FilePenLineIcon,
  HouseIcon,
  LayoutDashboardIcon,
  UsersIcon,
  WalletIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { ROUTES, type AppRoutePath } from '@/constants/routes'
import type { UserRole } from '@/types/models'

export type NavItemId =
  | 'home'
  | 'patients'
  | 'visits'
  | 'payments'
  | 'doctorDashboard'
  | 'secretaryWorkflow'
  | 'editRequests'
  | 'reports'

export interface NavItem {
  id: NavItemId
  path: AppRoutePath
  icon: LucideIcon
  /** When set, the item is shown only to those roles. */
  roles?: readonly UserRole[]
}

const STAFF_ROLES = ['doctor', 'secretary'] as const satisfies readonly UserRole[]

/**
 * Sidebar modules, in display order. Role-specific items sit with the rest of
 * the clinic workflow so the list stays a single source of truth for routing.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', path: ROUTES.home, icon: HouseIcon },
  { id: 'patients', path: ROUTES.patients, icon: UsersIcon, roles: STAFF_ROLES },
  { id: 'visits', path: ROUTES.visits, icon: CalendarDaysIcon, roles: STAFF_ROLES },
  { id: 'payments', path: ROUTES.payments, icon: WalletIcon, roles: STAFF_ROLES },
  {
    id: 'doctorDashboard',
    path: ROUTES.doctorDashboard,
    icon: LayoutDashboardIcon,
    roles: ['doctor'],
  },
  {
    id: 'secretaryWorkflow',
    path: ROUTES.secretaryWorkflow,
    icon: ClipboardListIcon,
    roles: ['secretary'],
  },
  { id: 'editRequests', path: ROUTES.editRequests, icon: FilePenLineIcon, roles: STAFF_ROLES },
  { id: 'reports', path: ROUTES.reports, icon: ChartColumnIcon, roles: STAFF_ROLES },
]

export function getVisibleNavItems(role: UserRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.roles === undefined) {
      return true
    }

    return role !== null && item.roles.includes(role)
  })
}
