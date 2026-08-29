import 'i18next'

import type enAuth from './locales/en/auth.json'
import type enCommon from './locales/en/common.json'
import type enErrors from './locales/en/errors.json'
import type enExaminationTypes from './locales/en/examinationTypes.json'
import type enHome from './locales/en/home.json'
import type enPatients from './locales/en/patients.json'
import type enRoles from './locales/en/roles.json'
import type enVisits from './locales/en/visits.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof enCommon &
      typeof enAuth &
      typeof enHome &
      typeof enErrors &
      typeof enExaminationTypes &
      typeof enPatients &
      typeof enRoles &
      typeof enVisits
  }
}
