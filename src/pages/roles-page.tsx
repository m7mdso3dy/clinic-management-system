import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RoleDeleteDialog } from '@/components/roles/role-delete-dialog'
import { RoleFormDialog, type RoleFormValues } from '@/components/roles/role-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PERMISSIONS } from '@/constants/permissions'
import { displayRoleName, isBuiltinRole } from '@/constants/roles'
import { usePermissions } from '@/hooks/use-permissions'
import { roleService, type RoleListItem } from '@/services/roles/role.service'
import type { Permission } from '@/types/models'

type FormDialogState = { mode: 'create' } | { mode: 'edit'; role: RoleListItem }

export function RolesPage() {
  const { t } = useTranslation('roles')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()

  const [items, setItems] = useState<RoleListItem[]>([])
  const [catalogue, setCatalogue] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormDialogState | null>(null)
  const [deleting, setDeleting] = useState<RoleListItem | null>(null)

  useEffect(() => {
    let isActive = true

    Promise.all([roleService.list(), roleService.listPermissions()])
      .then(([roles, permissionRows]) => {
        if (!isActive) return
        setItems(roles)
        setCatalogue(permissionRows)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setLoadError(t('loadFailed'))
        setItems([])
        setCatalogue([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [t])

  async function refreshItems() {
    const roles = await roleService.list()
    setItems(roles)
    setLoadError(null)
  }

  async function handleSave(values: RoleFormValues) {
    if (formState === null) return

    if (formState.mode === 'create') {
      await roleService.create(values)
    } else {
      await roleService.update(formState.role.id, values)
    }

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  async function handleDelete(id: string) {
    await roleService.remove(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  const showActions =
    permissions.has(PERMISSIONS.rolesUpdate) || permissions.has(PERMISSIONS.rolesDelete)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        {permissions.has(PERMISSIONS.rolesCreate) ? (
          <Button type="button" onClick={() => setFormState({ mode: 'create' })}>
            <PlusIcon aria-hidden="true" />
            {t('addButton')}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="px-0">
          {isLoading ? (
            <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">
              {tCommon('loading')}
            </p>
          ) : loadError !== null ? (
            <p role="alert" className="text-destructive px-(--card-spacing) py-6 text-sm">
              {loadError}
            </p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('nameColumn')}</TableHead>
                  <TableHead>{t('permissionsColumn')}</TableHead>
                  {showActions ? (
                    <TableHead className="text-end">{t('actionsColumn')}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium" dir="auto">
                      {displayRoleName(item.name, (key) => tCommon(`roles.${key}`))}
                    </TableCell>
                    <TableCell>{t('permissionCount', { count: item.permissionCount })}</TableCell>
                    {showActions ? (
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          {permissions.has(PERMISSIONS.rolesUpdate) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormState({ mode: 'edit', role: item })}
                            >
                              <PencilIcon aria-hidden="true" />
                              {tCommon('edit')}
                            </Button>
                          ) : null}
                          {permissions.has(PERMISSIONS.rolesDelete) && !isBuiltinRole(item.name) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleting(item)}
                            >
                              <Trash2Icon aria-hidden="true" />
                              {tCommon('delete')}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {formState !== null ? (
        <RoleFormDialog
          key={formState.mode === 'create' ? 'create' : formState.role.id}
          open
          mode={formState.mode}
          initialName={formState.mode === 'edit' ? formState.role.name : ''}
          initialPermissionIds={formState.mode === 'edit' ? formState.role.permissionIds : []}
          permissions={catalogue}
          onOpenChange={(open) => {
            if (!open) setFormState(null)
          }}
          onSubmit={handleSave}
        />
      ) : null}

      <RoleDeleteDialog
        role={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
