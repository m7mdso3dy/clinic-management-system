import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { examinationTypeService } from '@/services/lookups/examination-type.service'
import type {
  LabOrderWriteInput,
  PrescriptionWriteInput,
  VisitDetail,
  VisitWriteInput,
} from '@/services/visits/visit.service'
import type { ExaminationType } from '@/types/models'
import { dateInputToIso, toDateInputValue, todayDateInputValue } from '@/utils/date-input'
import { cn } from '@/utils/cn'

const fieldClassName =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 md:text-sm'

interface PrescriptionDraft extends PrescriptionWriteInput {
  localKey: string
}

interface LabDraft extends LabOrderWriteInput {
  localKey: string
}

interface VisitEditorProps {
  patientId: string | null
  initial?: VisitDetail | null
  onSave: (values: VisitWriteInput) => Promise<void>
}

function newKey(): string {
  return crypto.randomUUID()
}

function emptyPrescription(): PrescriptionDraft {
  return {
    localKey: newKey(),
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  }
}

function emptyLabOrder(): LabDraft {
  return { localKey: newKey(), analysis_name: '', notes: '' }
}

function numberToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function parseOptionalNumber(raw: string, min: number, max: number): number | null | 'invalid' {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '') return null

  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < min || value > max) return 'invalid'

  return value
}

function parseAmount(raw: string): number | null {
  const parsed = parseOptionalNumber(raw, 0, 1_000_000)
  return parsed === 'invalid' ? null : parsed
}

function asOptionalNumber(value: number | null | 'invalid'): number | null {
  return value === 'invalid' ? null : value
}

function computeBmi(weightKg: number, heightCm: number): number {
  const meters = heightCm / 100
  return Math.round((weightKg / (meters * meters)) * 10) / 10
}

