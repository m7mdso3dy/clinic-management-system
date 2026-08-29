import type { UserRole } from '@/types/models'

export const USER_ROLES = ['doctor', 'secretary'] as const satisfies readonly UserRole[]
