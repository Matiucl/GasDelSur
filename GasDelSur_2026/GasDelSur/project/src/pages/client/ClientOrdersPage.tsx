import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

export function ClientOrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders } = useOrders()

  const myOrders = orders.filter((o) => o.clientId === user?.id)
  const totalSpent = myOrders
    .filter((o) => ['Entregado', 'Finalizado'].includes(o.status))
    .reduce((s, o) => s + o.total, 0)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[800px] mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container rounded-lg">
          <Icon name="arrow_back" className="text-on-surface" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-on-surface">Mis Pedidos</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">{myOrders.length} pedidos en total</p>
        </div>
      </div>

      {totalSpent > 0 && (
        <div className="bg-primary-container text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-wider">Total gastado</p>
            <p className="text-2xl font-black">${totalSpent.toLocaleString('es-CL')}</p>
          </div>
          <Icon name="local_gas_station" className="text-4xl opacity-60" />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {myOrders.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <Icon name="inbox" className="text-5xl mb-3 block mx-auto" />
            <p className="text-base font-bold text-on-surface">Sin pedidos aún</p>
            <p className="text-sm mt-1 mb-4">Realiza tu primer pedido</p>
            <button
              onClick={() => navigate('/client/new-order')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm"
            >
              Hacer Pedido
            </button>
          </div>
        )}
        {myOrders.map((order) => (
          <div
            key={order.id}
            onClick={() => navigate('/client/tracking')}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary transition-colors cursor-pointer"
          >
            <div className="flex flex-wrap gap-3 items-start justify-between">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0">
                  <Icon name="propane_tank" className="text-white text-[18px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-on-surface">{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{order.product} x{order.quantity}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                    <Icon name="location_on" size={13} /> {order.address}
                  </p>
                  {order.driverName && (
                    <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                      <Icon name="person" size={13} /> {order.driverName}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-on-surface">${order.total.toLocaleString('es-CL')}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {new Date(order.createdAt).toLocaleDateString('es-CL', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
