import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MapView } from '@/components/map/MapView'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'
import type { Order } from '@/types'

export function DriverRoutesPage() {
  const { user } = useAuth()
  const { orders, updateStatus } = useOrders()
  const [selected, setSelected] = useState<Order | null>(null)

  // Pedidos asignados a este chofer
  const myOrders = orders.filter((o) =>
    o.driverName === user?.name &&
    ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  )

  const markers = myOrders.map((o, i) => ({
    lat: o.lat,
    lng: o.lng,
    label: `Parada ${i + 1}: ${o.clientName}`,
    color: selected?.id === o.id ? '#b7102a' : '#003f87',
  }))

  const mapCenter: [number, number] = myOrders.length > 0
    ? [myOrders[0].lng, myOrders[0].lat]
    : [-72.5904, -38.7359]

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">Mi Ruta de Hoy</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          {myOrders.length} paradas asignadas · Temuco, Araucanía
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-outline-variant shadow-sm" style={{ height: '480px' }}>
          <MapView
            center={mapCenter}
            zoom={12}
            markers={markers}
            className="w-full h-full"
            interactive
          />
        </div>

        {/* Lista paradas */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
          {myOrders.length === 0 && (
            <div className="text-center py-16 text-on-surface-variant">
              <Icon name="check_circle" className="text-4xl mb-2 block mx-auto text-primary" />
              <p className="text-sm font-semibold text-on-surface">¡Sin paradas pendientes!</p>
              <p className="text-xs mt-1">Todas las entregas completadas</p>
            </div>
          )}
          {myOrders.map((order, i) => (
            <button
              key={order.id}
              onClick={() => setSelected(selected?.id === order.id ? null : order)}
              className={`text-left bg-surface-container-lowest border rounded-xl p-4 transition-all ${
                selected?.id === order.id
                  ? 'border-primary shadow-md'
                  : 'border-outline-variant hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${
                  selected?.id === order.id ? 'bg-secondary' : 'bg-primary'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-on-surface">{order.clientName}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">{order.address}</p>
                  <p className="text-xs text-on-surface mt-1 font-semibold">{order.product} · ${order.total.toLocaleString('es-CL')}</p>
                </div>
              </div>

              {/* Acciones rápidas cuando está seleccionado */}
              {selected?.id === order.id && (
                <div className="mt-3 pt-3 border-t border-outline-variant space-y-2" onClick={(e) => e.stopPropagation()}>
                  {order.status === 'Asignado' && (
                    <button onClick={() => updateStatus(order.id, 'En Ruta')} className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg">
                      Iniciar Ruta
                    </button>
                  )}
                  {order.status === 'En Ruta' && (
                    <button onClick={() => updateStatus(order.id, 'En Punto de Entrega')} className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg">
                      Llegué al Destino
                    </button>
                  )}
                  {order.status === 'En Punto de Entrega' && (
                    <button onClick={() => updateStatus(order.id, 'En Validación')} className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg">
                      Token Confirmado
                    </button>
                  )}
                  {order.status === 'En Validación' && (
                    <button onClick={() => updateStatus(order.id, 'Entregado')} className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg">
                      Entrega Completada ✓
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(order.id, 'Fallido')}
                    className="w-full py-2 border border-error text-error text-xs font-bold rounded-lg"
                  >
                    Reportar Incidencia (E7)
                  </button>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
