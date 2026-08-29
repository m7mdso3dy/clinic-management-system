import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { hasPermissionName, permissionService } from '@/services/permissions/permission.service'

const EMPTY_NAMES: string[] = []

interface LoadedPermissionNames {
  roleId: string
  names: string[]
}

export function usePermissions() {
  const { profile } = useAuth()
  const roleId = profile?.role_id ?? null
  const [loaded, setLoaded] = useState<LoadedPermissionNames | null>(null)

  useEffect(() => {
    if (roleId === null) return

    let isActive = true

    permissionService
      .listNamesForRoleId(roleId)
      .then((names) => {
        if (isActive) {
          setLoaded({ roleId, names })
        }
      })
      .catch(() => {
        if (isActive) {
          setLoaded({ roleId, names: [] })
        }
      })

    return () => {
      isActive = false
    }
  }, [roleId])

  const names = loaded?.roleId === roleId ? loaded.names : EMPTY_NAMES
  const isLoading = roleId !== null && loaded?.roleId !== roleId

  return useMemo(
    () => ({
      isLoading,
      has: (name: string) => hasPermissionName(names, name),
    }),
    [names, isLoading],
  )
}
