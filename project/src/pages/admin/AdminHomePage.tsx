import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrders, useStats } from '@/lib/hooks'

export function AdminHomePage() {
  const navigate = useNavigate()
  const { orders } = useOrders()
  const { stats } = useStats()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Panel de Administración</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Región Araucanía · {new Date().toLocaleDateString('es-CL', { dateStyle: 'full' })}
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/orders/new')}
          className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
        >
          <Icon name="add" />
          Nuevo Pedido
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Rutas Activas', value: stats.active, icon: 'local_shipping', color: 'text-primary' },
          { label: 'Entregados hoy', value: stats.delivered, icon: 'check_circle', color: 'text-primary' },
          {
            label: 'IDs Ilegibles (E8)',
            value: stats.illegibleCylinders,
            icon: 'warning',
            color: 'text-error',
            bg: 'bg-error-container/30',
          },
          {
            label: 'Ingresos',
            value: `$${Math.round(stats.revenue / 1000)}k`,
            icon: 'trending_up',
            color: 'text-primary',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`${kpi.bg ?? 'bg-surface-container-lowest'} border border-outline-variant p-4 rounded-xl`}
          >
            <Icon name={kpi.icon} className={`${kpi.color} mb-2`} />
            <p className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ver Pedidos', icon: 'inventory_2', to: '/admin/orders' },
          { label: 'Rutas del Día', icon: 'map', to: '/admin/routes' },
          { label: 'Bodega', icon: 'warehouse', to: '/admin/inventory' },
          { label: 'Clientes', icon: 'group', to: '/admin/clients' },
        ].map((item) => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl flex flex-col items-start gap-3 hover:border-primary transition-all"
          >
            <Icon name={item.icon} className="text-primary text-2xl" />
            <span className="text-sm font-bold text-on-surface">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-on-surface">Pedidos Recientes</h3>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-sm text-primary font-medium hover:underline"
          >
            Ver todos
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between p-4 bg-background border border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer gap-3"
              onClick={() => navigate('/admin/orders')}
            >
              <div className="flex gap-3 items-center">
                <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                  <Icon name="local_gas_station" className="text-white text-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{order.product} x {order.quantity}</p>
                  <p className="text-xs text-on-surface-variant">{order.orderNumber} · {order.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={order.status} />
                <span className="text-sm font-bold text-on-surface">
                  ${order.total.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
