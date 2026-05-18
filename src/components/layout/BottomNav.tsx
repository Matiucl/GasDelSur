import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

interface BottomNavItem {
  to: string
  icon: string
  label: string
}

const BOTTOM_NAV: Record<UserRole, BottomNavItem[]> = {
  admin: [
    { to: '/admin', icon: 'dashboard', label: 'Inicio' },
    { to: '/admin/orders', icon: 'inventory_2', label: 'Pedidos' },
    { to: '/admin/inventory', icon: 'warehouse', label: 'Bodega' },
    { to: '/admin/settings', icon: 'person', label: 'Perfil' },
  ],
  driver: [
    { to: '/driver', icon: 'home', label: 'Inicio' },
    { to: '/driver/orders', icon: 'local_shipping', label: 'Pedidos' },
    { to: '/driver/routes', icon: 'map', label: 'Rutas' },
    { to: '/driver/profile', icon: 'person', label: 'Perfil' },
  ],
  client: [
    { to: '/client', icon: 'home', label: 'Inicio' },
    { to: '/client/new-order', icon: 'add_shopping_cart', label: 'Pedir' },
    { to: '/client/tracking', icon: 'local_shipping', label: 'Tracking' },
    { to: '/client/profile', icon: 'person', label: 'Perfil' },
  ],
}

export function BottomNav() {
  const { user } = useAuth()
  if (!user) return null

  const items = BOTTOM_NAV[user.role]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant pb-safe z-50">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.split('/').length <= 2}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center px-4 py-1 rounded-full transition-all ${
              isActive
                ? 'bg-primary-container text-white scale-95'
                : 'text-on-surface-variant'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} className="text-[22px]" />
              <span className="text-[11px] font-semibold mt-0.5">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
