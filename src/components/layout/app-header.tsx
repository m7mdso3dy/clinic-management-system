import { LogOutIcon, StethoscopeIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/constants/roles'
import { useAuth } from '@/hooks/use-auth'

export function AppHeader() {
  const { profile, role, signOut } = useAuth()

  return (
    <header className="bg-card border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <StethoscopeIcon className="text-primary size-5" aria-hidden="true" />
          <span className="font-heading text-sm font-medium">Clinic Management</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs leading-tight">
            <p className="font-medium">{profile?.full_name ?? '—'}</p>
            <p className="text-muted-foreground">{role ? ROLE_LABELS[role] : 'No role assigned'}</p>
          </div>

          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOutIcon aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
