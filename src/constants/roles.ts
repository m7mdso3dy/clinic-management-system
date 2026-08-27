import type { UserRole } from '@/types/models'

export const USER_ROLES = ['doctor', 'secretary'] as const satisfies readonly UserRole[]

export const ROLE_LABELS: Record<UserRole, string> = {
  doctor: 'Doctor',
  secretary: 'Secretary',
}
