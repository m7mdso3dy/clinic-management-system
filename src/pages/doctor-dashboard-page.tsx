import { PlayIcon } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VisitQueueDialog } from '@/components/visits/visit-queue-dialog'
import { VisitTable } from '@/components/visits/visit-table'
import { visitEditPath } from '@/constants/routes'
import { isVisitError, visitService, type VisitListItem } from '@/services/visits/visit.service'
import { todayDateInputValue } from '@/utils/date-input'

export function DoctorDashboardPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const { t: tNav } = useTranslation()
  const navigate = useNavigate()
  const dateId = useId()

  const [selectedDate, setSelectedDate] = useState('')
  const [items, setItems] = useState<VisitListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [startDayError, setStartDayError] = useState<string | null>(null)
  const [isStartingDay, setIsStartingDay] = useState(false)
  const [holding, setHolding] = useState<VisitListItem | null>(null)
  const [reenqueuing, setReenqueuing] = useState<VisitListItem | null>(null)

  const isFiltered = selectedDate.trim() !== ''

  useEffect(() => {
    let isActive = true

    visitService
      .listForDoctorDashboard(selectedDate)
      .then((rows) => {
        if (!isActive) return
        setItems(rows)
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setItems([])
        setLoadError(
          isVisitError(error) && error.kind === 'invalid_date' ? t('invalidDate') : t('loadFailed'),
        )
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [selectedDate, t])

  async function refreshItems() {
    const rows = await visitService.listForDoctorDashboard(selectedDate)
    setItems(rows)
    setLoadError(null)
  }

  async function handleHold(id: string) {
    await visitService.hold(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  async function handleReenqueue(id: string) {
    await visitService.reenqueue(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  function applyDate(next: string) {
    setSelectedDate(next)
    setIsLoading(true)
  }

  async function handleStartDay() {
    setStartDayError(null)
    setIsStartingDay(true)

    try {
      const first = await visitService.getFirstOpenedInDay(todayDateInputValue())
      if (first === null) {
        setStartDayError(t('startDayEmpty'))
        return
      }

      void navigate(visitEditPath(first.id))
    } catch {
      setStartDayError(t('startDayFailed'))
    } finally {
      setIsStartingDay(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-medium">{tNav('nav.doctorDashboard')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('doctorDashboardDescription')}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="button"
            disabled={isStartingDay}
            onClick={() => {
              void handleStartDay()
            }}
          >
            <PlayIcon aria-hidden="true" />
            {isStartingDay ? tCommon('loading') : t('startDay')}
          </Button>
          <div className="space-y-1.5">
            <Label htmlFor={dateId}>{t('dateLabel')}</Label>
            <Input
              id={dateId}
              type="date"
              value={selectedDate}
              onChange={(event) => applyDate(event.target.value)}
            />
          </div>
          {isFiltered ? (
            <Button type="button" variant="outline" onClick={() => applyDate('')}>
              {t('showAllVisits')}
            </Button>
          ) : null}
        </div>
      </div>

      {startDayError !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {startDayError}
        </p>
      ) : null}

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
            <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">
              {isFiltered ? t('doctorDashboardEmpty') : t('empty')}
            </p>
          ) : (
            <VisitTable items={items} showHold onHold={setHolding} onReenqueue={setReenqueuing} />
          )}
        </CardContent>
      </Card>

      <VisitQueueDialog
        action="hold"
        visit={holding}
        onOpenChange={(open) => {
          if (!open) setHolding(null)
        }}
        onConfirm={handleHold}
      />

      <VisitQueueDialog
        action="reenqueue"
        visit={reenqueuing}
        onOpenChange={(open) => {
          if (!open) setReenqueuing(null)
        }}
        onConfirm={handleReenqueue}
      />
    </div>
  )
}