export function VisitEditor({ patientId, initial = null, onSave }: VisitEditorProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const examinationTypeId = useId()
  const dateId = useId()
  const amountId = useId()

  const [examinationTypes, setExaminationTypes] = useState<ExaminationType[]>([])
  const [selectedExaminationTypeId, setSelectedExaminationTypeId] = useState(
    initial?.examination_type_id ?? '',
  )
  const [visitDate, setVisitDate] = useState(
    initial === null ? todayDateInputValue() : toDateInputValue(initial.visit_date),
  )
  const [amountInput, setAmountInput] = useState(
    initial === null ? '' : String(Number(initial.amount)),
  )
  const [heartRate, setHeartRate] = useState(numberToInput(initial?.heart_rate))
  const [bpSystolic, setBpSystolic] = useState(numberToInput(initial?.blood_pressure_systolic))
  const [bpDiastolic, setBpDiastolic] = useState(numberToInput(initial?.blood_pressure_diastolic))
  const [temperature, setTemperature] = useState(numberToInput(initial?.temperature))
  const [weightKg, setWeightKg] = useState(numberToInput(initial?.weight_kg))
  const [heightCm, setHeightCm] = useState(numberToInput(initial?.height_cm))
  const [respiratoryRate, setRespiratoryRate] = useState(numberToInput(initial?.respiratory_rate))
  const [oxygenSaturation, setOxygenSaturation] = useState(
    numberToInput(initial?.oxygen_saturation),
  )
  const [bloodGlucose, setBloodGlucose] = useState(numberToInput(initial?.blood_glucose))
  const [symptoms, setSymptoms] = useState(initial?.symptoms ?? '')
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis ?? '')
  const [treatment, setTreatment] = useState(initial?.treatment ?? '')
  const [extraNotes, setExtraNotes] = useState(initial?.notes ?? '')
  const [prescriptions, setPrescriptions] = useState<PrescriptionDraft[]>(() =>
    initial !== null && initial.prescriptions.length > 0
      ? initial.prescriptions.map((item) => ({
          localKey: item.id,
          medication_name: item.medication_name,
          dosage: item.dosage ?? '',
          frequency: item.frequency ?? '',
          duration: item.duration ?? '',
          instructions: item.instructions ?? '',
        }))
      : [emptyPrescription()],
  )
  const [labOrders, setLabOrders] = useState<LabDraft[]>(() =>
    initial !== null && initial.labOrders.length > 0
      ? initial.labOrders.map((item) => ({
          localKey: item.id,
          analysis_name: item.analysis_name,
          notes: item.notes ?? '',
        }))
      : [emptyLabOrder()],
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    examinationTypeService
      .list()
      .then((types) => {
        if (isActive) setExaminationTypes(types)
      })
      .catch(() => {
        if (isActive) setExaminationTypes([])
      })

    return () => {
      isActive = false
    }
  }, [])

  const weightValue = parseOptionalNumber(weightKg, 0.5, 400)
  const heightValue = parseOptionalNumber(heightCm, 30, 250)
  const bmi =
    typeof weightValue === 'number' && typeof heightValue === 'number'
      ? computeBmi(weightValue, heightValue)
      : null

  function handleExaminationTypeChange(id: string) {
    setSelectedExaminationTypeId(id)
    const selected = examinationTypes.find((type) => type.id === id)
    if (selected !== undefined) {
      setAmountInput(String(Number(selected.cost)))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (patientId === null || patientId === '') {
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

    const parsedHeartRate = parseOptionalNumber(heartRate, 20, 300)
    const parsedSystolic = parseOptionalNumber(bpSystolic, 40, 250)
    const parsedDiastolic = parseOptionalNumber(bpDiastolic, 20, 200)
    const parsedTemperature = parseOptionalNumber(temperature, 30, 45)
    const parsedWeight = parseOptionalNumber(weightKg, 0.5, 400)
    const parsedHeight = parseOptionalNumber(heightCm, 30, 250)
    const parsedRespiratory = parseOptionalNumber(respiratoryRate, 5, 80)
    const parsedOxygen = parseOptionalNumber(oxygenSaturation, 50, 100)
    const parsedGlucose = parseOptionalNumber(bloodGlucose, 20, 800)

    const vitals = [
      parsedHeartRate,
      parsedSystolic,
      parsedDiastolic,
      parsedTemperature,
      parsedWeight,
      parsedHeight,
      parsedRespiratory,
      parsedOxygen,
      parsedGlucose,
    ]

    if (vitals.some((value) => value === 'invalid')) {
      setErrorMessage(t('invalidVitals'))
      return
    }

    if ((parsedSystolic === null) !== (parsedDiastolic === null)) {
      setErrorMessage(t('invalidBloodPressure'))
      return
    }

    setIsSubmitting(true)

    try {
      await onSave({
        patient_id: patientId,
        examination_type_id: selectedExaminationTypeId,
        visit_date: visitDateIso,
        amount,
        heart_rate: asOptionalNumber(parsedHeartRate),
        blood_pressure_systolic: asOptionalNumber(parsedSystolic),
        blood_pressure_diastolic: asOptionalNumber(parsedDiastolic),
        temperature: asOptionalNumber(parsedTemperature),
        weight_kg: asOptionalNumber(parsedWeight),
        height_cm: asOptionalNumber(parsedHeight),
        respiratory_rate: asOptionalNumber(parsedRespiratory),
        oxygen_saturation: asOptionalNumber(parsedOxygen),
        blood_glucose: asOptionalNumber(parsedGlucose),
        symptoms,
        diagnosis,
        treatment,
        notes: extraNotes,
        prescriptions: prescriptions
          .filter((item) => item.medication_name.trim() !== '')
          .map((item) => ({
            medication_name: item.medication_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
          })),
        labOrders: labOrders
          .filter((item) => item.analysis_name.trim() !== '')
          .map((item) => ({
            analysis_name: item.analysis_name,
            notes: item.notes,
          })),
      })
    } catch {
      setErrorMessage(t('saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        void handleSubmit(event)
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('visitInfoTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor={examinationTypeId}>{t('examinationTypeLabel')}</Label>
            <select
              id={examinationTypeId}
              className={cn(fieldClassName, 'bg-background')}
              required
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('vitalsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <VitalField label={t('heartRateLabel')} value={heartRate} onChange={setHeartRate} />
          <VitalField label={t('bpSystolicLabel')} value={bpSystolic} onChange={setBpSystolic} />
          <VitalField label={t('bpDiastolicLabel')} value={bpDiastolic} onChange={setBpDiastolic} />
          <VitalField
            label={t('temperatureLabel')}
            value={temperature}
            onChange={setTemperature}
            step="0.1"
          />
          <VitalField label={t('weightLabel')} value={weightKg} onChange={setWeightKg} step="0.1" />
          <VitalField label={t('heightLabel')} value={heightCm} onChange={setHeightCm} step="0.1" />
          <VitalField
            label={t('respiratoryRateLabel')}
            value={respiratoryRate}
            onChange={setRespiratoryRate}
          />
          <VitalField
            label={t('oxygenSatLabel')}
            value={oxygenSaturation}
            onChange={setOxygenSaturation}
            step="0.1"
          />
          <VitalField
            label={t('bloodGlucoseLabel')}
            value={bloodGlucose}
            onChange={setBloodGlucose}
            step="0.1"
          />
          {bmi !== null ? (
            <p className="text-muted-foreground text-sm sm:col-span-2 lg:col-span-3">
              {t('bmiLabel', { value: bmi })}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TextAreaField label={t('symptomsLabel')} value={symptoms} onChange={setSymptoms} />
          <TextAreaField label={t('diagnosisLabel')} value={diagnosis} onChange={setDiagnosis} />
          <TextAreaField label={t('treatmentLabel')} value={treatment} onChange={setTreatment} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('extraDataTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TextAreaField
            label={t('extraDataLabel')}
            value={extraNotes}
            onChange={setExtraNotes}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('prescriptionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prescriptions.map((item, index) => (
            <div key={item.localKey} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
              <Input
                dir="auto"
                placeholder={t('medicationNameLabel')}
                value={item.medication_name}
                onChange={(event) =>
                  setPrescriptions((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, medication_name: event.target.value } : row,
                    ),
                  )
                }
              />
              <Input
                dir="auto"
                placeholder={t('dosageLabel')}
                value={item.dosage}
                onChange={(event) =>
                  setPrescriptions((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, dosage: event.target.value } : row,
                    ),
                  )
                }
              />
              <Input
                dir="auto"
                placeholder={t('frequencyLabel')}
                value={item.frequency}
                onChange={(event) =>
                  setPrescriptions((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, frequency: event.target.value } : row,
                    ),
                  )
                }
              />
              <Input
                dir="auto"
                placeholder={t('durationLabel')}
                value={item.duration}
                onChange={(event) =>
                  setPrescriptions((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, duration: event.target.value } : row,
                    ),
                  )
                }
              />
              <div className="flex gap-2 sm:col-span-2">
                <Input
                  dir="auto"
                  className="flex-1"
                  placeholder={t('instructionsLabel')}
                  value={item.instructions}
                  onChange={(event) =>
                    setPrescriptions((rows) =>
                      rows.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, instructions: event.target.value } : row,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('removeItem')}
                  onClick={() =>
                    setPrescriptions((rows) =>
                      rows.length === 1
                        ? [emptyPrescription()]
                        : rows.filter((_, i) => i !== index),
                    )
                  }
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setPrescriptions((rows) => [...rows, emptyPrescription()])}
          >
            <PlusIcon aria-hidden="true" />
            {t('addMedicine')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('labTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {labOrders.map((item, index) => (
            <div
              key={item.localKey}
              className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                dir="auto"
                placeholder={t('analysisNameLabel')}
                value={item.analysis_name}
                onChange={(event) =>
                  setLabOrders((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, analysis_name: event.target.value } : row,
                    ),
                  )
                }
              />
              <Input
                dir="auto"
                placeholder={t('analysisNotesLabel')}
                value={item.notes}
                onChange={(event) =>
                  setLabOrders((rows) =>
                    rows.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, notes: event.target.value } : row,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('removeItem')}
                onClick={() =>
                  setLabOrders((rows) =>
                    rows.length === 1 ? [emptyLabOrder()] : rows.filter((_, i) => i !== index),
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setLabOrders((rows) => [...rows, emptyLabOrder()])}
          >
            <PlusIcon aria-hidden="true" />
            {t('addAnalysis')}
          </Button>
        </CardContent>
      </Card>

      {errorMessage !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tCommon('loading') : t('saveVisit')}
      </Button>
    </form>
  )
}

function VitalField({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  step?: string
}) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step ?? '1'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 2,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  const id = useId()

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        dir="auto"
        rows={rows}
        className={cn(fieldClassName, 'h-auto min-h-16 py-1.5')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
