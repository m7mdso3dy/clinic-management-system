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
import { isPatientError } from '@/services/patients/patient.service'
import type { Patient } from '@/types/models'

interface PatientDeleteDialogProps {
  patient: Patient | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

export function PatientDeleteDialog({
  patient,
  onOpenChange,
  onConfirm,
}: PatientDeleteDialogProps) {
  const { t } = useTranslation('patients')
  const { t: tCommon } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = patient !== null

  async function handleConfirm() {
    if (patient === null) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await onConfirm(patient.id)
      onOpenChange(false)
    } catch (error: unknown) {
      setErrorMessage(
        isPatientError(error) && error.kind === 'has_visits'
          ? t('deleteHasVisits')
          : t('deleteFailed'),
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
          <DialogTitle>{t('deleteTitle')}</DialogTitle>
          <DialogDescription>
            {t('deleteDescription', { name: patient?.full_name ?? '' })}
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
