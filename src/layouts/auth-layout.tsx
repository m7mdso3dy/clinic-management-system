import { Outlet } from 'react-router-dom'

import { LanguageSwitcher } from '@/components/common/language-switcher'

/** Shell for unauthenticated screens (sign-in and future recovery flows). */
export function AuthLayout() {
  return (
    <div className="bg-muted/40 relative flex min-h-svh items-center justify-center p-6">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
