import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'
import { PositionsDB, haversineKm, etaMinutes } from '@/lib/db'
import type { Order } from '@/types'

const TIMELINE_STEPS = [
  { label: 'Solicitado',  icon: 'shopping_cart',  statuses: ['Solicitado']                            },
  { label: 'Asignado',   icon: 'assignment_ind',  statuses: ['Asignado']                              },
  { label: 'En Ruta',    icon: 'local_shipping',  statuses: ['En Ruta']                               },
  { label: 'En Destino', icon: 'location_on',     statuses: ['En Punto de Entrega','En Validación']   },
  { label: 'Entregado',  icon: 'check_circle',    statuses: ['Entregado','Finalizado']                },
]

// ── Hook: posición del chofer con polling ─────────────────────
function useDriverPosition(driverId: string | undefined, active: boolean) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!driverId || !active) return
    let cancelled = false

    const poll = async () => {
      const saved = await PositionsDB.get(driverId)
      if (!cancelled && saved) setPos({ lat: saved.lat, lng: saved.lng })
    }

    poll()
    const interval = setInterval(poll, 5000)   // refresca cada 5 segundos
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [driverId, active])

  return pos
}

// ── ETA calculado con Haversine ───────────────────────────────
function useETA(driverPos: { lat: number; lng: number } | null, order: Order | null): string {
  if (!driverPos || !order) return '—'
  const km  = haversineKm(driverPos.lat, driverPos.lng, order.lat, order.lng)
  const min = etaMinutes(km)
  if (min <= 5)  return 'menos de 5 min'
  if (min < 60)  return `~${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`
}

// ── WhatsApp share ────────────────────────────────────────────
function shareTokenWhatsApp(phone: string, token: string, orderNumber: string) {
  // Normalizar teléfono a formato internacional sin espacios ni símbolos
  const clean = phone.replace(/\D/g, '')
  const intl  = clean.startsWith('56') ? clean : `56${clean.replace(/^0/, '')}`
  const msg   = encodeURIComponent(
    `🔑 *Token de entrega Gas del Sur*\n\n` +
    `Pedido: *${orderNumber}*\n` +
    `Token: *${token}*\n\n` +
    `Muestra este código al repartidor cuando llegue a tu puerta.`
  )
  window.open(`https://wa.me/${intl}?text=${msg}`, '_blank', 'noopener')
}

