import { Outlet } from 'react-router-dom'
import { SideNav } from './SideNav'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'

interface AppShellProps {
  pageTitle?: string
}

export function AppShell({ pageTitle }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-on-background">
      <SideNav />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar title={pageTitle} showLogo={false} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
