import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { PatientLookup } from '@/components/visits/patient-lookup'
import { VisitEditor } from '@/components/visits/visit-editor'
import { ROUTES, visitDetailPath } from '@/constants/routes'
import {
  visitService,
  type VisitDetail,
  type VisitPatientOption,
  type VisitWriteInput,
} from '@/services/visits/visit.service'

export function EditVisitPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const navigate = useNavigate()
  const { visitId } = useParams()
  const patientLookupId = useId()

  const [visit, setVisit] = useState<VisitDetail | null>(null)
  const [patients, setPatients] = useState<VisitPatientOption[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (visitId === undefined) return

    let isActive = true

    Promise.all([visitService.getById(visitId), visitService.listPatientOptions()])
      .then(([row, options]) => {
        if (!isActive) return
        if (row === null) {
          setVisit(null)
          setLoadError(t('notFound'))
          return
        }
        setVisit(row)
        setSelectedPatientId(row.patient_id)
        setPatients(options)
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
    await visitService.save(values, visit.id)
    void navigate(visitDetailPath(visit.id))
  }

  if (visitId === undefined || isLoading) {
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
      <div>
        <p className="text-muted-foreground text-sm">
          <Link
            to={visitDetailPath(visit.id)}
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            {t('title')}
          </Link>
        </p>
        <h1 className="font-heading mt-1 text-xl font-medium">{t('editTitle')}</h1>
      </div>

      <Card className="overflow-visible">
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor={patientLookupId}>{t('patientLabel')}</Label>
            <PatientLookup
              key={selectedPatientId ?? 'none'}
              id={patientLookupId}
              patients={patients}
              selectedId={selectedPatientId}
              onSelect={setSelectedPatientId}
            />
          </div>
        </CardContent>
      </Card>

      <VisitEditor
        key={visit.id}
        patientId={selectedPatientId}
        initial={visit}
        onSave={handleSave}
      />
    </div>
  )
}
