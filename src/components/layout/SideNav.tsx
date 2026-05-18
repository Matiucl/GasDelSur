import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

interface NavItem {
  to: string
  icon: string
  label: string
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { to: '/admin', icon: 'dashboard', label: 'Inicio' },
    { to: '/admin/orders', icon: 'inventory_2', label: 'Pedidos' },
    { to: '/admin/inventory', icon: 'warehouse', label: 'Inventario' },
    { to: '/admin/routes', icon: 'map', label: 'Rutas' },
    { to: '/admin/clients', icon: 'group', label: 'Clientes' },
    { to: '/admin/settings', icon: 'settings', label: 'Ajustes' },
  ],
  driver: [
    { to: '/driver', icon: 'dashboard', label: 'Inicio' },
    { to: '/driver/orders', icon: 'inventory_2', label: 'Mis Pedidos' },
    { to: '/driver/routes', icon: 'map', label: 'Rutas' },
  ],
  client: [
    { to: '/client', icon: 'dashboard', label: 'Inicio' },
    { to: '/client/new-order', icon: 'add_shopping_cart', label: 'Nuevo Pedido' },
    { to: '/client/orders', icon: 'inventory_2', label: 'Mis Pedidos' },
    { to: '/client/tracking', icon: 'local_shipping', label: 'Seguimiento' },
    { to: '/client/profile', icon: 'person', label: 'Perfil' },
  ],
}

export function SideNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const items = NAV_ITEMS[user.role]

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administración · Araucanía',
    driver: 'Chofer de Ruta',
    client: 'Cliente Residencial',
  }

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 left-0 p-4 gap-2 bg-surface-container-low border-r border-outline-variant w-64 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-1">
        <Icon name="mode_fan" filled className="text-primary text-3xl" />
        <span className="font-black text-xl text-primary tracking-tight">Gas del Sur</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-surface-container-high rounded-xl">
        <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center shrink-0">
          <Icon name="person" className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{user.name}</p>
          <p className="text-xs text-on-surface-variant">{roleLabel[user.role]}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                isActive
                  ? 'bg-primary-container text-white font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`
            }
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-outline-variant pt-2 flex flex-col gap-1">
        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/admin/orders/new')}
            className="bg-primary text-white w-full py-2.5 rounded-lg text-sm font-semibold mb-2 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
          >
            <Icon name="add" />
            Nuevo Pedido
          </button>
        )}
        <button className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-high rounded-lg transition-all text-sm">
          <Icon name="support_agent" />
          Soporte
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 text-on-surface-variant hover:text-on-surface px-4 py-2 hover:bg-surface-container-high rounded-lg transition-all text-sm"
        >
          <Icon name="logout" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
