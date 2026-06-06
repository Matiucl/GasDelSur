import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

const TIMELINE_STEPS = [
  { label: 'Solicitado',  icon: 'shopping_cart',   statuses: ['Solicitado'] },
  { label: 'Asignado',   icon: 'assignment_ind',   statuses: ['Asignado'] },
  { label: 'En Ruta',    icon: 'local_shipping',   statuses: ['En Ruta'] },
  { label: 'En Destino', icon: 'location_on',      statuses: ['En Punto de Entrega','En Validación'] },
  { label: 'Entregado',  icon: 'check_circle',     statuses: ['Entregado','Finalizado'] },
]

const TRUCK_OFFSET = { lat: 0.012, lng: -0.015 }

export function ClientTrackingPage() {
  const { user } = useAuth()
  const { orders } = useOrders()

  const order = orders.find((o) =>
    o.clientName === user?.name &&
    !['Finalizado','Cancelado'].includes(o.status)
  ) ?? orders.find((o) => o.clientName === user?.name)

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Icon name="search_off" className="text-5xl text-on-surface-variant" />
        <p className="text-lg font-bold text-on-surface">Sin pedidos activos</p>
        <p className="text-sm text-on-surface-variant">Realiza un nuevo pedido para comenzar el seguimiento.</p>
      </div>
    )
  }

  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.statuses.includes(order.status))

  const truckPos = { lat: order.lat + TRUCK_OFFSET.lat, lng: order.lng + TRUCK_OFFSET.lng }

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* Mapa */}
      <div className="relative" style={{ height: '55vh', minHeight: 280 }}>
        <MapView
          center={[order.lng, order.lat]}
          zoom={13}
          markers={[
            { lat: order.lat, lng: order.lng, label: order.address, color: '#003f87' },
            ...(order.driverName ? [{ lat: truckPos.lat, lng: truckPos.lng, label: `Camión · ${order.driverName}`, color: '#b7102a' }] : []),
          ]}
          className="absolute inset-0 w-full h-full"
          interactive
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #f7f9ff)' }} />

        {/* Banner */}
        {['En Ruta','En Punto de Entrega'].includes(order.status) && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="bg-primary text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <Icon name="notifications_active" />
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Notificación en vivo</p>
                <p className="text-sm font-medium">
                  {order.status === 'En Ruta' ? 'El camión está en camino a tu ubicación.' : 'El repartidor llegó a tu dirección.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta chofer */}
        {order.driverName && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-10">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed-dim flex items-center justify-center border-2 border-primary-container">
                      <Icon name="person" className="text-primary text-2xl" filled />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary w-5 h-5 rounded-full border-2 border-surface-container-lowest flex items-center justify-center">
                      <Icon name="verified" className="text-white" size={12} filled />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{order.driverName}</h3>
                    <p className="text-xs text-on-surface-variant">Chofer Certificado · SEC</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-secondary-container text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {order.status}
                  </span>
                  <p className="text-xs font-bold text-primary mt-1">{order.driverPlate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-surface-container-high text-primary font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm">
                  <Icon name="call" size={18} /> Llamar
                </button>
                <button className="flex-1 bg-surface-container-high text-primary font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm">
                  <Icon name="chat" size={18} /> Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="bg-surface-container-lowest border-t border-outline-variant p-4 md:p-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Token */}
          {order.securityToken && !['Entregado','Finalizado'].includes(order.status) && (
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Token de Seguridad</span>
                <Icon name="lock" className="text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black text-primary tracking-[0.25em]">{order.securityToken}</span>
                <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:brightness-110 transition-all">
                  <Icon name="share" size={18} /> WhatsApp
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">Muestra este código al repartidor al recibir tu cilindro.</p>
            </div>
          )}

          {/* Detalle */}
          <div className="flex flex-col gap-2 justify-center">
            <h2 className="text-lg font-bold text-on-surface">Detalle del Pedido</h2>
            {[
              { label: 'Producto', value: `${order.product} x${order.quantity}` },
              { label: 'Pedido', value: order.orderNumber },
              { label: 'Dirección', value: order.address },
              { label: 'Total', value: `$${order.total.toLocaleString('es-CL')}` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-start py-2 border-b border-outline-variant last:border-0">
                <span className="text-sm text-on-surface-variant shrink-0">{row.label}</span>
                <span className="text-sm font-bold text-on-surface text-right ml-4">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">Estado del Pedido</h3>
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, i) => {
              const done = i < currentStepIdx
              const active = i === currentStepIdx
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      active ? 'bg-primary border-primary text-white shadow-md'
                      : done ? 'bg-primary-fixed border-primary text-primary'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant'
                    }`}>
                      <Icon name={step.icon} size={18} filled={done || active} />
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-primary' : done ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mb-5 ${done ? 'bg-primary' : 'bg-outline-variant'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
