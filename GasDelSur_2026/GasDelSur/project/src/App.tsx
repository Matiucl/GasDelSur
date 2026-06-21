import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'

// Auth
import { LoginPage }    from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Admin
import { AdminHomePage }      from '@/pages/admin/AdminHomePage'
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage'
import { AdminOrdersPage }    from '@/pages/admin/AdminOrdersPage'
import { AdminNewOrderPage }  from '@/pages/admin/AdminNewOrderPage'
import { AdminRoutesPage }    from '@/pages/admin/AdminRoutesPage'
import { AdminClientsPage }   from '@/pages/admin/AdminClientsPage'
import { AdminSettingsPage }  from '@/pages/admin/AdminSettingsPage'

// Driver
import { DriverHomePage }    from '@/pages/driver/DriverHomePage'
import { DriverRoutesPage }  from '@/pages/driver/DriverRoutesPage'
import { DriverOrdersPage }  from '@/pages/driver/DriverOrdersPage'
import { DriverProfilePage } from '@/pages/driver/DriverProfilePage'

// Client
import { ClientHomePage }      from '@/pages/client/ClientHomePage'
import { ClientNewOrderPage }  from '@/pages/client/ClientNewOrderPage'
import { ClientTrackingPage }  from '@/pages/client/ClientTrackingPage'
import { ClientProfilePage }   from '@/pages/client/ClientProfilePage'
import { ClientOrdersPage }    from '@/pages/client/ClientOrdersPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin')  return <Navigate to="/admin"  replace />
  if (user?.role === 'driver') return <Navigate to="/driver" replace />
  return <Navigate to="/client" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"       element={<RootRedirect />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── ADMIN ─────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AppShell pageTitle="Administración" />
          </ProtectedRoute>
        }
      >
        <Route index           element={<AdminHomePage />} />
        <Route path="orders"   element={<AdminOrdersPage />} />
        <Route path="orders/new" element={<AdminNewOrderPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="routes"   element={<AdminRoutesPage />} />
        <Route path="clients"  element={<AdminClientsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* ── DRIVER ────────────────────────────────────── */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute role="driver">
            <AppShell pageTitle="Panel del Chofer" />
          </ProtectedRoute>
        }
      >
        <Route index          element={<DriverHomePage />} />
        <Route path="routes"  element={<DriverRoutesPage />} />
        <Route path="orders"  element={<DriverOrdersPage />} />
        <Route path="profile" element={<DriverProfilePage />} />
      </Route>

      {/* ── CLIENT ────────────────────────────────────── */}
      <Route
        path="/client"
        element={
          <ProtectedRoute role="client">
            <AppShell pageTitle="Gas del Sur" />
          </ProtectedRoute>
        }
      >
        <Route index            element={<ClientHomePage />} />
        <Route path="new-order" element={<ClientNewOrderPage />} />
        <Route path="orders"    element={<ClientOrdersPage />} />
        <Route path="tracking"  element={<ClientTrackingPage />} />
        <Route path="profile"   element={<ClientProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
