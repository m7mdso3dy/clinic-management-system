import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ExaminationTypeDeleteDialog } from '@/components/examination-types/examination-type-delete-dialog'
import {
  ExaminationTypeFormDialog,
  type ExaminationTypeFormValues,
} from '@/components/examination-types/examination-type-form-dialog'
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
import { CLINIC_CURRENCY } from '@/constants/clinic'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermissions } from '@/hooks/use-permissions'
import { formatCurrency } from '@/i18n/format'
import { examinationTypeService } from '@/services/lookups/examination-type.service'
import type { ExaminationType } from '@/types/models'

type FormDialogState = { mode: 'create' } | { mode: 'edit'; examinationType: ExaminationType }

export function ExaminationTypesPage() {
  const { t } = useTranslation('examinationTypes')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()

  const [items, setItems] = useState<ExaminationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormDialogState | null>(null)
  const [deleting, setDeleting] = useState<ExaminationType | null>(null)

  useEffect(() => {
    let isActive = true

    examinationTypeService
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
    const rows = await examinationTypeService.list()
    setItems(rows)
    setLoadError(null)
  }

  async function handleSave(values: ExaminationTypeFormValues) {
    if (formState === null) return

    if (formState.mode === 'create') {
      await examinationTypeService.create(values)
    } else {
      await examinationTypeService.update(formState.examinationType.id, values)
    }

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  async function handleDelete(id: string) {
    await examinationTypeService.remove(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  const showActions =
    permissions.has(PERMISSIONS.examinationTypesUpdate) ||
    permissions.has(PERMISSIONS.examinationTypesDelete)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        {permissions.has(PERMISSIONS.examinationTypesCreate) ? (
          <Button type="button" onClick={() => setFormState({ mode: 'create' })}>
            <PlusIcon aria-hidden="true" />
            {t('addButton')}
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
                  <TableHead>{t('nameColumn')}</TableHead>
                  <TableHead>{t('costColumn')}</TableHead>
                  {showActions ? (
                    <TableHead className="text-end">{t('actionsColumn')}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium" dir="auto">
                      {item.name}
                    </TableCell>
                    <TableCell>{formatCurrency(Number(item.cost), CLINIC_CURRENCY)}</TableCell>
                    {showActions ? (
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          {permissions.has(PERMISSIONS.examinationTypesUpdate) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormState({ mode: 'edit', examinationType: item })}
                            >
                              <PencilIcon aria-hidden="true" />
                              {tCommon('edit')}
                            </Button>
                          ) : null}
                          {permissions.has(PERMISSIONS.examinationTypesDelete) ? (
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

      {formState !== null ? (
        <ExaminationTypeFormDialog
          key={formState.mode === 'create' ? 'create' : formState.examinationType.id}
          open
          mode={formState.mode}
          initialName={formState.mode === 'edit' ? formState.examinationType.name : ''}
          initialCost={
            formState.mode === 'edit' ? Number(formState.examinationType.cost) : undefined
          }
          onOpenChange={(open) => {
            if (!open) setFormState(null)
          }}
          onSubmit={handleSave}
        />
      ) : null}

      <ExaminationTypeDeleteDialog
        examinationType={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
