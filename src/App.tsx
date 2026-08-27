import { AppRouter } from '@/routes/app-router'
import { AuthProvider } from '@/stores/auth-provider'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
