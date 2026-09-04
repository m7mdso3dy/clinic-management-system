import { useTranslation } from 'react-i18next'

import type { VisitStatus } from '@/types/models'
import { cn } from '@/utils/cn'

interface VisitStatusBadgeProps {
  status: VisitStatus
}

const STATUS_CLASS: Record<VisitStatus, string> = {
  opened: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-muted-foreground',
  canceled: 'bg-destructive/10 text-destructive',
  held: 'bg-secondary text-secondary-foreground',
}

const STATUS_KEY: Record<
  VisitStatus,
  'statusOpened' | 'statusCompleted' | 'statusCanceled' | 'statusHeld'
> = {
  opened: 'statusOpened',
  completed: 'statusCompleted',
  canceled: 'statusCanceled',
  held: 'statusHeld',
}

export function VisitStatusBadge({ status }: VisitStatusBadgeProps) {
  const { t } = useTranslation('visits')

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status],
      )}
    >
      {t(STATUS_KEY[status])}
    </span>
  )
}
