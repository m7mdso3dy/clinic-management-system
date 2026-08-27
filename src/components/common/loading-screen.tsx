import { Loader2Icon } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <div
      role="status"
      className="text-muted-foreground flex min-h-svh flex-col items-center justify-center gap-3"
    >
      <Loader2Icon className="size-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
