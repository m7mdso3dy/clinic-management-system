import 'i18next'

import type enAuth from './locales/en/auth.json'
import type enCommon from './locales/en/common.json'
import type enErrors from './locales/en/errors.json'
import type enHome from './locales/en/home.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof enCommon & typeof enAuth & typeof enHome & typeof enErrors
  }
}
