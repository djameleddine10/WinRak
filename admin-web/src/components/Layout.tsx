import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Watermark } from './Logo'
import { Toaster } from 'sonner'

export function Layout() {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300" id="main-content">
        <Outlet />
      </main>
      <Watermark />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111118',
            border: '1px solid #1E1E2E',
            color: '#F9FAFB',
          },
        }}
      />
    </div>
  )
}
