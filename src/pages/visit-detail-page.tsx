import { PencilIcon, PrinterIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { VisitDeleteDialog } from '@/components/visits/visit-delete-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CLINIC_CURRENCY } from '@/constants/clinic'
import { PERMISSIONS } from '@/constants/permissions'
import {
  ROUTES,
  patientDetailPath,
  visitEditPath,
  visitLabPrintPath,
  visitPrescriptionPrintPath,
} from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency, formatDate, formatNumber } from '@/i18n/format'
import { visitService } from '@/services/visits/visit.service'
import type { VisitDetail } from '@/services/visits/visit.service'

export function VisitDetailPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()
  const navigate = useNavigate()
  const { visitId } = useParams()

  const [visit, setVisit] = useState<VisitDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (visitId === undefined) return

    let isActive = true

    visitService
      .getById(visitId)
      .then((row) => {
        if (!isActive) return
        if (row === null) {
          setVisit(null)
          setLoadError(t('notFound'))
          return
        }
        setVisit(row)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setVisit(null)
        setLoadError(t('loadFailed'))
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [visitId, t])

  async function handleDelete(id: string) {
    await visitService.remove(id)
    void navigate(ROUTES.visits)
  }

  if (visitId === undefined) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive text-sm">
          {t('notFound')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.visits}>{tCommon('back')}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{tCommon('loading')}</p>
  }

  if (loadError !== null || visit === null) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive text-sm">
          {loadError ?? t('notFound')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.visits}>{tCommon('back')}</Link>
        </Button>
      </div>
    )
  }

  const bmi =
    visit.weight_kg !== null && visit.height_cm !== null
      ? Math.round((Number(visit.weight_kg) / (Number(visit.height_cm) / 100) ** 2) * 10) / 10
      : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            <Link
              to={ROUTES.visits}
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              {t('title')}
            </Link>
          </p>
          <h1 className="font-heading mt-1 text-xl font-medium" dir="auto">
            {visit.patientName === '' ? (
              t('unset')
            ) : permissions.has(PERMISSIONS.patientsView) ? (
              <Link
                to={patientDetailPath(visit.patient_id)}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {visit.patientName}
              </Link>
            ) : (
              visit.patientName
            )}
          </h1>
        </div>

        <div className="flex flex-wrap gap-1">
          {permissions.has(PERMISSIONS.visitsUpdate) ? (
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={visitEditPath(visit.id)}>
                <PencilIcon aria-hidden="true" />
                {tCommon('edit')}
              </Link>
            </Button>
          ) : null}
          {permissions.has(PERMISSIONS.visitsDelete) ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleting(true)}>
              <Trash2Icon aria-hidden="true" />
              {tCommon('delete')}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('visitInfoTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{t('patientLabel')}</dt>
            <dd dir="auto">
              {visit.patientName === '' ? (
                t('unset')
              ) : permissions.has(PERMISSIONS.patientsView) ? (
                <Link
                  to={patientDetailPath(visit.patient_id)}
                  className="hover:text-foreground underline-offset-4 hover:underline"
                >
                  {visit.patientName}
                </Link>
              ) : (
                visit.patientName
              )}
            </dd>
            <dt className="text-muted-foreground">{t('examinationTypeLabel')}</dt>
            <dd dir="auto">{visit.examinationTypeName ?? t('unset')}</dd>
            <dt className="text-muted-foreground">{t('dateLabel')}</dt>
            <dd>{formatDate(visit.visit_date, { dateStyle: 'medium' })}</dd>
            <dt className="text-muted-foreground">{t('amountLabel')}</dt>
            <dd>{formatCurrency(Number(visit.amount), CLINIC_CURRENCY)}</dd>
            <dt className="text-muted-foreground">{t('doctorLabel')}</dt>
            <dd dir="auto">{visit.doctorName ?? t('unset')}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('vitalsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <VitalRead label={t('heartRateLabel')} value={visit.heart_rate} unset={t('unset')} />
            <dt className="text-muted-foreground">{t('bloodPressureLabel')}</dt>
            <dd>
              {visit.blood_pressure_systolic !== null && visit.blood_pressure_diastolic !== null
                ? `${formatNumber(visit.blood_pressure_systolic)}/${formatNumber(visit.blood_pressure_diastolic)}`
                : t('unset')}
            </dd>
            <VitalRead label={t('temperatureLabel')} value={visit.temperature} unset={t('unset')} />
            <VitalRead label={t('weightLabel')} value={visit.weight_kg} unset={t('unset')} />
            <VitalRead label={t('heightLabel')} value={visit.height_cm} unset={t('unset')} />
            <VitalRead
              label={t('respiratoryRateLabel')}
              value={visit.respiratory_rate}
              unset={t('unset')}
            />
            <VitalRead
              label={t('oxygenSatLabel')}
              value={visit.oxygen_saturation}
              unset={t('unset')}
            />
            <VitalRead
              label={t('bloodGlucoseLabel')}
              value={visit.blood_glucose}
              unset={t('unset')}
            />
            {bmi !== null ? (
              <>
                <dt className="text-muted-foreground">{t('bmiReadLabel')}</dt>
                <dd>{formatNumber(bmi)}</dd>
              </>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('clinicalTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{t('symptomsLabel')}</dt>
            <dd dir="auto">{visit.symptoms ?? t('unset')}</dd>
            <dt className="text-muted-foreground">{t('diagnosisLabel')}</dt>
            <dd dir="auto">{visit.diagnosis ?? t('unset')}</dd>
            <dt className="text-muted-foreground">{t('treatmentLabel')}</dt>
            <dd dir="auto">{visit.treatment ?? t('unset')}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('extraDataTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p dir="auto">{visit.notes ?? t('unset')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t('prescriptionTitle')}</CardTitle>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={visitPrescriptionPrintPath(visit.id)} target="_blank" rel="noreferrer">
              <PrinterIcon aria-hidden="true" />
              {tCommon('print')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {visit.prescriptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noPrescriptions')}</p>
          ) : (
            <ul className="space-y-2">
              {visit.prescriptions.map((item) => (
                <li key={item.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium" dir="auto">
                    {item.medication_name}
                  </p>
                  <p className="text-muted-foreground" dir="auto">
                    {[item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}
                  </p>
                  {item.instructions !== null && item.instructions !== '' ? (
                    <p dir="auto">{item.instructions}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>{t('labTitle')}</CardTitle>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={visitLabPrintPath(visit.id)} target="_blank" rel="noreferrer">
              <PrinterIcon aria-hidden="true" />
              {tCommon('print')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {visit.labOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noLabOrders')}</p>
          ) : (
            <ul className="space-y-2">
              {visit.labOrders.map((item) => (
                <li key={item.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium" dir="auto">
                    {item.analysis_name}
                  </p>
                  {item.notes !== null && item.notes !== '' ? <p dir="auto">{item.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <VisitDeleteDialog
        visit={isDeleting ? visit : null}
        onOpenChange={(open) => {
          if (!open) setIsDeleting(false)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function VitalRead({
  label,
  value,
  unset,
}: {
  label: string
  value: number | null
  unset: string
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value === null ? unset : formatNumber(Number(value))}</dd>
    </>
  )
}
