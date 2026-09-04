import { PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { OpenVisitDialog } from '@/components/visits/open-visit-dialog'
import { VisitCancelDialog } from '@/components/visits/visit-cancel-dialog'
import { VisitDeleteDialog } from '@/components/visits/visit-delete-dialog'
import { VisitQueueDialog } from '@/components/visits/visit-queue-dialog'
import { VisitTable } from '@/components/visits/visit-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermissions } from '@/hooks/use-permissions'
import { visitService, type VisitListItem } from '@/services/visits/visit.service'

export function VisitsPage() {
  const { t } = useTranslation('visits')
  const { t: tCommon } = useTranslation()
  const permissions = usePermissions()

  const [items, setItems] = useState<VisitListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [deleting, setDeleting] = useState<VisitListItem | null>(null)
  const [canceling, setCanceling] = useState<VisitListItem | null>(null)
  const [holding, setHolding] = useState<VisitListItem | null>(null)
  const [reenqueuing, setReenqueuing] = useState<VisitListItem | null>(null)

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

  async function handleCreated() {
    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  async function handleCancel(id: string) {
    await visitService.cancel(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
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

  async function handleDelete(id: string) {
    await visitService.remove(id)

    try {
      await refreshItems()
    } catch {
      setLoadError(t('loadFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-medium">{t('title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
        </div>

        {permissions.has(PERMISSIONS.visitsCreate) ? (
          <Button type="button" onClick={() => setIsOpening(true)}>
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
            <VisitTable
              items={items}
              showDelete
              showCancel
              showHold
              onDelete={setDeleting}
              onCancel={setCanceling}
              onHold={setHolding}
              onReenqueue={setReenqueuing}
            />
          )}
        </CardContent>
      </Card>

      {isOpening ? (
        <OpenVisitDialog open onOpenChange={setIsOpening} onCreated={handleCreated} />
      ) : null}

      <VisitCancelDialog
        visit={canceling}
        onOpenChange={(open) => {
          if (!open) setCanceling(null)
        }}
        onConfirm={handleCancel}
      />

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
