import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { VisitDeleteDialog } from '@/components/visits/visit-delete-dialog'
import { VisitFormDialog } from '@/components/visits/visit-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES, visitDetailPath } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/i18n/format'
import {
  visitService,
  type VisitListItem,
  type VisitWriteInput,
} from '@/services/visits/visit.service'

export function VisitsPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()

  const [items, setItems] = useState<VisitListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<VisitListItem | null>(null)
  const [deleting, setDeleting] = useState<VisitListItem | null>(null)

  useEffect(() => {
    let isActive = true

    visitService
      .list()
      .then((rows) => {
        if (!isActive) return
        setItems(rows)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setLoadError(t('loadFailed'))
        setItems([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [t])

  async function refreshItems() {
    const rows = await visitService.list()
    setItems(rows)
    setLoadError(null)
  }

  async function handleSave(values: VisitWriteInput) {
    if (editing === null) return

    await visitService.update(editing.id, values)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  async function handleDelete(id: string) {
    await visitService.remove(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  const showActions =
    permissions.has(PERMISSIONS.visitsView) ||
    permissions.has(PERMISSIONS.visitsUpdate) ||
    permissions.has(PERMISSIONS.visitsDelete)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        {permissions.has(PERMISSIONS.visitsCreate) ? (
          <Button type="button" asChild>
            <Link to={ROUTES.visitNew}>
              <PlusIcon aria-hidden="true" />
              {t('addButton')}
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
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
            <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('patientColumn')}</TableHead>
                  <TableHead>{t('examinationTypeColumn')}</TableHead>
                  <TableHead>{t('dateColumn')}</TableHead>
                  {showActions ? (
                    <TableHead className="text-end">{t('actionsColumn')}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium" dir="auto">
                      {item.patientName === '' ? t('unset') : item.patientName}
                    </TableCell>
                    <TableCell dir="auto">
                      {item.examinationTypeName === null || item.examinationTypeName === ''
                        ? t('unset')
                        : item.examinationTypeName}
                    </TableCell>
                    <TableCell>{formatDate(item.visit_date, { dateStyle: 'medium' })}</TableCell>
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
                          {permissions.has(PERMISSIONS.visitsUpdate) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(item)}
                            >
                              <PencilIcon aria-hidden="true" />
                              {tCommon('edit')}
                            </Button>
                          ) : null}
                          {permissions.has(PERMISSIONS.visitsDelete) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleting(item)}
                            >
                              <Trash2Icon aria-hidden="true" />
                              {tCommon('delete')}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing !== null ? (
        <VisitFormDialog
          key={editing.id}
          open
          visit={editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          onSubmit={handleSave}
        />
      ) : null}

      <VisitDeleteDialog
        visit={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
