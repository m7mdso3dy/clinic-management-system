import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/** Shell for authenticated areas of the app. */
export function AppLayout() {
  const { t, i18n } = useTranslation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const sheetSide = i18n.dir() === 'rtl' ? 'right' : 'left'

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 border-e md:sticky md:top-0 md:flex md:h-svh md:flex-col">
        <AppSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          menu={
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t('nav.openMenu')}
                >
                  <MenuIcon aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={sheetSide}
                showCloseButton
                aria-describedby={undefined}
                className="bg-sidebar text-sidebar-foreground w-60 gap-0 p-0 sm:max-w-60"
              >
                <SheetTitle className="sr-only">{t('nav.label')}</SheetTitle>
                <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
          }
        />
        <main className="flex-1 px-4 py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
