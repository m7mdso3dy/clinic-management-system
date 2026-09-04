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
import type { VisitListItem } from '@/services/visits/visit.service'

interface VisitCancelDialogProps {
  visit: VisitListItem | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

export function VisitCancelDialog({ visit, onOpenChange, onConfirm }: VisitCancelDialogProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = visit !== null

  async function handleConfirm() {
    if (visit === null) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await onConfirm(visit.id)
      onOpenChange(false)
    } catch {
      setErrorMessage(t('cancelFailed'))
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
          <DialogTitle>{t('cancelTitle')}</DialogTitle>
          <DialogDescription>
            {t('cancelDescription', { name: visit?.patientName ?? '' })}
          </DialogDescription>
        </DialogHeader>

        {errorMessage !== null && (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('close')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSubmitting}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {isSubmitting ? tCommon('loading') : t('cancelVisit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
