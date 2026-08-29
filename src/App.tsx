import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { AppRouter } from '@/routes/app-router'
import { AuthProvider } from '@/stores/auth-provider'

export default function App() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = t('appTitle')
  }, [t, i18n.language])

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
