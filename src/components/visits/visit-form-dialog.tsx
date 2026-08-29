import { useEffect, useId, useState, type FormEvent } from 'react'
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
import { examinationTypeService } from '@/services/lookups/examination-type.service'
import {
  visitService,
  type VisitListItem,
  type VisitPatientOption,
  type VisitWriteInput,
} from '@/services/visits/visit.service'
import { cn } from '@/utils/cn'

interface NamedOption {
  id: string
  name: string
}

const fieldClassName =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 md:text-sm'

interface VisitFormDialogProps {
  open: boolean
  visit: VisitListItem
  onOpenChange: (open: boolean) => void
  onSubmit: (values: VisitWriteInput) => Promise<void>
}

function toDateInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateInputToIso(value: string): string | null {
  if (value.trim() === '') return null

  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '') return null

  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null

  return Math.round(value * 100) / 100
}

export function VisitFormDialog({ open, visit, onOpenChange, onSubmit }: VisitFormDialogProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const patientId = useId()
  const examinationTypeId = useId()
  const dateId = useId()
  const amountId = useId()
  const symptomsId = useId()
  const diagnosisId = useId()
  const treatmentId = useId()
  const notesId = useId()

  const [patientOptions, setPatientOptions] = useState<VisitPatientOption[]>([])
  const [examinationTypes, setExaminationTypes] = useState<NamedOption[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState(visit.patient_id)
  const [selectedExaminationTypeId, setSelectedExaminationTypeId] = useState(
    visit.examination_type_id ?? '',
  )
  const [visitDate, setVisitDate] = useState(toDateInputValue(visit.visit_date))
  const [amountInput, setAmountInput] = useState(String(Number(visit.amount)))
  const [symptoms, setSymptoms] = useState(visit.symptoms ?? '')
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis ?? '')
  const [treatment, setTreatment] = useState(visit.treatment ?? '')
  const [notes, setNotes] = useState(visit.notes ?? '')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    Promise.all([visitService.listPatientOptions(), examinationTypeService.list()])
      .then(([patients, types]) => {
        if (!isActive) return
        setPatientOptions(patients)
        setExaminationTypes(types.map((type) => ({ id: type.id, name: type.name })))
      })
      .catch(() => {
        if (!isActive) return
        setPatientOptions([])
        setExaminationTypes([])
      })

    return () => {
      isActive = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (selectedPatientId === '') {
      setErrorMessage(t('invalidPatient'))
      return
    }

    if (selectedExaminationTypeId === '') {
      setErrorMessage(t('invalidExaminationType'))
      return
    }

    const visitDateIso = dateInputToIso(visitDate)
    if (visitDateIso === null) {
      setErrorMessage(t('invalidDate'))
      return
    }

    const amount = parseAmount(amountInput)
    if (amount === null) {
      setErrorMessage(t('invalidAmount'))
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        patient_id: selectedPatientId,
        examination_type_id: selectedExaminationTypeId,
        visit_date: visitDateIso,
        symptoms,
        diagnosis,
        treatment,
        notes,
        amount,
      })
      onOpenChange(false)
    } catch {
      setErrorMessage(t('saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const patientChoices = patientOptions.some((option) => option.id === visit.patient_id)
    ? patientOptions
    : visit.patientName !== ''
      ? [{ id: visit.patient_id, full_name: visit.patientName, phone: null }, ...patientOptions]
      : patientOptions

  const examinationTypeChoices =
    visit.examination_type_id !== null &&
    !examinationTypes.some((type) => type.id === visit.examination_type_id)
      ? [
          {
            id: visit.examination_type_id,
            name: visit.examinationTypeName ?? visit.examination_type_id,
          },
          ...examinationTypes,
        ]
      : examinationTypes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,44rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editTitle')}</DialogTitle>
          <DialogDescription>{t('formDescription')}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={patientId}>{t('patientLabel')}</Label>
            <select
              id={patientId}
              className={cn(fieldClassName, 'bg-background')}
              required
              autoFocus
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
            >
              <option value="">{t('patientUnset')}</option>
              {patientChoices.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={examinationTypeId}>{t('examinationTypeLabel')}</Label>
            <select
              id={examinationTypeId}
              className={cn(fieldClassName, 'bg-background')}
              required
              value={selectedExaminationTypeId}
              onChange={(event) => setSelectedExaminationTypeId(event.target.value)}
            >
              <option value="">{t('examinationTypeUnset')}</option>
              {examinationTypeChoices.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={dateId}>{t('dateLabel')}</Label>
            <Input
              id={dateId}
              type="date"
              required
              value={visitDate}
              onChange={(event) => setVisitDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={amountId}>{t('amountLabel')}</Label>
            <Input
              id={amountId}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              required
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={symptomsId}>{t('symptomsLabel')}</Label>
            <textarea
              id={symptomsId}
              dir="auto"
              rows={2}
              className={cn(fieldClassName, 'h-auto min-h-16 py-1.5')}
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={diagnosisId}>{t('diagnosisLabel')}</Label>
            <textarea
              id={diagnosisId}
              dir="auto"
              rows={2}
              className={cn(fieldClassName, 'h-auto min-h-16 py-1.5')}
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={treatmentId}>{t('treatmentLabel')}</Label>
            <textarea
              id={treatmentId}
              dir="auto"
              rows={2}
              className={cn(fieldClassName, 'h-auto min-h-16 py-1.5')}
              value={treatment}
              onChange={(event) => setTreatment(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={notesId}>{t('notesLabel')}</Label>
            <textarea
              id={notesId}
              dir="auto"
              rows={2}
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
