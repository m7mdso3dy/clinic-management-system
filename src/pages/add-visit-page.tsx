import { PlusIcon } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { PatientFormDialog } from '@/components/patients/patient-form-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PatientLookup } from '@/components/visits/patient-lookup'
import { VisitEditor } from '@/components/visits/visit-editor'
import { PERMISSIONS } from '@/constants/permissions'
import { ROUTES, visitDetailPath } from '@/constants/routes'
import { usePermissions } from '@/hooks/use-permissions'
import { patientService, type PatientWriteInput } from '@/services/patients/patient.service'
import {
  visitService,
  type VisitPatientOption,
  type VisitWriteInput,
} from '@/services/visits/visit.service'

export function AddVisitPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const navigate = useNavigate()
  const patientLookupId = useId()
  const permissions = usePermissions()

  const [patients, setPatients] = useState<VisitPatientOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [isAddingPatient, setIsAddingPatient] = useState(false)

  useEffect(() => {
    let isActive = true

    visitService
      .listPatientOptions()
      .then((rows) => {
        if (!isActive) return
        setPatients(rows)
        setLoadError(null)
      })
      .catch(() => {
        if (!isActive) return
        setLoadError(t('loadPatientsFailed'))
        setPatients([])
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [t])

  async function handleCreatePatient(values: PatientWriteInput) {
    const created = await patientService.create(values)
    const option: VisitPatientOption = {
      id: created.id,
      full_name: created.full_name,
      phone: created.phone,
    }

    setPatients((current) => {
      if (current.some((patient) => patient.id === created.id)) {
        return current
      }

      return [...current, option].sort((left, right) =>
        left.full_name.localeCompare(right.full_name),
      )
    })
    setSelectedPatientId(created.id)
  }

  async function handleSave(values: VisitWriteInput) {
    const created = await visitService.save(values)
    void navigate(visitDetailPath(created.id))
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm">
          <Link
            to={ROUTES.visits}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('title')}
          </Link>
        </p>
        <h1 className="font-heading mt-1 text-xl font-medium">{t('addTitle')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('addDescription')}</p>
      </div>

      <Card className="overflow-visible">
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={patientLookupId}>{t('patientLabel')}</Label>
            <div className="flex flex-wrap items-start gap-2">
              <PatientLookup
                key={selectedPatientId ?? 'none'}
                id={patientLookupId}
                patients={patients}
                selectedId={selectedPatientId}
                onSelect={setSelectedPatientId}
                disabled={isLoading}
              />
              {permissions.has(PERMISSIONS.patientsCreate) ? (
                <Button type="button" variant="outline" onClick={() => setIsAddingPatient(true)}>
                  <PlusIcon aria-hidden="true" />
                  {t('addPatientButton')}
                </Button>
              ) : null}
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">{tCommon('loading')}</p>
          ) : loadError !== null ? (
            <p role="alert" className="text-destructive text-sm">
              {loadError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <VisitEditor patientId={selectedPatientId} onSave={handleSave} />

      {isAddingPatient ? (
        <PatientFormDialog
          key="create-from-visit"
          open
          mode="create"
          patient={null}
          onOpenChange={(open) => {
            if (!open) setIsAddingPatient(false)
          }}
          onSubmit={handleCreatePatient}
        />
      ) : null}
    </div>
  )
}
