import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { APP_LANGUAGES, changeAppLanguage, isAppLanguage, type AppLanguage } from '@/i18n'

const LANGUAGE_OPTIONS = Object.entries(APP_LANGUAGES) as [
  AppLanguage,
  (typeof APP_LANGUAGES)[AppLanguage],
][]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  const activeLanguage: AppLanguage = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : isAppLanguage(i18n.language)
      ? i18n.language
      : 'en'

  return (
    <div role="group" aria-label={t('language')} className="flex items-center gap-1">
      {LANGUAGE_OPTIONS.map(([code, { label }]) => {
        const isActive = activeLanguage === code

        return (
          <Button
            key={code}
            type="button"
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            lang={code}
            dir={APP_LANGUAGES[code].dir}
            aria-pressed={isActive}
            onClick={() => {
              void changeAppLanguage(code)
            }}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
