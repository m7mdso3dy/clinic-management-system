import type { UserRole } from '@/types/models'

/** Built-in clinic roles. Custom names may exist in `roles.name`. */
export const USER_ROLES = ['doctor', 'secretary'] as const satisfies readonly UserRole[]

export type BuiltinRole = (typeof USER_ROLES)[number]

export function isBuiltinRole(value: string): value is BuiltinRole {
  return (USER_ROLES as readonly string[]).includes(value)
}

export function displayRoleName(
  role: string,
  translateBuiltin: (key: BuiltinRole) => string,
): string {
  if (isBuiltinRole(role)) {
    return translateBuiltin(role)
  }

  return role
}
