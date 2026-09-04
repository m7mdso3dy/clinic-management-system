import {
  BanIcon,
  EyeIcon,
  ListRestartIcon,
  PauseIcon,
  PencilIcon,
  StethoscopeIcon,
  Trash2Icon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
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
import { patientDetailPath, visitDetailPath, visitEditPath } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/i18n/format'
import {
  canExamineVisit,
  isVisitHeld,
  isVisitOpened,
  type VisitListItem,
} from '@/services/visits/visit.service'

interface VisitTableProps {
  items: VisitListItem[]
  showDelete?: boolean
  showCancel?: boolean
  showHold?: boolean
  onDelete?: (item: VisitListItem) => void
  onCancel?: (item: VisitListItem) => void
  onHold?: (item: VisitListItem) => void
  onReenqueue?: (item: VisitListItem) => void
}

export function VisitTable({
  items,
  showDelete = false,
  showCancel = false,
  showHold = false,
  onDelete,
  onCancel,
  onHold,
  onReenqueue,
}: VisitTableProps) {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()

  const showActions =
    permissions.has(PERMISSIONS.visitsView) ||
    permissions.has(PERMISSIONS.visitsUpdate) ||
    (showDelete && permissions.has(PERMISSIONS.visitsDelete))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">{t('numberColumn')}</TableHead>
          <TableHead>{t('patientColumn')}</TableHead>
          <TableHead>{t('examinationTypeColumn')}</TableHead>
          <TableHead>{t('dateColumn')}</TableHead>
          <TableHead>{t('statusColumn')}</TableHead>
          {showActions ? <TableHead className="text-end">{t('actionsColumn')}</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const opened = isVisitOpened(item)
          const held = isVisitHeld(item)
          const canExamine = canExamineVisit(item)

          return (
            <TableRow key={item.id}>
              <TableCell className="tabular-nums">{item.daily_number}</TableCell>
              <TableCell className="font-medium" dir="auto">
                {item.patientName === '' ? (
                  t('unset')
                ) : permissions.has(PERMISSIONS.patientsView) ? (
                  <Link
                    to={patientDetailPath(item.patient_id)}
                    className="hover:text-foreground underline-offset-4 hover:underline"
                  >
                    {item.patientName}
                  </Link>
                ) : (
                  item.patientName
                )}
              </TableCell>
              <TableCell dir="auto">
                {item.examinationTypeName === null || item.examinationTypeName === ''
                  ? t('unset')
                  : item.examinationTypeName}
              </TableCell>
              <TableCell>{formatDate(item.visit_date, { dateStyle: 'medium' })}</TableCell>
              <TableCell>
                <VisitStatusBadge status={item.status} />
              </TableCell>
              {showActions ? (
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    {permissions.has(PERMISSIONS.visitsView) ? (
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <Link to={visitDetailPath(item.id)}>
                          <EyeIcon aria-hidden="true" />
                          {t('viewDetails')}
                        </Link>
                      </Button>
                    ) : null}
                    {permissions.has(PERMISSIONS.visitsUpdate) && canExamine ? (
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <Link to={visitEditPath(item.id)}>
                          {opened ? (
                            <StethoscopeIcon aria-hidden="true" />
                          ) : (
                            <PencilIcon aria-hidden="true" />
                          )}
                          {opened ? t('startExamination') : tCommon('edit')}
                        </Link>
                      </Button>
                    ) : null}
                    {showHold && opened && permissions.has(PERMISSIONS.visitsUpdate) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onHold?.(item)}
                      >
                        <PauseIcon aria-hidden="true" />
                        {t('holdVisit')}
                      </Button>
                    ) : null}
                    {showHold && held && permissions.has(PERMISSIONS.visitsUpdate) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onReenqueue?.(item)}
                      >
                        <ListRestartIcon aria-hidden="true" />
                        {t('reenqueueVisit')}
                      </Button>
                    ) : null}
                    {showCancel && opened && permissions.has(PERMISSIONS.visitsUpdate) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel?.(item)}
                      >
                        <BanIcon aria-hidden="true" />
                        {t('cancelVisit')}
                      </Button>
                    ) : null}
                    {showDelete && permissions.has(PERMISSIONS.visitsDelete) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(item)}
                      >
                        <Trash2Icon aria-hidden="true" />
                        {tCommon('delete')}
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
