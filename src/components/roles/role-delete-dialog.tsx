import { useState } from 'react'
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
import { isRoleError } from '@/services/roles/role.service'
import type { RoleListItem } from '@/services/roles/role.service'

interface RoleDeleteDialogProps {
  role: RoleListItem | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

export function RoleDeleteDialog({ role, onOpenChange, onConfirm }: RoleDeleteDialogProps) {
  const { t } = useTranslation('roles')
  const { t: tCommon } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = role !== null

  async function handleConfirm() {
    if (role === null) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await onConfirm(role.id)
      onOpenChange(false)
    } catch (error: unknown) {
      if (isRoleError(error) && error.kind === 'in_use') {
        setErrorMessage(t('inUse'))
      } else if (isRoleError(error) && error.kind === 'protected') {
        setErrorMessage(t('protected'))
      } else {
        setErrorMessage(t('deleteFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setErrorMessage(null)
          setIsSubmitting(false)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('deleteDescription', { name: role?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {errorMessage !== null && (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {isSubmitting ? tCommon('loading') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
