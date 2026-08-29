import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PatientDeleteDialog } from '@/components/patients/patient-delete-dialog'
import { PatientFormDialog } from '@/components/patients/patient-form-dialog'
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
import { patientDetailPath } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/i18n/format'
import {
  patientService,
  type PatientListItem,
  type PatientWriteInput,
} from '@/services/patients/patient.service'

type FormDialogState = { mode: 'create' } | { mode: 'edit'; patient: PatientListItem }

export function PatientsPage() {
  const { t } = useTranslation('patients')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()

  const [items, setItems] = useState<PatientListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormDialogState | null>(null)
  const [deleting, setDeleting] = useState<PatientListItem | null>(null)

  useEffect(() => {
    let isActive = true

    patientService
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
    const rows = await patientService.list()
    setItems(rows)
    setLoadError(null)
  }

  async function handleSave(values: PatientWriteInput) {
    if (formState === null) return

    if (formState.mode === 'create') {
      await patientService.create(values)
    } else {
      await patientService.update(formState.patient.id, values)
    }

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  async function handleDelete(id: string) {
    await patientService.remove(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  const showActions =
    permissions.has(PERMISSIONS.patientsView) ||
    permissions.has(PERMISSIONS.patientsUpdate) ||
    permissions.has(PERMISSIONS.patientsDelete)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        {permissions.has(PERMISSIONS.patientsCreate) ? (
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
                  <TableHead>{t('lastVisitColumn')}</TableHead>
                  <TableHead>{t('initialDiagnosisColumn')}</TableHead>
                  {showActions ? (
                    <TableHead className="text-end">{t('actionsColumn')}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium" dir="auto">
                      {item.full_name}
                    </TableCell>
                    <TableCell>
                      {item.lastVisitDate === null
                        ? t('noVisits')
                        : formatDate(item.lastVisitDate, { dateStyle: 'medium' })}
                    </TableCell>
                    <TableCell dir="auto">
                      {item.initialDiagnosis === null || item.initialDiagnosis.trim() === ''
                        ? t('noDiagnosis')
                        : item.initialDiagnosis}
                    </TableCell>
                    {showActions ? (
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-1">
                          {permissions.has(PERMISSIONS.patientsView) ? (
                            <Button type="button" variant="ghost" size="sm" asChild>
                              <Link to={patientDetailPath(item.id)}>
                                <EyeIcon aria-hidden="true" />
                                {t('viewDetails')}
                              </Link>
                            </Button>
                          ) : null}
                          {permissions.has(PERMISSIONS.patientsUpdate) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormState({ mode: 'edit', patient: item })}
                            >
                              <PencilIcon aria-hidden="true" />
                              {tCommon('edit')}
                            </Button>
                          ) : null}
                          {permissions.has(PERMISSIONS.patientsDelete) ? (
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
        <PatientFormDialog
          key={formState.mode === 'create' ? 'create' : formState.patient.id}
          open
          mode={formState.mode}
          patient={formState.mode === 'edit' ? formState.patient : null}
          onOpenChange={(open) => {
            if (!open) setFormState(null)
          }}
          onSubmit={handleSave}
        />
      ) : null}

      <PatientDeleteDialog
        patient={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
