import { getSupabaseClient } from '@/services/supabase/client'
import type { Permission, Role } from '@/types/models'

export type RoleErrorKind = 'duplicate_name' | 'in_use' | 'protected' | 'unknown'

export class RoleError extends Error {
  readonly kind: RoleErrorKind

  constructor(kind: RoleErrorKind, cause?: unknown) {
    super(kind, cause !== undefined ? { cause } : undefined)
    this.name = 'RoleError'
    this.kind = kind
  }
}

export function isRoleError(error: unknown): error is RoleError {
  return error instanceof RoleError
}

export interface RoleListItem extends Role {
  permissionIds: string[]
  permissionCount: number
}

export interface RoleWriteInput {
  name: string
  permissionIds: string[]
}

function wrapError(error: { code?: string }): RoleError {
  if (error.code === '23505') {
    return new RoleError('duplicate_name', error)
  }

  if (error.code === '23503') {
    return new RoleError('in_use', error)
  }

  if (error.code === 'P0001') {
    return new RoleError('protected', error)
  }

  return new RoleError('unknown', error)
}

export const roleService = {
  async list(): Promise<RoleListItem[]> {
    const client = getSupabaseClient()

    const { data: roles, error: rolesError } = await client
      .from('roles')
      .select('*')
      .order('name', { ascending: true })

    if (rolesError) throw wrapError(rolesError)

    const { data: assignments, error: assignmentsError } = await client
      .from('role_permissions')
      .select('role_id, permission_id')

    if (assignmentsError) throw wrapError(assignmentsError)

    return roles.map((role) => {
      const permissionIds = assignments
        .filter((row) => row.role_id === role.id)
        .map((row) => row.permission_id)

      return {
        id: role.id,
        name: role.name,
        permissionIds,
        permissionCount: permissionIds.length,
      }
    })
  },

  async listPermissions(): Promise<Permission[]> {
    const { data, error } = await getSupabaseClient()
      .from('permissions')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw wrapError(error)

    return data
  },

  async create(input: RoleWriteInput): Promise<Role> {
    const { data, error } = await getSupabaseClient().rpc('save_clinic_role', {
      p_name: input.name.trim(),
      p_permission_ids: input.permissionIds,
    })

    if (error) throw wrapError(error)
    if (data === null) throw new RoleError('unknown')

    return data
  },

  async update(id: string, input: RoleWriteInput): Promise<Role> {
    const { data, error } = await getSupabaseClient().rpc('save_clinic_role', {
      p_name: input.name.trim(),
      p_permission_ids: input.permissionIds,
      p_id: id,
    })

    if (error) throw wrapError(error)
    if (data === null) throw new RoleError('unknown')

    return data
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabaseClient().rpc('delete_clinic_role', { p_id: id })

    if (error) throw wrapError(error)
  },
}
