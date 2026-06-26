import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Watermark } from './Logo'
import { useSidebarStore } from '../stores/sidebar.store'
import { useUIStore } from '../stores/ui.store'
import { cn } from '../lib/utils'

export function Layout() {
  const collapsed = useSidebarStore(s => s.collapsed)
  const lang      = useUIStore(s => s.lang)
  const isRtl     = lang === 'ar'

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main
        id="main-content"
        className={cn(
          'min-h-screen transition-all duration-300',
          isRtl
            ? (collapsed ? 'mr-16' : 'mr-64')
            : (collapsed ? 'ml-16' : 'ml-64')
        )}
      >
        <Outlet />
      </main>
      <Watermark />
    </div>
  )
}
