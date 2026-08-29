import { DEFAULT_LANGUAGE, isAppLanguage } from '@/i18n'

/**
 * Native `Intl` helpers. Dates, numbers, and currency follow the active
 * application language (`en` or `ar-EG`) rather than a third-party locale lib.
 */

function activeLocale(): string {
  const lang = document.documentElement.lang
  return isAppLanguage(lang) ? lang : DEFAULT_LANGUAGE
}

export function formatDate(
  value: Date | number | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(activeLocale(), options).format(date)
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(activeLocale(), options).format(value)
}

export function formatCurrency(
  value: number,
  currency: string,
  options?: Omit<Intl.NumberFormatOptions, 'style' | 'currency'>,
): string {
  return new Intl.NumberFormat(activeLocale(), {
    ...options,
    style: 'currency',
    currency,
  }).format(value)
}
