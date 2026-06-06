import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import { useOrders } from '@/lib/hooks'
import { resetDB } from '@/lib/db'

export function ClientProfilePage() {
  const { user, logout } = useAuth()
  const { orders, refresh } = useOrders()
  const navigate = useNavigate()

  const myOrders = orders.filter((o) => o.clientName === user?.name)
  const delivered = myOrders.filter((o) => ['Entregado','Finalizado'].includes(o.status)).length
  const totalSpent = myOrders
    .filter((o) => ['Entregado','Finalizado'].includes(o.status))
    .reduce((s, o) => s + o.total, 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleReset = () => {
    if (confirm('¿Resetear todos los datos demo? Esto restaura el estado inicial.')) {
      resetDB()
      refresh()
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[600px] mx-auto">
      <h2 className="text-2xl font-black text-on-surface">Mi Perfil</h2>

      {/* Avatar card */}
      <div className="bg-primary-container text-white p-6 rounded-2xl flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
          <Icon name="person" className="text-5xl" />
        </div>
        <div>
          <p className="text-xl font-black">{user?.name}</p>
          <p className="text-sm opacity-80 mt-0.5">Cliente Gas del Sur</p>
          <p className="text-xs opacity-70 mt-1">RUT: {user?.rut}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <Icon name="check_circle" className="text-primary mb-2" />
          <p className="text-2xl font-black text-on-surface">{delivered}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Pedidos Recibidos</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <Icon name="payments" className="text-primary mb-2" />
          <p className="text-2xl font-black text-on-surface">${totalSpent.toLocaleString('es-CL')}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Total Gastado</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
        {[
          { icon: 'email',         label: 'Correo',    value: user?.email },
          { icon: 'phone',         label: 'Teléfono',  value: user?.phone },
          { icon: 'badge',         label: 'RUT',       value: user?.rut },
          { icon: 'location_city', label: 'Ciudad',    value: 'Temuco, Araucanía' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 p-4">
            <Icon name={item.icon} className="text-on-surface-variant" />
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="text-sm font-semibold text-on-surface">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dev reset */}
      <button
        onClick={handleReset}
        className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
      >
        <Icon name="refresh" /> Resetear datos demo
      </button>

      <button
        onClick={handleLogout}
        className="w-full py-4 border-2 border-error text-error rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/20 transition-colors"
      >
        <Icon name="logout" /> Cerrar Sesión
      </button>
    </div>
  )
}
