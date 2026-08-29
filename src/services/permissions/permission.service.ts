import { getSupabaseClient } from '@/services/supabase/client'

export const permissionService = {
  /** Permission names assigned to a clinic role. */
  async listNamesForRoleId(roleId: string): Promise<string[]> {
    const client = getSupabaseClient()

    const { data: assignments, error: assignmentError } = await client
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId)

    if (assignmentError) throw assignmentError

    const permissionIds = assignments.map((row) => row.permission_id)
    if (permissionIds.length === 0) return []

    const { data: permissions, error: permissionError } = await client
      .from('permissions')
      .select('name')
      .in('id', permissionIds)

    if (permissionError) throw permissionError

    return permissions.map((row) => row.name)
  },
}

export function hasPermissionName(assignedNames: readonly string[], name: string): boolean {
  return assignedNames.includes(name)
}
