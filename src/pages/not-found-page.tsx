import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <p className="text-muted-foreground font-mono text-sm">404</p>
        <h1 className="font-heading text-xl font-medium">Page not found</h1>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link to={ROUTES.home}>Back to app</Link>
      </Button>
    </div>
  )
}
