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
import type { ExaminationType } from '@/types/models'

interface ExaminationTypeDeleteDialogProps {
  examinationType: ExaminationType | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

export function ExaminationTypeDeleteDialog({
  examinationType,
  onOpenChange,
  onConfirm,
}: ExaminationTypeDeleteDialogProps) {
  const { t } = useTranslation('examinationTypes')
  const { t: tCommon } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = examinationType !== null

  async function handleConfirm() {
    if (examinationType === null) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await onConfirm(examinationType.id)
      onOpenChange(false)
    } catch {
      setErrorMessage(t('deleteFailed'))
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
            {t('deleteDescription', { name: examinationType?.name ?? '' })}
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
