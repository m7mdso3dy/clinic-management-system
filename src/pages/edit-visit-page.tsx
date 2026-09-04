import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VisitEditor } from '@/components/visits/visit-editor'
import { VisitStatusBadge } from '@/components/visits/visit-status-badge'
import { CLINIC_CURRENCY } from '@/constants/clinic'
import { ROUTES, visitDetailPath, visitEditPath } from '@/constants/routes'
import { formatCurrency, formatDate } from '@/i18n/format'
import {
  isVisitCanceled,
  isVisitHeld,
  isVisitOpened,
  visitService,
  type VisitDetail,
  type VisitListItem,
  type VisitWriteInput,
} from '@/services/visits/visit.service'

export function EditVisitPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const navigate = useNavigate()
  const { visitId } = useParams()

  const [visit, setVisit] = useState<VisitDetail | null>(null)
  const [nextVisit, setNextVisit] = useState<VisitListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (visitId === undefined) return

    let isActive = true

    visitService
      .getById(visitId)
      .then(async (row) => {
        if (!isActive) return
        if (row === null) {
          setVisit(null)
          setNextVisit(null)
          setLoadError(t('notFound'))
          return
        }

        const next = await visitService.getNextOpenedInDay(row)
        if (!isActive) return
        setVisit(row)
        setNextVisit(next)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setVisit(null)
        setNextVisit(null)
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

  async function handleSave(values: VisitWriteInput, intent: 'save' | 'next') {
    if (visit === null) return
    await visitService.save(values, visit.id)

    if (intent === 'next' && nextVisit !== null) {
      void navigate(visitEditPath(nextVisit.id))
      return
    }

    void navigate(visitDetailPath(visit.id))
  }

  if (visitId === undefined || isLoading || (visit !== null && visit.id !== visitId)) {
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

  const opened = isVisitOpened(visit)
  const canceled = isVisitCanceled(visit)
  const held = isVisitHeld(visit)

  if (canceled || held) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-muted-foreground text-sm">
          {held ? t('visitHeldNotice') : t('visitCanceledNotice')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={visitDetailPath(visit.id)}>{tCommon('back')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          <Link
            to={visitDetailPath(visit.id)}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('title')}
          </Link>
        </p>
        <h1 className="font-heading mt-1 text-xl font-medium">
          {opened ? t('startTitle') : t('editTitle')}
        </h1>
        {opened ? (
          <p className="text-muted-foreground mt-1 text-sm">{t('startDescription')}</p>
        ) : null}
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>{t('visitInfoTitle')}</CardTitle>
          <VisitStatusBadge status={visit.status} />
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <dt className="text-muted-foreground">{t('visitNumberLabel')}</dt>
            <dd>{visit.daily_number}</dd>
            <dt className="text-muted-foreground">{t('patientLabel')}</dt>
            <dd dir="auto">{visit.patientName === '' ? t('unset') : visit.patientName}</dd>
            <dt className="text-muted-foreground">{t('examinationTypeLabel')}</dt>
            <dd dir="auto">{visit.examinationTypeName ?? t('unset')}</dd>
            <dt className="text-muted-foreground">{t('dateLabel')}</dt>
            <dd>{formatDate(visit.visit_date, { dateStyle: 'medium' })}</dd>
            <dt className="text-muted-foreground">{t('amountLabel')}</dt>
            <dd>{formatCurrency(Number(visit.amount), CLINIC_CURRENCY)}</dd>
          </dl>
        </CardContent>
      </Card>

      <VisitEditor
        key={visit.id}
        visit={visit}
        submitKey={opened ? 'completeExamination' : 'saveVisit'}
        showNext={opened && nextVisit !== null}
        onSave={handleSave}
      />
    </div>
  )
}
