import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      className="text-muted-foreground flex min-h-svh flex-col items-center justify-center gap-3"
    >
      <Loader2Icon className="size-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{message ?? t('loading')}</p>
    </div>
  )
}