export function ClientTrackingPage() {
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const { orders }     = useOrders()

  // Pedido activo del cliente
  const order = orders.find(
    (o) => o.clientId === user?.id && !['Finalizado','Cancelado'].includes(o.status)
  ) ?? orders
      .filter((o) => o.clientId === user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const isActive = !!order && ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(order.status)

  // Posición del chofer en tiempo real
  const driverPos = useDriverPosition(order?.driverId, isActive)

  // ETA dinámico
  const eta = useETA(driverPos, order ?? null)

  // Fuerza re-render para que el ETA se recalcule junto al polling
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!isActive) return
    const t = setInterval(() => setTick((n) => n + 1), 4000)
    return () => clearInterval(t)
  }, [isActive])

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <Icon name="search_off" className="text-5xl text-on-surface-variant" />
        <p className="text-lg font-bold text-on-surface">Sin pedidos activos</p>
        <p className="text-sm text-on-surface-variant text-center">Realiza un nuevo pedido para comenzar el seguimiento.</p>
        <button onClick={() => navigate('/client/new-order')}
          className="mt-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm">
          Hacer Pedido
        </button>
      </div>
    )
  }

  const currentStepIdx = TIMELINE_STEPS.findIndex((s) => s.statuses.includes(order.status))

  // ── Marcadores del mapa ────────────────────────────────────
  const mapMarkers = [
    {
      id: 'destination',
      lat: order.lat,
      lng: order.lng,
      label: `📍 ${order.address}`,
      color: '#003f87',
      type: 'destination' as const,
    },
    ...(driverPos ? [{
      id: 'driver',
      lat: driverPos.lat,
      lng: driverPos.lng,
      label: `🚚 ${order.driverName ?? 'Repartidor'}`,
      color: '#b7102a',
      type: 'truck' as const,
    }] : []),
  ]

  // Centro del mapa: entre chofer y destino si hay posición, si no en el destino
  const mapCenter: [number, number] = driverPos
    ? [(driverPos.lng + order.lng) / 2, (driverPos.lat + order.lat) / 2]
    : [order.lng, order.lat]

  const mapZoom = driverPos ? 13 : 14

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Mapa ──────────────────────────────────────────── */}
      <div className="relative" style={{ height: '55vh', minHeight: 280 }}>
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          markers={mapMarkers}
          className="absolute inset-0 w-full h-full"
          interactive
        />

        {/* Degradado inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(247,249,255,0.9))' }} />

        {/* Banner de notificación activa */}
        {['En Ruta','En Punto de Entrega'].includes(order.status) && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="bg-primary/95 backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
              <Icon name="notifications_active" className="shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider opacity-80">En vivo</p>
                <p className="text-sm font-semibold">
                  {order.status === 'En Ruta'
                    ? `Repartidor en camino · ETA ${eta}`
                    : 'El repartidor llegó a tu dirección'}
                </p>
              </div>
              {order.status === 'En Ruta' && driverPos && (
                <div className="text-right shrink-0">
                  <p className="text-xs opacity-70">Distancia</p>
                  <p className="text-sm font-black">
                    {haversineKm(driverPos.lat, driverPos.lng, order.lat, order.lng).toFixed(1)} km
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tarjeta del chofer */}
        {order.driverName && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-10">
            <div className="bg-surface-container-lowest/95 backdrop-blur-sm border border-outline-variant rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed-dim flex items-center justify-center border-2 border-primary-container">
                      <Icon name="person" className="text-primary text-2xl" filled />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                      <Icon name="verified" className="text-white" size={11} filled />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{order.driverName}</h3>
                    <p className="text-xs text-on-surface-variant">Chofer Certificado · SEC</p>
                    {driverPos && (
                      <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse inline-block" />
                        GPS activo
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    order.status === 'En Ruta'
                      ? 'bg-primary text-white'
                      : order.status === 'En Punto de Entrega'
                      ? 'bg-secondary-container text-white'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-xs font-bold text-on-surface-variant mt-1">{order.driverPlate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${order.clientPhone}`}
                  className="flex-1 bg-surface-container-high text-primary font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors text-sm">
                  <Icon name="call" size={18} /> Llamar
                </a>
                <button
                  onClick={() => order.securityToken && shareTokenWhatsApp(order.clientPhone, order.securityToken, order.orderNumber)}
                  className="flex-1 bg-[#25D366]/10 text-[#128C7E] font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-colors text-sm border border-[#25D366]/30">
                  <Icon name="chat" size={18} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel inferior ────────────────────────────────── */}
      <div className="bg-surface-container-lowest border-t border-outline-variant p-4 md:p-6 space-y-5 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Token de seguridad */}
          {order.securityToken && !['Entregado','Finalizado'].includes(order.status) && (
            <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Token de Seguridad</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Muéstralo al repartidor al recibir</p>
                </div>
                <Icon name="lock" className="text-primary" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-5xl font-black text-primary tracking-[0.3em] font-mono">
                  {order.securityToken}
                </span>
                <button
                  onClick={() => shareTokenWhatsApp(order.clientPhone, order.securityToken!, order.orderNumber)}
                  className="flex flex-col items-center gap-1 bg-[#25D366] text-white px-4 py-3 rounded-xl hover:brightness-110 transition-all shadow-md shrink-0"
                >
                  <Icon name="share" size={20} />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Detalle del pedido con dirección dinámica */}
          <div className="flex flex-col gap-2 justify-center">
            <h2 className="text-base font-bold text-on-surface">Detalle del Pedido</h2>
            {[
              { label: 'Número',     value: order.orderNumber },
              { label: 'Producto',   value: `${order.product} ×${order.quantity}` },
              {
                label: 'Dirección',
                value: order.address,
                highlight: true,
              },
              {
                label: 'ETA',
                value: isActive && order.driverId
                  ? eta
                  : order.status === 'Entregado' || order.status === 'Finalizado'
                  ? '✓ Entregado'
                  : 'Pendiente de asignación',
                isEta: true,
              },
              { label: 'Total',      value: `$${order.total.toLocaleString('es-CL')}` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-start py-2 border-b border-outline-variant last:border-0 gap-4">
                <span className="text-sm text-on-surface-variant shrink-0">{row.label}</span>
                <span className={`text-sm font-bold text-right ${
                  (row as { isEta?: boolean }).isEta ? 'text-primary' : 'text-on-surface'
                }`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
            Estado del Pedido
          </h3>
          <div className="flex items-center">
            {TIMELINE_STEPS.map((step, i) => {
              const done   = i < currentStepIdx
              const active = i === currentStepIdx
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      active
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/30'
                        : done
                        ? 'bg-primary-fixed-dim border-primary text-primary'
                        : 'bg-surface-container border-outline-variant text-on-surface-variant'
                    }`}>
                      <Icon name={step.icon} size={18} filled={done || active} />
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${
                      active ? 'text-primary' : done ? 'text-on-surface' : 'text-on-surface-variant'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mb-5 transition-all ${done ? 'bg-primary' : 'bg-outline-variant'}`} />
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
