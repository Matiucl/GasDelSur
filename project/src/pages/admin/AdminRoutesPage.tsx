import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MapView } from '@/components/map/MapView'
import { useOrders } from '@/lib/hooks'
import type { Order } from '@/types'

const DRIVER_COLORS: Record<string, string> = {
  'Luis González':   '#003f87',
  'Roberto Lagos':   '#b7102a',
  'Marco Solis':     '#683400',
}

function getDriverColor(name?: string): string {
  if (!name) return '#727784'
  return DRIVER_COLORS[name] ?? '#003f87'
}

export function AdminRoutesPage() {
  const { orders, updateStatus } = useOrders()
  const [selectedDriver, setSelectedDriver] = useState<string>('Todos')

  const activeOrders = orders.filter((o) =>
    ['Solicitado','Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  )

  const drivers = ['Todos', ...Array.from(new Set(activeOrders.map((o) => o.driverName).filter(Boolean) as string[]))]

  const filtered = selectedDriver === 'Todos'
    ? activeOrders
    : activeOrders.filter((o) => o.driverName === selectedDriver)

  const markers = filtered.map((o) => ({
    lat: o.lat,
    lng: o.lng,
    label: `${o.orderNumber} · ${o.clientName}\n${o.status}`,
    color: getDriverColor(o.driverName),
  }))

  // Centro en Temuco
  const mapCenter: [number, number] = [-72.5904, -38.7559]

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Rutas del Día</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {activeOrders.length} paradas activas · Región de La Araucanía
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {drivers.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDriver(d)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                selectedDriver === d
                  ? 'bg-primary text-white border-primary'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary'
              }`}
            >
              {d === 'Todos' ? 'Todos los choferes' : d}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl overflow-hidden border border-outline-variant shadow-sm" style={{ height: '520px' }}>
            <MapView
              center={mapCenter}
              zoom={12}
              markers={markers}
              className="w-full h-full"
              interactive
            />
          </div>

          {/* Leyenda */}
          <div className="mt-3 flex flex-wrap gap-3">
            {Object.entries(DRIVER_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Panel de paradas */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[580px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant">
              <Icon name="map" className="text-4xl mb-2 block mx-auto" />
              <p className="text-sm">Sin pedidos activos</p>
            </div>
          )}
          {filtered.map((order, i) => (
            <RouteStopCard
              key={order.id}
              order={order}
              sequence={i + 1}
              color={getDriverColor(order.driverName)}
              onAdvance={() => {
                const next = getNextStatus(order.status)
                if (next) updateStatus(order.id, next)
              }}
            />
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Solicitados', count: orders.filter(o => o.status === 'Solicitado').length, icon: 'shopping_cart', color: 'text-on-surface-variant' },
          { label: 'En Ruta', count: orders.filter(o => o.status === 'En Ruta').length, icon: 'local_shipping', color: 'text-primary' },
          { label: 'Entregados hoy', count: orders.filter(o => ['Entregado','Finalizado'].includes(o.status)).length, icon: 'check_circle', color: 'text-primary' },
          { label: 'Fallidos', count: orders.filter(o => o.status === 'Fallido').length, icon: 'cancel', color: 'text-error' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <Icon name={s.icon} className={`${s.color} mb-2`} />
            <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function getNextStatus(status: Order['status']): Order['status'] | null {
  const flow: Partial<Record<Order['status'], Order['status']>> = {
    Solicitado: 'Asignado',
    Asignado: 'En Ruta',
    'En Ruta': 'En Punto de Entrega',
    'En Punto de Entrega': 'En Validación',
    'En Validación': 'Entregado',
    Entregado: 'Finalizado',
  }
  return flow[status] ?? null
}

function RouteStopCard({ order, sequence, color, onAdvance }: {
  order: Order
  sequence: number
  color: string
  onAdvance: () => void
}) {
  const next = getNextStatus(order.status)
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5" style={{ background: color }}>
          {sequence}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-on-surface">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">{order.clientName}</p>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
            <Icon name="location_on" size={12} /> {order.address}
          </p>
          {order.driverName && (
            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
              <Icon name="person" size={12} /> {order.driverName} · {order.driverPlate}
            </p>
          )}
        </div>
      </div>
      {next && (
        <button
          onClick={onAdvance}
          className="w-full mt-3 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors"
        >
          → {next}
        </button>
      )}
    </div>
  )
}
