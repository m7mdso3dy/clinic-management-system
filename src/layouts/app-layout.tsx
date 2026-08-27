import { Outlet } from 'react-router-dom'

import { AppHeader } from '@/components/layout/app-header'

/** Shell for authenticated areas of the app. */
export function AppLayout() {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
