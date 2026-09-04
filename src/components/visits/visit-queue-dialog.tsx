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

type VisitQueueAction = 'hold' | 'reenqueue'

interface VisitQueueDialogProps {
  action: VisitQueueAction
  visit: VisitListItem | null
  onOpenChange: (open: boolean) => void
  onConfirm: (id: string) => Promise<void>
}

const COPY: Record<
  VisitQueueAction,
  {
    title: 'holdTitle' | 'reenqueueTitle'
    description: 'holdDescription' | 'reenqueueDescription'
    confirm: 'holdVisit' | 'reenqueueVisit'
    failed: 'holdFailed' | 'reenqueueFailed'
  }
> = {
  hold: {
    title: 'holdTitle',
    description: 'holdDescription',
    confirm: 'holdVisit',
    failed: 'holdFailed',
  },
  reenqueue: {
    title: 'reenqueueTitle',
    description: 'reenqueueDescription',
    confirm: 'reenqueueVisit',
    failed: 'reenqueueFailed',
  },
}

export function VisitQueueDialog({
  action,
  visit,
  onOpenChange,
  onConfirm,
}: VisitQueueDialogProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = visit !== null
  const copy = COPY[action]

  async function handleConfirm() {
    if (visit === null) return

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await onConfirm(visit.id)
      onOpenChange(false)
    } catch {
      setErrorMessage(t(copy.failed))
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
          <DialogTitle>{t(copy.title)}</DialogTitle>
          <DialogDescription>
            {t(copy.description, { name: visit?.patientName ?? '' })}
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
            disabled={isSubmitting}
            onClick={() => {
              void handleConfirm()
            }}
          >
            {isSubmitting ? tCommon('loading') : t(copy.confirm)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
