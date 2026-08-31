import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import arEGAuth from './locales/ar-EG/auth.json'
import arEGCommon from './locales/ar-EG/common.json'
import arEGErrors from './locales/ar-EG/errors.json'
import arEGExaminationTypes from './locales/ar-EG/examinationTypes.json'
import arEGHome from './locales/ar-EG/home.json'
import arEGPatients from './locales/ar-EG/patients.json'
import arEGPayments from './locales/ar-EG/payments.json'
import arEGRoles from './locales/ar-EG/roles.json'
import arEGVisits from './locales/ar-EG/visits.json'
import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import enExaminationTypes from './locales/en/examinationTypes.json'
import enHome from './locales/en/home.json'
import enPatients from './locales/en/patients.json'
import enPayments from './locales/en/payments.json'
import enRoles from './locales/en/roles.json'
import enVisits from './locales/en/visits.json'

/**
 * i18n bootstrap.
 *
 * The UI language is Arabic (`ar-EG`, RTL). English locale files remain for
 * when a language switcher is restored.
 *
 * To add a language later:
 * 1. Create `src/i18n/locales/{code}/*.json` for each namespace.
 * 2. Import the files and register them on `resources`.
 * 3. Add an entry to `APP_LANGUAGES` with its label and text direction.
 *
 * To add a namespace later (e.g. patients, visits):
 * 1. Add `{namespace}.json` under each locale folder.
 * 2. Merge it into that language's resource object and list it in `ns`.
 */

export const APP_LANGUAGES = {
  en: {
    label: 'English',
    dir: 'ltr',
  },
  'ar-EG': {
    label: 'العربية',
    dir: 'rtl',
  },
} as const

export type AppLanguage = keyof typeof APP_LANGUAGES

export const DEFAULT_LANGUAGE: AppLanguage = 'ar-EG'

export const SUPPORTED_LANGUAGES = Object.keys(APP_LANGUAGES) as AppLanguage[]

const resources = {
  en: {
    ...enCommon,
    ...enAuth,
    ...enHome,
    ...enErrors,
    ...enExaminationTypes,
    ...enPatients,
    ...enPayments,
    ...enRoles,
    ...enVisits,
  },
  'ar-EG': {
    ...arEGCommon,
    ...arEGAuth,
    ...arEGHome,
    ...arEGErrors,
    ...arEGExaminationTypes,
    ...arEGPatients,
    ...arEGPayments,
    ...arEGRoles,
    ...arEGVisits,
  },
} as const

export const APP_NAMESPACES = [
  'common',
  'auth',
  'home',
  'errors',
  'examinationTypes',
  'patients',
  'payments',
  'roles',
  'visits',
] as const

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value !== null && value !== undefined && value in APP_LANGUAGES
}

export function getLanguageDirection(language: AppLanguage): 'ltr' | 'rtl' {
  return APP_LANGUAGES[language].dir
}

export function applyDocumentLanguage(language: AppLanguage): void {
  document.documentElement.lang = language
  document.documentElement.dir = getLanguageDirection(language)
}

applyDocumentLanguage(DEFAULT_LANGUAGE)

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: 'common',
  ns: [...APP_NAMESPACES],
  load: 'currentOnly',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

i18n.on('languageChanged', (lng) => {
  if (isAppLanguage(lng)) {
    applyDocumentLanguage(lng)
  }
})

export default i18n
