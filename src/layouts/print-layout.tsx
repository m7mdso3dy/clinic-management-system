import { Outlet } from 'react-router-dom'

/** Minimal chrome so prescription and lab sheets print without the clinic sidebar. */
export function PrintLayout() {
  return (
    <div className="bg-background min-h-svh">
      <Outlet />
    </div>
  )
}
