import { Outlet } from 'react-router-dom'

/** Shell for unauthenticated screens (sign-in and future recovery flows). */
export function AuthLayout() {
  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  )
}
