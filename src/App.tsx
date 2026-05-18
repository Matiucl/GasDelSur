import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'

// Auth
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Admin
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage'

// Driver
import { DriverHomePage } from '@/pages/driver/DriverHomePage'

// Client
import { ClientHomePage } from '@/pages/client/ClientHomePage'
import { ClientNewOrderPage } from '@/pages/client/ClientNewOrderPage'
import { ClientTrackingPage } from '@/pages/client/ClientTrackingPage'
import { ClientProfilePage } from '@/pages/client/ClientProfilePage'

// Placeholder
import { PlaceholderPage } from '@/pages/PlaceholderPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  if (user?.role === 'driver') return <Navigate to="/driver" replace />
  return <Navigate to="/client" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AppShell pageTitle="Administración" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="orders" element={<PlaceholderPage title="Gestión de Pedidos" icon="inventory_2" />} />
        <Route path="orders/new" element={<PlaceholderPage title="Nuevo Pedido" icon="add_shopping_cart" />} />
        <Route path="orders/:id" element={<PlaceholderPage title="Detalle de Pedido" icon="receipt_long" />} />
        <Route path="routes" element={<PlaceholderPage title="Rutas del Día" icon="map" />} />
        <Route path="clients" element={<PlaceholderPage title="Clientes" icon="group" />} />
        <Route path="settings" element={<PlaceholderPage title="Ajustes" icon="settings" />} />
      </Route>

      {/* DRIVER */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute role="driver">
            <AppShell pageTitle="Panel del Chofer" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DriverHomePage />} />
        <Route path="orders" element={<PlaceholderPage title="Mis Pedidos" icon="inventory_2" />} />
        <Route path="routes" element={<PlaceholderPage title="Mis Rutas" icon="map" />} />
        <Route path="profile" element={<PlaceholderPage title="Mi Perfil" icon="person" />} />
      </Route>

      {/* CLIENT */}
      <Route
        path="/client"
        element={
          <ProtectedRoute role="client">
            <AppShell pageTitle="Gas del Sur" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHomePage />} />
        <Route path="new-order" element={<ClientNewOrderPage />} />
        <Route path="orders" element={<PlaceholderPage title="Mis Pedidos" icon="inventory_2" />} />
        <Route path="tracking" element={<ClientTrackingPage />} />
        <Route path="profile" element={<ClientProfilePage />} />
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
