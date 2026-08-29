import { useId, useState, type FormEvent } from 'react'
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
import { isExaminationTypeError } from '@/services/lookups/examination-type.service'

export interface ExaminationTypeFormValues {
  name: string
  cost: number
}

interface ExaminationTypeFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  initialName?: string
  initialCost?: number
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExaminationTypeFormValues) => Promise<void>
}

function parseCost(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '') return null

  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null

  return Math.round(value * 100) / 100
}

export function ExaminationTypeFormDialog({
  open,
  mode,
  initialName = '',
  initialCost,
  onOpenChange,
  onSubmit,
}: ExaminationTypeFormDialogProps) {
  const { t } = useTranslation('examinationTypes')
  const { t: tCommon } = useTranslation()
  const nameId = useId()
  const costId = useId()

  const [name, setName] = useState(initialName)
  const [costInput, setCostInput] = useState(initialCost === undefined ? '' : String(initialCost))
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (trimmedName.length < 1 || trimmedName.length > 160) {
      setErrorMessage(t('invalidName'))
      return
    }

    const cost = parseCost(costInput)
    if (cost === null) {
      setErrorMessage(t('invalidCost'))
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({ name: trimmedName, cost })
      onOpenChange(false)
    } catch (error: unknown) {
      if (isExaminationTypeError(error) && error.kind === 'duplicate_name') {
        setErrorMessage(t('duplicateName'))
      } else {
        setErrorMessage(t('saveFailed'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
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
              maxLength={160}
              autoComplete="off"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={costId}>{t('costLabel')}</Label>
            <Input
              id={costId}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              required
              value={costInput}
              onChange={(event) => setCostInput(event.target.value)}
            />
          </div>

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
