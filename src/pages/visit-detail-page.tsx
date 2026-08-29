import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { VisitDeleteDialog } from '@/components/visits/visit-delete-dialog'
import { VisitFormDialog } from '@/components/visits/visit-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CLINIC_CURRENCY } from '@/constants/clinic'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency, formatDate } from '@/i18n/format'
import {
  visitService,
  type VisitListItem,
  type VisitWriteInput,
} from '@/services/visits/visit.service'

export function VisitDetailPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()
  const navigate = useNavigate()
  const { visitId } = useParams()

  const [visit, setVisit] = useState<VisitListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
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

  async function handleSave(values: VisitWriteInput) {
    if (visit === null) return

    await visitService.update(visit.id, values)
    const refreshed = await visitService.getById(visit.id)
    if (refreshed !== null) {
      setVisit(refreshed)
    }
  }

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
            {visit.patientName === '' ? t('unset') : visit.patientName}
          </h1>
        </div>

        <div className="flex flex-wrap gap-1">
          {permissions.has(PERMISSIONS.visitsUpdate) ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <PencilIcon aria-hidden="true" />
              {tCommon('edit')}
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
          <CardTitle>{t('detailsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{t('patientLabel')}</dt>
            <dd dir="auto">{visit.patientName === '' ? t('unset') : visit.patientName}</dd>

            <dt className="text-muted-foreground">{t('examinationTypeLabel')}</dt>
            <dd dir="auto">
              {visit.examinationTypeName === null || visit.examinationTypeName === ''
                ? t('unset')
                : visit.examinationTypeName}
            </dd>

            <dt className="text-muted-foreground">{t('dateLabel')}</dt>
            <dd>{formatDate(visit.visit_date, { dateStyle: 'medium' })}</dd>

            <dt className="text-muted-foreground">{t('amountLabel')}</dt>
            <dd>{formatCurrency(Number(visit.amount), CLINIC_CURRENCY)}</dd>

            <dt className="text-muted-foreground">{t('symptomsLabel')}</dt>
            <dd dir="auto">{visit.symptoms ?? t('unset')}</dd>

            <dt className="text-muted-foreground">{t('diagnosisLabel')}</dt>
            <dd dir="auto">{visit.diagnosis ?? t('unset')}</dd>

            <dt className="text-muted-foreground">{t('treatmentLabel')}</dt>
            <dd dir="auto">{visit.treatment ?? t('unset')}</dd>

            <dt className="text-muted-foreground">{t('notesLabel')}</dt>
            <dd dir="auto">{visit.notes ?? t('unset')}</dd>
          </dl>
        </CardContent>
      </Card>

      {isEditing ? (
        <VisitFormDialog
          open
          visit={visit}
          onOpenChange={(open) => {
            if (!open) setIsEditing(false)
          }}
          onSubmit={handleSave}
        />
      ) : null}

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
