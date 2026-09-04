import { PlusIcon } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { PatientFormDialog } from '@/components/patients/patient-form-dialog'
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
import { PatientLookup } from '@/components/visits/patient-lookup'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermissions } from '@/hooks/use-permissions'
import { examinationTypeService } from '@/services/lookups/examination-type.service'
import { patientService, type PatientWriteInput } from '@/services/patients/patient.service'
import {
  visitService,
  type OpenVisitInput,
  type VisitPatientOption,
} from '@/services/visits/visit.service'
import type { ExaminationType } from '@/types/models'
import { cn } from '@/utils/cn'
import { dateInputToIso, todayDateInputValue } from '@/utils/date-input'
import { resolveEditableDir } from '@/utils/text-dir'

const fieldClassName =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-start text-base transition-colors outline-none focus-visible:ring-3 md:text-sm'

interface OpenVisitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void>
}

function parseAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '') return 0

  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0) return null

  return Math.round(value * 100) / 100
}

export function OpenVisitDialog({ open, onOpenChange, onCreated }: OpenVisitDialogProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()
  const patientLookupId = useId()
  const examinationTypeId = useId()
  const dateId = useId()
  const amountId = useId()

  const [patients, setPatients] = useState<VisitPatientOption[]>([])
  const [examinationTypes, setExaminationTypes] = useState<ExaminationType[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedExaminationTypeId, setSelectedExaminationTypeId] = useState('')
  const [visitDate, setVisitDate] = useState(todayDateInputValue())
  const [amountInput, setAmountInput] = useState('')
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    let isActive = true

    Promise.all([visitService.listPatientOptions(), examinationTypeService.list()])
      .then(([patientRows, types]) => {
        if (!isActive) return
        setPatients(patientRows)
        setExaminationTypes(types)
      })
      .catch(() => {
        if (!isActive) return
        setPatients([])
        setExaminationTypes([])
        setErrorMessage(t('loadFailed'))
      })
      .finally(() => {
        if (!isActive) return
        setIsLoadingOptions(false)
      })

    return () => {
      isActive = false
    }
  }, [open, t])

  function resetForm() {
    setSelectedPatientId(null)
    setSelectedExaminationTypeId('')
    setVisitDate(todayDateInputValue())
    setAmountInput('')
    setIsAddingPatient(false)
    setErrorMessage(null)
    setIsSubmitting(false)
  }

  function handleExaminationTypeChange(id: string) {
    setSelectedExaminationTypeId(id)
    const selected = examinationTypes.find((type) => type.id === id)
    if (selected !== undefined) {
      setAmountInput(String(Number(selected.cost)))
    }
  }

  async function handleCreatePatient(values: PatientWriteInput) {
    const created = await patientService.create(values)
    const option: VisitPatientOption = {
      id: created.id,
      full_name: created.full_name,
      phone: created.phone,
    }

    setPatients((current) => {
      if (current.some((patient) => patient.id === created.id)) {
        return current
      }

      return [...current, option].sort((left, right) =>
        left.full_name.localeCompare(right.full_name),
      )
    })
    setSelectedPatientId(created.id)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (selectedPatientId === null || selectedPatientId === '') {
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

    const amount = parseAmount(amountInput === '' ? '0' : amountInput)
    if (amount === null) {
      setErrorMessage(t('invalidAmount'))
      return
    }

    const payload: OpenVisitInput = {
      patient_id: selectedPatientId,
      examination_type_id: selectedExaminationTypeId,
      visit_date: visitDateIso,
      visit_day: visitDate,
      amount,
    }

    setIsSubmitting(true)

    try {
      await visitService.open(payload)
      await onCreated()
      resetForm()
      onOpenChange(false)
    } catch {
      setErrorMessage(t('saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetForm()
          onOpenChange(nextOpen)
        }}
      >
        <DialogContent className="overflow-visible sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('openVisitTitle')}</DialogTitle>
            <DialogDescription>{t('openVisitDescription')}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              void handleSubmit(event)
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={patientLookupId}>{t('patientLabel')}</Label>
              <div className="flex flex-wrap items-start gap-2">
                <PatientLookup
                  key={selectedPatientId ?? 'none'}
                  id={patientLookupId}
                  patients={patients}
                  selectedId={selectedPatientId}
                  onSelect={setSelectedPatientId}
                  disabled={isLoadingOptions}
                />
                {permissions.has(PERMISSIONS.patientsCreate) ? (
                  <Button type="button" variant="outline" onClick={() => setIsAddingPatient(true)}>
                    <PlusIcon aria-hidden="true" />
                    {t('addPatientButton')}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={examinationTypeId}>{t('examinationTypeLabel')}</Label>
              <select
                id={examinationTypeId}
                className={cn(fieldClassName, 'bg-background')}
                dir={resolveEditableDir(selectedExaminationTypeId === '')}
                required
                disabled={isLoadingOptions}
                value={selectedExaminationTypeId}
                onChange={(event) => handleExaminationTypeChange(event.target.value)}
              >
                <option value="">{t('examinationTypeUnset')}</option>
                {examinationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                />
              </div>
            </div>

            {errorMessage !== null ? (
              <p role="alert" className="text-destructive text-sm">
                {errorMessage}
              </p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
                {isSubmitting ? tCommon('loading') : t('openVisitButton')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isAddingPatient ? (
        <PatientFormDialog
          key="create-from-open-visit"
          open
          mode="create"
          patient={null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setIsAddingPatient(false)
          }}
          onSubmit={handleCreatePatient}
        />
      ) : null}
    </>
  )
}
