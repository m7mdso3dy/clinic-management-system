import { TriangleAlertIcon } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

interface EnvErrorScreenProps {
  missing: string[]
}

/**
 * Rendered instead of the app when required environment variables are absent,
 * so a misconfigured setup fails with an actionable message rather than a
 * blank page.
 */
export function EnvErrorScreen({ missing }: EnvErrorScreenProps) {
  const { t } = useTranslation('errors')

  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="bg-card text-card-foreground ring-foreground/10 w-full max-w-lg rounded-xl p-6 ring-1">
        <div className="text-destructive flex items-center gap-2">
          <TriangleAlertIcon className="size-5" aria-hidden="true" />
          <h1 className="font-heading text-base font-medium">{t('envTitle')}</h1>
        </div>

        <p className="text-muted-foreground mt-3 text-sm">
          {missing.length === 1 ? t('envMissingOne') : t('envMissingOther')}
        </p>

        <ul className="mt-3 space-y-1">
          {missing.map((name) => (
            <li key={name} className="bg-muted rounded-md px-2 py-1 font-mono text-xs">
              {name}
            </li>
          ))}
        </ul>

        <p className="text-muted-foreground mt-4 text-sm">
          <Trans
            ns="errors"
            i18nKey="envHint"
            components={{
              example: <code className="font-mono text-xs" />,
              envFile: <code className="font-mono text-xs" />,
            }}
          />
        </p>
      </div>
    </div>
  )
}
