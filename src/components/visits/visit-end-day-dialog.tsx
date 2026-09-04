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
import { isVisitError } from '@/services/visits/visit.service'

interface VisitEndDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function VisitEndDayDialog({ open, onOpenChange, onConfirm }: VisitEndDayDialogProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error: unknown) {
      setErrorMessage(
        isVisitError(error) && error.kind === 'no_started_day'
          ? t('endDayEmpty')
          : t('endDayFailed'),
      )
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
          <DialogTitle>{t('endDayTitle')}</DialogTitle>
          <DialogDescription>{t('endDayDescription')}</DialogDescription>
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
            {isSubmitting ? tCommon('loading') : t('endDay')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
