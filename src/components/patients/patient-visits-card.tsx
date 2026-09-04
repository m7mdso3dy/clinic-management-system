import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { VisitStatusBadge } from '@/components/visits/visit-status-badge'
import { PERMISSIONS } from '@/constants/permissions'
import { visitDetailPath } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/i18n/format'
import { visitService, type VisitListItem } from '@/services/visits/visit.service'

interface PatientVisitsCardProps {
  patientId: string
}

export function PatientVisitsCard({ patientId }: PatientVisitsCardProps) {
  const { t } = useTranslation('patients')
  const { t: tVisits } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()
  const canOpenVisit = permissions.has(PERMISSIONS.visitsView)

  const [items, setItems] = useState<VisitListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    visitService
      .listByPatient(patientId)
      .then((rows) => {
        if (!isActive) return
        setItems(rows)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setItems([])
        setLoadError(tVisits('loadFailed'))
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [patientId, tVisits])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentVisitsTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">
            {tCommon('loading')}
          </p>
        ) : loadError !== null ? (
          <p role="alert" className="text-destructive px-(--card-spacing) py-6 text-sm">
            {loadError}
          </p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">{t('noVisits')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{tVisits('numberColumn')}</TableHead>
                <TableHead>{tVisits('dateColumn')}</TableHead>
                <TableHead>{tVisits('examinationTypeColumn')}</TableHead>
                <TableHead>{tVisits('statusColumn')}</TableHead>
                <TableHead>{tVisits('diagnosisLabel')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={canOpenVisit ? 'relative' : undefined}>
                  <TableCell className="tabular-nums">{item.daily_number}</TableCell>
                  <TableCell>
                    {canOpenVisit ? (
                      <Link
                        to={visitDetailPath(item.id)}
                        className="hover:text-foreground after:absolute after:inset-0"
                      >
                        {formatDate(item.visit_date, { dateStyle: 'medium' })}
                      </Link>
                    ) : (
                      formatDate(item.visit_date, { dateStyle: 'medium' })
                    )}
                  </TableCell>
                  <TableCell dir="auto">
                    {item.examinationTypeName === null || item.examinationTypeName === ''
                      ? tVisits('unset')
                      : item.examinationTypeName}
                  </TableCell>
                  <TableCell>
                    <VisitStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell
                    className="max-w-64 truncate"
                    dir="auto"
                    title={item.diagnosis ?? undefined}
                  >
                    {item.diagnosis === null || item.diagnosis.trim() === ''
                      ? t('noDiagnosis')
                      : item.diagnosis}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
