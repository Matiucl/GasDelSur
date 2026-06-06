import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

export function DriverOrdersPage() {
  const { user } = useAuth()
  const { orders } = useOrders()

  const myOrders = orders.filter((o) => o.driverName === user?.name)
  const delivered = myOrders.filter((o) => ['Entregado','Finalizado'].includes(o.status))
  const pending = myOrders.filter((o) => ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status))
  const failed = myOrders.filter((o) => o.status === 'Fallido')

  const totalEarned = delivered.reduce((s, o) => s + o.total, 0)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[800px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">Mis Pedidos</h2>
        <p className="text-sm text-on-surface-variant mt-1">{myOrders.length} pedidos asignados a ti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <Icon name="local_shipping" className="text-primary mb-2" />
          <p className="text-2xl font-black text-primary">{pending.length}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Pendientes</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <Icon name="check_circle" className="text-primary mb-2" />
          <p className="text-2xl font-black text-primary">{delivered.length}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Entregados</p>
        </div>
        <div className="bg-error-container/20 border border-error/20 rounded-xl p-4">
          <Icon name="cancel" className="text-error mb-2" />
          <p className="text-2xl font-black text-error">{failed.length}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Fallidos</p>
        </div>
      </div>

      {totalEarned > 0 && (
        <div className="bg-primary-container text-white p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80 uppercase tracking-wider">Cobrado hoy</p>
            <p className="text-2xl font-black">${totalEarned.toLocaleString('es-CL')}</p>
          </div>
          <Icon name="payments" className="text-4xl opacity-70" />
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {myOrders.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <Icon name="inbox" className="text-4xl mb-2 block mx-auto" />
            <p className="text-sm">No tienes pedidos asignados</p>
          </div>
        )}
        {myOrders.map((order) => (
          <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <div className="flex flex-wrap items-start gap-3 justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-on-surface">{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-on-surface-variant">{order.clientName} · {order.clientPhone}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                  <Icon name="location_on" size={13} />{order.address}
                </p>
                <p className="text-xs text-on-surface mt-1 font-semibold">{order.product} x{order.quantity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-on-surface">${order.total.toLocaleString('es-CL')}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </p>
                {order.securityToken && (
                  <p className="text-xs font-mono text-primary mt-1 font-bold">Token: {order.securityToken}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
