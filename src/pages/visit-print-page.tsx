import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { VisitPrintDocument } from '@/components/visits/visit-print-document'
import { ROUTES } from '@/constants/routes'
import { visitService, type VisitDetail } from '@/services/visits/visit.service'

interface VisitPrintPageProps {
  kind: 'prescription' | 'lab'
}

export function VisitPrintPage({ kind }: VisitPrintPageProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const { visitId } = useParams()
  const [visit, setVisit] = useState<VisitDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (visitId === undefined) return

    let isActive = true

    visitService
      .getById(visitId)
      .then((row) => {
        if (!isActive) return
        if (row === null) {
          setLoadError(t('notFound'))
          return
        }
        setVisit(row)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
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

  if (isLoading) {
    return <p className="text-muted-foreground p-6 text-sm">{tCommon('loading')}</p>
  }

  if (loadError !== null || visit === null) {
    return (
      <div className="space-y-4 p-6">
        <p role="alert" className="text-destructive text-sm">
          {loadError ?? t('notFound')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.visits}>{tCommon('back')}</Link>
        </Button>
      </div>
    )
  }

  return <VisitPrintDocument kind={kind} visit={visit} />
}
