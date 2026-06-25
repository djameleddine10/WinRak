import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from './stores/auth.store'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Drivers from './pages/Drivers'
import Passengers from './pages/Passengers'
import Rides from './pages/Rides'
import Restaurants from './pages/Restaurants'
import Pharmacies from './pages/Pharmacies'
import Pricing from './pages/Pricing'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="passengers" element={<Passengers />} />
          <Route path="rides" element={<Rides />} />
          <Route path="restaurants" element={<Restaurants />} />
          <Route path="pharmacies" element={<Pharmacies />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
