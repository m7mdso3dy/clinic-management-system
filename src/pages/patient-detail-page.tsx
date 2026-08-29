import { PencilIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PatientDeleteDialog } from '@/components/patients/patient-delete-dialog'
import { PatientFormDialog } from '@/components/patients/patient-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/i18n/format'
import {
  patientService,
  type PatientListItem,
  type PatientWriteInput,
} from '@/services/patients/patient.service'

export function PatientDetailPage() {
  const { t } = useTranslation('patients')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()
  const navigate = useNavigate()
  const { patientId } = useParams()

  const [patient, setPatient] = useState<PatientListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (patientId === undefined) return

    let isActive = true

    patientService
      .getById(patientId)
      .then((row) => {
        if (!isActive) return
        if (row === null) {
          setPatient(null)
          setLoadError(t('notFound'))
          return
        }
        setPatient(row)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setPatient(null)
        setLoadError(t('loadFailed'))
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [patientId, t])

  async function handleSave(values: PatientWriteInput) {
    if (patient === null) return

    await patientService.update(patient.id, values)
    const refreshed = await patientService.getById(patient.id)
    if (refreshed !== null) {
      setPatient(refreshed)
    }
  }

  async function handleDelete(id: string) {
    await patientService.remove(id)
    void navigate(ROUTES.patients)
  }

  if (patientId === undefined) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive text-sm">
          {t('notFound')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.patients}>{tCommon('back')}</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{tCommon('loading')}</p>
  }

  if (loadError !== null || patient === null) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-destructive text-sm">
          {loadError ?? t('notFound')}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.patients}>{tCommon('back')}</Link>
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
              to={ROUTES.patients}
              className="hover:text-foreground underline-offset-4 hover:underline"
            >
              {t('title')}
            </Link>
          </p>
          <h1 className="font-heading mt-1 text-xl font-medium" dir="auto">
            {patient.full_name}
          </h1>
        </div>

        <div className="flex flex-wrap gap-1">
          {permissions.has(PERMISSIONS.patientsUpdate) ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <PencilIcon aria-hidden="true" />
              {tCommon('edit')}
            </Button>
          ) : null}
          {permissions.has(PERMISSIONS.patientsDelete) ? (
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
            <dt className="text-muted-foreground">{t('nameLabel')}</dt>
            <dd dir="auto">{patient.full_name}</dd>

            <dt className="text-muted-foreground">{t('phoneLabel')}</dt>
            <dd>{patient.phone ?? t('unset')}</dd>

            <dt className="text-muted-foreground">{t('dateOfBirthLabel')}</dt>
            <dd>
              {patient.date_of_birth === null
                ? t('unset')
                : formatDate(patient.date_of_birth, { dateStyle: 'medium' })}
            </dd>

            <dt className="text-muted-foreground">{t('genderLabel')}</dt>
            <dd>{patient.gender === null ? t('unset') : t(`genders.${patient.gender}`)}</dd>

            <dt className="text-muted-foreground">{t('addressLabel')}</dt>
            <dd dir="auto">{patient.address ?? t('unset')}</dd>

            <dt className="text-muted-foreground">{t('notesLabel')}</dt>
            <dd dir="auto">{patient.notes ?? t('unset')}</dd>

            <dt className="text-muted-foreground">{t('lastVisitColumn')}</dt>
            <dd>
              {patient.lastVisitDate === null
                ? t('noVisits')
                : formatDate(patient.lastVisitDate, { dateStyle: 'medium' })}
            </dd>

            <dt className="text-muted-foreground">{t('initialDiagnosisColumn')}</dt>
            <dd dir="auto">
              {patient.initialDiagnosis === null || patient.initialDiagnosis.trim() === ''
                ? t('noDiagnosis')
                : patient.initialDiagnosis}
            </dd>
          </dl>
        </CardContent>
      </Card>

      {isEditing ? (
        <PatientFormDialog
          open
          mode="edit"
          patient={patient}
          onOpenChange={(open) => {
            if (!open) setIsEditing(false)
          }}
          onSubmit={handleSave}
        />
      ) : null}

      <PatientDeleteDialog
        patient={isDeleting ? patient : null}
        onOpenChange={(open) => {
          if (!open) setIsDeleting(false)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}
