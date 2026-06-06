import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

export function ClientHomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { orders } = useOrders()

  const myOrders = orders.filter((o) => o.clientName === user?.name)
  const activeOrder = myOrders.find((o) =>
    ['Solicitado','Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  )

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">
          Hola, {user?.name?.split(' ')[0] ?? 'Ana'} 👋
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">¿Necesitas gas hoy?</p>
      </div>

      {activeOrder && (
        <div
          className="bg-primary-container text-white p-5 rounded-xl flex items-center justify-between gap-4 cursor-pointer hover:brightness-110 transition-all"
          onClick={() => navigate('/client/tracking')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Icon name="local_shipping" className="text-2xl" filled />
            </div>
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wider">Pedido Activo</p>
              <p className="text-base font-bold">{activeOrder.product}</p>
              <p className="text-xs opacity-80">
                {activeOrder.driverName ? `Chofer: ${activeOrder.driverName} · ${activeOrder.driverPlate}` : 'Esperando asignación…'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={activeOrder.status} className="bg-white/20 text-white border-white/30" />
            <Icon name="chevron_right" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/client/new-order')}
          className="bg-primary text-white p-5 rounded-xl flex flex-col items-start gap-3 hover:brightness-110 transition-all shadow-md"
        >
          <Icon name="add_shopping_cart" className="text-3xl" />
          <span className="text-sm font-bold">Nuevo Pedido</span>
        </button>
        <button
          onClick={() => navigate('/client/tracking')}
          className="bg-surface-container-lowest border border-outline-variant p-5 rounded-xl flex flex-col items-start gap-3 hover:border-primary transition-all"
        >
          <Icon name="location_on" className="text-primary text-3xl" />
          <span className="text-sm font-bold text-on-surface">Rastrear Pedido</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-on-surface">Últimos Pedidos</h3>
          <button onClick={() => navigate('/client/orders')} className="text-sm text-primary font-medium hover:underline">Ver todos</button>
        </div>
        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <Icon name="inbox" className="text-3xl mb-2 block mx-auto" />
            <p className="text-sm">Aún no tienes pedidos</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                onClick={() => navigate('/client/tracking')}
                className="flex items-center justify-between p-3 bg-background border border-outline-variant rounded-lg cursor-pointer hover:border-primary transition-colors"
              >
                <div>
                  <p className="text-sm font-bold text-on-surface">{order.product} x{order.quantity}</p>
                  <p className="text-xs text-on-surface-variant">{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'short' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold">${order.total.toLocaleString('es-CL')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
