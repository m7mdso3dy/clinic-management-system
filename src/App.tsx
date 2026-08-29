import { useEffect } from 'react'
import { Direction } from 'radix-ui'
import { useTranslation } from 'react-i18next'

import { AppRouter } from '@/routes/app-router'
import { AuthProvider } from '@/stores/auth-provider'

export default function App() {
  const { t, i18n } = useTranslation()
  const dir = i18n.dir() === 'rtl' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.title = t('appTitle')
  }, [t, i18n.language])

  return (
    <Direction.Provider dir={dir}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </Direction.Provider>
  )
}
