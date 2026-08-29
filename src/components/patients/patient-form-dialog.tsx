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
import type { PatientWriteInput } from '@/services/patients/patient.service'
import type { Gender, Patient } from '@/types/models'
import { cn } from '@/utils/cn'

const GENDERS = ['male', 'female', 'other'] as const satisfies readonly Gender[]

const fieldClassName =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 md:text-sm'

interface PatientFormDialogProps {
  open: boolean
  mode: 'create' | 'edit'
  patient: Patient | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PatientWriteInput) => Promise<void>
}

function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  return trimmed === '' || (trimmed.length >= 4 && trimmed.length <= 32)
}

function parseGender(value: string): Gender | '' {
  if (value === 'male' || value === 'female' || value === 'other') {
    return value
  }

  return ''
}

function isValidDateOfBirth(value: string): boolean {
  if (value.trim() === '') return true

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return false

  const min = new Date('1900-01-01T00:00:00')
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return date >= min && date <= today
}

export function PatientFormDialog({
  open,
  mode,
  patient,
  onOpenChange,
  onSubmit,
}: PatientFormDialogProps) {
  const { t } = useTranslation('patients')
  const { t: tCommon } = useTranslation()
  const nameId = useId()
  const phoneId = useId()
  const dobId = useId()
  const genderId = useId()
  const addressId = useId()
  const notesId = useId()

  const [fullName, setFullName] = useState(patient?.full_name ?? '')
  const [phone, setPhone] = useState(patient?.phone ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(patient?.date_of_birth ?? '')
  const [gender, setGender] = useState<Gender | ''>(patient?.gender ?? '')
  const [address, setAddress] = useState(patient?.address ?? '')
  const [notes, setNotes] = useState(patient?.notes ?? '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const trimmedName = fullName.trim()
    if (trimmedName.length < 1 || trimmedName.length > 160) {
      setErrorMessage(t('invalidName'))
      return
    }

    if (!isValidPhone(phone)) {
      setErrorMessage(t('invalidPhone'))
      return
    }

    if (!isValidDateOfBirth(dateOfBirth)) {
      setErrorMessage(t('invalidDateOfBirth'))
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        full_name: trimmedName,
        phone,
        date_of_birth: dateOfBirth,
        gender,
        address,
        notes,
      })
      onOpenChange(false)
    } catch {
      setErrorMessage(t('saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,44rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('addTitle') : t('editTitle')}</DialogTitle>
          <DialogDescription>{t('formDescription')}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
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
              autoComplete="name"
              required
              autoFocus
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={phoneId}>{t('phoneLabel')}</Label>
            <Input
              id={phoneId}
              type="tel"
              autoComplete="tel"
              maxLength={32}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={dobId}>{t('dateOfBirthLabel')}</Label>
            <Input
              id={dobId}
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={genderId}>{t('genderLabel')}</Label>
            <select
              id={genderId}
              className={cn(fieldClassName, 'bg-background')}
              value={gender}
              onChange={(event) => setGender(parseGender(event.target.value))}
            >
              <option value="">{t('genderUnset')}</option>
              {GENDERS.map((value) => (
                <option key={value} value={value}>
                  {t(`genders.${value}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={addressId}>{t('addressLabel')}</Label>
            <Input
              id={addressId}
              dir="auto"
              autoComplete="street-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={notesId}>{t('notesLabel')}</Label>
            <textarea
              id={notesId}
              dir="auto"
              rows={3}
              className={cn(fieldClassName, 'h-auto min-h-16 py-1.5')}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
