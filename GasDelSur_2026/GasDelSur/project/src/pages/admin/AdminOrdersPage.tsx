import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useOrders, useUsers } from '@/lib/hooks'
import type { Order, OrderStatus } from '@/types'

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  Solicitado:              'Asignado',
  Asignado:                'En Ruta',
  'En Ruta':               'En Punto de Entrega',
  'En Punto de Entrega':   'En Validación',
  'En Validación':         'Entregado',
  Entregado:               'Finalizado',
  Finalizado:              null,
  Fallido:                 'Solicitado',
  Cancelado:               null,
}

const ALL_STATUSES: OrderStatus[] = [
  'Solicitado','Asignado','En Ruta','En Punto de Entrega',
  'En Validación','Entregado','Finalizado','Fallido','Cancelado',
]

function OrderDetailModal({ order, onClose, onStatusChange, onAssign }: {
  order: Order
  onClose: () => void
  onStatusChange: (id: string, s: OrderStatus) => void
  onAssign: (id: string, driverId: string, driverName: string, plate: string) => void
}) {
  const { users } = useUsers()
  const drivers = users.filter((u) => u.role === 'driver')

  const [selectedDriverId, setSelectedDriverId] = useState(order.driverId ?? '')
  const [plate, setPlate] = useState(order.driverPlate ?? '')
  const nextStatus = STATUS_FLOW[order.status]

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId)

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-surface-container-lowest w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl border border-outline-variant p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-on-surface">{order.orderNumber}</h3>
            <p className="text-sm text-on-surface-variant mt-0.5">{order.clientName} · {order.clientPhone}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <Icon name="close" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Producto',   value: `${order.product} x${order.quantity}` },
            { label: 'Total',      value: `$${order.total.toLocaleString('es-CL')}` },
            { label: 'Dirección',  value: order.address },
            { label: 'Pago',       value: order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod === 'card' ? 'Tarjeta' : 'Remoto' },
          ].map((r) => (
            <div key={r.label} className="bg-surface-container p-3 rounded-lg">
              <p className="text-xs text-on-surface-variant mb-0.5">{r.label}</p>
              <p className="font-semibold text-on-surface">{r.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 bg-surface-container rounded-lg">
          <span className="text-sm text-on-surface-variant">Estado actual</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Asignar chofer */}
        {order.status === 'Solicitado' && (
          <div className="space-y-3 p-4 bg-primary-fixed/10 rounded-xl border border-primary/20">
            <p className="text-sm font-bold text-on-surface">Asignar Chofer</p>
            {drivers.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No hay choferes registrados. Créalos desde Ajustes.</p>
            ) : (
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full h-11 px-4 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Seleccionar chofer…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} · {d.rut}</option>
                ))}
              </select>
            )}
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Patente del vehículo (ej: AB-12-CD)"
              className="w-full h-11 px-4 text-sm border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white font-mono"
            />
            <button
              onClick={() => {
                if (!selectedDriver || !plate) return
                onAssign(order.id, selectedDriver.id, selectedDriver.name, plate)
                onClose()
              }}
              disabled={!selectedDriverId || !plate}
              className="w-full py-3 bg-primary text-white rounded-lg text-sm font-bold shadow disabled:opacity-50"
            >
              Asignar → Estado "Asignado"
            </button>
          </div>
        )}

        {/* Avanzar estado */}
        {nextStatus && order.status !== 'Solicitado' && (
          <button
            onClick={() => { onStatusChange(order.id, nextStatus); onClose() }}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-all"
          >
            Avanzar → {nextStatus}
          </button>
        )}

        {!['Fallido','Cancelado','Finalizado'].includes(order.status) && (
          <button
            onClick={() => { onStatusChange(order.id, 'Fallido'); onClose() }}
            className="w-full py-2 border border-error text-error rounded-xl text-sm font-semibold hover:bg-error-container/20 transition-colors"
          >
            Marcar como Fallido (E7 — Ausencia del receptor)
          </button>
        )}
      </div>
    </div>
  )
}

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const { orders, updateStatus, assignDriver } = useOrders()
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState<OrderStatus | 'Todos'>('Todos')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.clientName.toLowerCase().includes(search.toLowerCase()) ||
        o.address.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'Todos' || o.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [orders, search, filterStatus])

  const counts = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {}
    orders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1 })
    return c
  }, [orders])

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Gestión de Pedidos</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {orders.length} pedidos en total · {counts['En Ruta'] ?? 0} en ruta ahora
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/orders/new')}
          className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md hover:brightness-110 transition-all"
        >
          <Icon name="add" /> Nuevo Pedido
        </button>
      </div>

      {/* Chips de estado */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setFilterStatus('Todos')}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${filterStatus === 'Todos' ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}
        >
          Todos ({orders.length})
        </button>
        {ALL_STATUSES.filter((s) => counts[s]).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${filterStatus === s ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente o dirección…"
          className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <Icon name="search_off" className="text-4xl mb-2 block mx-auto" />
            <p className="text-sm">
              {orders.length === 0
                ? 'Aún no hay pedidos. Crea el primero con el botón de arriba.'
                : 'No hay pedidos que coincidan con la búsqueda.'}
            </p>
          </div>
        )}
        {filtered.map((order) => (
          <div key={order.id} onClick={() => setSelectedOrder(order)}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
            <div className="flex flex-wrap gap-3 items-start justify-between">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="local_gas_station" className="text-white text-[18px]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-on-surface">{order.orderNumber}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{order.clientName} · {order.product} x{order.quantity}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                    <Icon name="location_on" size={14} /> {order.address}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-on-surface">${order.total.toLocaleString('es-CL')}</p>
                {order.driverName && (
                  <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1 justify-end">
                    <Icon name="person" size={14} /> {order.driverName}
                  </p>
                )}
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateStatus}
          onAssign={assignDriver}
        />
      )}
    </div>
  )
}
