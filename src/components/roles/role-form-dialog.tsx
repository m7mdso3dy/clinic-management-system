import { useId, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isBuiltinRole } from '@/constants/roles'
import { isRoleError } from '@/services/roles/role.service'
import type { Permission } from '@/types/models'

export interface RoleFormValues {
  name: string
  permissionIds: string[]
}

interface RoleFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialName?: string
  initialPermissionIds?: readonly string[]
  permissions: Permission[]
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RoleFormValues) => Promise<void>
}

interface PermissionGroup {
  resource: string
  items: Permission[]
}

function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const grouped = new Map<string, Permission[]>()

  for (const permission of permissions) {
    const separator = permission.name.lastIndexOf('.')
    const resource = separator === -1 ? permission.name : permission.name.slice(0, separator)
    const items = grouped.get(resource) ?? []
    items.push(permission)
    grouped.set(resource, items)
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resource, items]) => ({
      resource,
      items: [...items].sort((left, right) => left.name.localeCompare(right.name)),
    }))
}

export function RoleFormDialog({
  open,
  mode,
  initialName = '',
  initialPermissionIds = [],
  permissions,
  onOpenChange,
  onSubmit,
}: RoleFormDialogProps) {
  const { t } = useTranslation('roles')
  const { t: tCommon } = useTranslation()
  const nameId = useId()
  const nameLocked = mode === 'edit' && isBuiltinRole(initialName)

  const [name, setName] = useState(initialName)
  const [selectedIds, setSelectedIds] = useState(() => new Set(initialPermissionIds))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const groups = useMemo(() => groupPermissions(permissions), [permissions])

  function togglePermission(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (trimmedName.length < 1 || trimmedName.length > 64) {
      setErrorMessage(t('invalidName'))
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({ name: trimmedName, permissionIds: [...selectedIds] })
      onOpenChange(false)
    } catch (error: unknown) {
      if (isRoleError(error) && error.kind === 'duplicate_name') {
        setErrorMessage(t('duplicateName'))
      } else if (isRoleError(error) && error.kind === 'protected') {
        setErrorMessage(t('protected'))
      } else {
        setErrorMessage(t('saveFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('addTitle') : t('editTitle')}</DialogTitle>
          <DialogDescription>{t('formDescription')}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>{t('nameLabel')}</Label>
            <Input
              id={nameId}
              dir="auto"
              maxLength={64}
              autoComplete="off"
              required
              autoFocus={!nameLocked}
              disabled={nameLocked}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {nameLocked ? (
              <p className="text-muted-foreground text-xs">{t('nameLockedHint')}</p>
            ) : null}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t('permissionsLabel')}</legend>
            <div className="max-h-[min(24rem,50vh)] space-y-4 overflow-y-auto pe-1">
              {groups.map((group) => (
                <div key={group.resource} className="space-y-2">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {t(`groups.${group.resource}`, { defaultValue: group.resource })}
                  </p>
                  <ul className="space-y-1.5">
                    {group.items.map((permission) => {
                      const inputId = `${nameId}-${permission.id}`

                      return (
                        <li key={permission.id}>
                          <label
                            htmlFor={inputId}
                            className="hover:bg-muted/60 flex cursor-pointer items-start gap-2 rounded-md px-1 py-1"
                          >
                            <input
                              id={inputId}
                              type="checkbox"
                              className="border-input accent-primary mt-0.5 size-4 shrink-0 rounded"
                              checked={selectedIds.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            <span className="text-sm leading-snug">
                              {t(`permissionLabels.${permission.name}`, {
                                defaultValue: permission.name,
                              })}
                            </span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </fieldset>

          {errorMessage !== null && (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
