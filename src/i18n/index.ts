import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import arEGAuth from './locales/ar-EG/auth.json'
import arEGCommon from './locales/ar-EG/common.json'
import arEGErrors from './locales/ar-EG/errors.json'
import arEGExaminationTypes from './locales/ar-EG/examinationTypes.json'
import arEGHome from './locales/ar-EG/home.json'
import arEGPatients from './locales/ar-EG/patients.json'
import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import enExaminationTypes from './locales/en/examinationTypes.json'
import enHome from './locales/en/home.json'
import enPatients from './locales/en/patients.json'

/**
 * i18n bootstrap.
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

export const LANGUAGE_STORAGE_KEY = 'app_language'

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

export const DEFAULT_LANGUAGE: AppLanguage = 'en'

export const SUPPORTED_LANGUAGES = Object.keys(APP_LANGUAGES) as AppLanguage[]

const resources = {
  en: {
    ...enCommon,
    ...enAuth,
    ...enHome,
    ...enErrors,
    ...enExaminationTypes,
    ...enPatients,
  },
  'ar-EG': {
    ...arEGCommon,
    ...arEGAuth,
    ...arEGHome,
    ...arEGErrors,
    ...arEGExaminationTypes,
    ...arEGPatients,
  },
} as const

export const APP_NAMESPACES = [
  'common',
  'auth',
  'home',
  'errors',
  'examinationTypes',
  'patients',
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

export function readStoredLanguage(): AppLanguage {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

function persistLanguage(language: AppLanguage): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Storage can be unavailable (private mode, quota, disabled cookies).
  }
}

/** Change language, persist the choice, and update document lang/dir. */
export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  persistLanguage(language)
  applyDocumentLanguage(language)
  await i18n.changeLanguage(language)
}

const initialLanguage = readStoredLanguage()

applyDocumentLanguage(initialLanguage)

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
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
