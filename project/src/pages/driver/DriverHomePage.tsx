import { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'
import { CylindersDB, PositionsDB } from '@/lib/db'

type CylinderCondition = 'apt' | 'not-apt' | null
type PaymentMethod     = 'cash' | 'remote' | null

// ── Publicar posición GPS real del chofer en PositionsDB ──────
function useDriverGPS(driverId: string | undefined, active: boolean) {
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    if (!driverId || !active || !('geolocation' in navigator)) return

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        PositionsDB.set(driverId, pos.coords.latitude, pos.coords.longitude)
          .catch((err) => console.warn('No se pudo publicar la posición:', err))
      },
      (err) => console.warn('GPS error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
    }
  }, [driverId, active])
}

export function DriverHomePage() {
  const { user }                    = useAuth()
  const { orders, updateStatus }    = useOrders()

  const activeOrder = orders.find(
    (o) => o.driverId === user?.id &&
    ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  )

  const pendingCount = orders.filter(
    (o) => o.driverId === user?.id &&
    ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  ).length

  // GPS en tiempo real (solo cuando hay un pedido activo)
  useDriverGPS(user?.id, !!activeOrder && ['En Ruta','En Punto de Entrega'].includes(activeOrder?.status ?? ''))

  // Posición actual del chofer (para mostrar en el mapa del propio driver)
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    PositionsDB.get(user.id).then((saved) => {
      if (!cancelled && saved) setMyPos(saved)
    })
    return () => { cancelled = true }
  }, [user?.id, activeOrder?.status])

  // ── Estados del formulario de entrega ──────────────────────
  const [cylinderId,      setCylinderId]      = useState('')
  const [idIllegible,     setIdIllegible]     = useState(false)
  const [condition,       setCondition]       = useState<CylinderCondition>(null)
  const [payment,         setPayment]         = useState<PaymentMethod>(null)
  const [tokenInput,      setTokenInput]      = useState('')
  const [tokenError,      setTokenError]      = useState(false)
  const [tokenConfirmed,  setTokenConfirmed]  = useState(false)
  const [submitted,       setSubmitted]       = useState(false)
  const [finishing,       setFinishing]       = useState(false)

  const cylinderType = ((): '5kg' | '11kg' | '15kg' | '45kg' => {
    if (!activeOrder) return '15kg'
    if (activeOrder.product.includes('5kg'))  return '5kg'
    if (activeOrder.product.includes('11kg')) return '11kg'
    if (activeOrder.product.includes('45kg')) return '45kg'
    return '15kg'
  })()

  const handleIniciarRuta = () => {
    if (!activeOrder) return
    updateStatus(activeOrder.id, 'En Ruta')
  }

  const handleLlegue = () => {
    if (activeOrder) updateStatus(activeOrder.id, 'En Punto de Entrega')
  }

  const handleValidateToken = () => {
    if (!activeOrder) return
    if (tokenInput === activeOrder.securityToken) {
      setTokenError(false)
      setTokenConfirmed(true)
      updateStatus(activeOrder.id, 'En Validación')
    } else {
      setTokenError(true)
    }
  }

  const handleFinish = async () => {
    if (!activeOrder) return
    if (!condition) { alert('Indica el estado del envase'); return }
    if (!payment)   { alert('Selecciona el método de pago'); return }
    if (!idIllegible && cylinderId.length !== 7) { alert('El ID del cilindro debe tener 7 dígitos'); return }

    setFinishing(true)
    try {
      if (user) {
        await CylindersDB.register({
          serialNumber: idIllegible ? 'E8-ILEGIBLE' : cylinderId,
          type: cylinderType,
          status: idIllegible ? 'illegible' : 'full',
          driverId: user.id,
          driverName: user.name,
          needsManualValidation: idIllegible,
        })
      }

      await updateStatus(activeOrder.id, 'Entregado')
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setCylinderId('')
        setIdIllegible(false)
        setCondition(null)
        setPayment(null)
        setTokenInput('')
        setTokenConfirmed(false)
      }, 2000)
    } finally {
      setFinishing(false)
    }
  }

  // ── Pantalla de entrega completada ─────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center shadow-xl">
          <Icon name="check_circle" className="text-white text-6xl" filled />
        </div>
        <h2 className="text-2xl font-black text-on-surface">¡Entrega Completada!</h2>
        <p className="text-sm text-on-surface-variant">Estado actualizado → Entregado</p>
      </div>
    )
  }

  // ── Sin pedidos activos ────────────────────────────────────
  if (!activeOrder) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-[800px] mx-auto">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Hola, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-on-surface-variant mt-1">No tienes entregas pendientes por ahora.</p>
        </div>
        <div className="text-center py-20 text-on-surface-variant">
          <Icon name="check_circle" className="text-6xl mb-4 block mx-auto text-primary" />
          <p className="text-base font-bold text-on-surface">¡Todo al día!</p>
          <p className="text-sm mt-1">Espera a que el administrador te asigne un nuevo pedido.</p>
        </div>
      </div>
    )
  }

  // ── Marcadores del mapa ────────────────────────────────────
  const mapMarkers = [
    {
      id: 'destination',
      lat: activeOrder.lat,
      lng: activeOrder.lng,
      label: activeOrder.address,
      color: '#003f87',
      type: 'destination' as const,
    },
    ...(myPos ? [{
      id: 'me',
      lat: myPos.lat,
      lng: myPos.lng,
      label: 'Mi posición',
      color: '#b7102a',
      type: 'truck' as const,
    }] : []),
  ]

  const mapCenter: [number, number] = myPos
    ? [myPos.lng, myPos.lat]
    : [activeOrder.lng, activeOrder.lat]

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="md:hidden">
        <h2 className="text-2xl font-black text-on-surface">Hola, {user?.name?.split(' ')[0]}</h2>
        <p className="text-sm text-on-surface-variant">{pendingCount} entrega(s) pendientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* ── Mapa ─────────────────────────────────────────── */}
        <section className="md:col-span-8 relative rounded-xl overflow-hidden border border-outline-variant" style={{ height: '380px' }}>
          <MapView
            center={mapCenter}
            zoom={14}
            markers={mapMarkers}
            className="w-full h-full"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-sm p-4 rounded-xl shadow-md border border-outline-variant flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shrink-0">
                <Icon name="location_on" className="text-white" filled />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-on-surface-variant">Destino</p>
                <p className="text-sm font-bold text-on-surface truncate">{activeOrder.address}</p>
              </div>
            </div>
            {myPos && (
              <div className="text-right shrink-0">
                <p className="text-xs text-on-surface-variant">GPS</p>
                <p className="text-xs font-bold text-primary flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse inline-block" />
                  Activo
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Panel lateral ─────────────────────────────────── */}
        <aside className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-primary-container text-white p-6 rounded-xl">
            <h3 className="text-lg font-black mb-1">Entrega #{activeOrder.orderNumber}</h3>
            <p className="text-sm opacity-90 mb-4">
              {activeOrder.clientName} · {activeOrder.product} ×{activeOrder.quantity}
            </p>

            <div className="flex flex-col gap-3">
              {/* Botón Iniciar Ruta */}
              {activeOrder.status === 'Asignado' && (
                <button onClick={handleIniciarRuta}
                  className="w-full py-3 bg-white text-primary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-sm">
                  <Icon name="local_shipping" /> Iniciar Ruta
                </button>
              )}

              {/* Botón Llegué */}
              {activeOrder.status === 'En Ruta' && (
                <button onClick={handleLlegue}
                  className="w-full py-3 bg-white text-primary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-sm">
                  <Icon name="check_circle" /> Llegué a destino
                </button>
              )}

              {/* Validar token */}
              {activeOrder.status === 'En Punto de Entrega' && !tokenConfirmed && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => { setTokenInput(e.target.value); setTokenError(false) }}
                    placeholder="Token del cliente (4 dígitos)"
                    maxLength={4}
                    className={`w-full px-4 py-3 rounded-lg text-primary font-mono text-xl tracking-widest text-center font-black focus:outline-none ${tokenError ? 'bg-error-container/20 border-2 border-error' : 'bg-white/90'}`}
                  />
                  {tokenError && <p className="text-xs text-white font-bold">❌ Token incorrecto, intenta de nuevo</p>}
                  <button onClick={handleValidateToken}
                    className="w-full py-3 bg-white text-primary font-bold rounded-lg text-sm flex items-center justify-center gap-2">
                    <Icon name="key" /> Validar Token
                  </button>
                </div>
              )}
              {tokenConfirmed && (
                <div className="bg-white/20 rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2">
                  <Icon name="verified" /> Token Confirmado
                </div>
              )}
            </div>
          </div>

          {/* Info del pedido */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{activeOrder.status}</span>
            </div>
            <div className="text-xs text-on-surface-variant space-y-1">
              <p className="flex items-center gap-1"><Icon name="payments" size={13} />
                {activeOrder.paymentMethod === 'cash' ? 'Cobrar en efectivo' :
                 activeOrder.paymentMethod === 'card' ? 'Pago con tarjeta' : 'Pago remoto activado'}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Formulario de validación de envase ───────────── */}
        <section className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Validación de Envase</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Col 1: Estado del envase + ID */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">Estado del envase recibido</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'apt'     as const, label: 'Apto',     icon: 'task_alt' },
                    { val: 'not-apt' as const, label: 'No Apto',  icon: 'report'   },
                  ].map((opt) => (
                    <button key={opt.val} onClick={() => setCondition(opt.val)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl transition-all ${
                        condition === opt.val
                          ? opt.val === 'apt' ? 'border-primary bg-primary-fixed/20' : 'border-error bg-error-container/20'
                          : 'border-outline-variant hover:border-primary/50'
                      }`}>
                      <Icon name={opt.icon} className={condition === opt.val ? (opt.val === 'apt' ? 'text-primary' : 'text-error') : 'text-on-surface-variant'} />
                      <span className={`text-sm font-bold ${condition === opt.val ? (opt.val === 'apt' ? 'text-primary' : 'text-error') : 'text-on-surface-variant'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
                {condition === 'not-apt' && (
                  <p className="text-xs text-error mt-2 font-medium">⚠ Protocolo E1 activado — proceder con venta de envase nuevo</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">ID del Cilindro (7 dígitos)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={idIllegible ? 'ILEGIBLE' : cylinderId}
                    onChange={(e) => !idIllegible && setCylinderId(e.target.value.replace(/\D/g,'').slice(0,7))}
                    maxLength={7}
                    placeholder="0000000"
                    disabled={idIllegible}
                    className="flex-1 bg-surface border border-outline-variant rounded-lg p-4 font-mono text-xl tracking-widest focus:ring-2 focus:ring-primary focus:border-primary outline-none disabled:bg-surface-container disabled:text-on-surface-variant"
                  />
                  <button onClick={() => setIdIllegible(!idIllegible)}
                    className={`px-4 border-2 font-bold rounded-lg flex flex-col items-center justify-center transition-colors ${
                      idIllegible ? 'border-error text-error bg-error-container/20' : 'border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary'
                    }`}>
                    <Icon name="photo_camera" />
                    <span className="text-[10px] mt-1">ILEG.</span>
                  </button>
                </div>
                {idIllegible && (
                  <p className="text-xs text-error mt-2 font-medium">⚠ Protocolo E8 activado — se registrará para conciliación manual</p>
                )}
              </div>
            </div>

            {/* Col 2: Pago + total */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">Gestión de Pago</label>
                <div className="space-y-3">
                  {[
                    { value: 'cash'   as const, label: 'Efectivo',     desc: 'Cobro presencial en destino',          icon: 'payments'      },
                    { value: 'remote' as const, label: 'Pago Remoto',  desc: 'Link de pago / transferencia (E4)',    icon: 'phonelink_ring' },
                  ].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${payment === opt.value ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant hover:bg-surface'}`}>
                      <input type="radio" name="payment" value={opt.value} checked={payment === opt.value} onChange={() => setPayment(opt.value)} className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-on-surface">{opt.label}</p>
                        <p className="text-xs text-on-surface-variant">{opt.desc}</p>
                      </div>
                      <Icon name={opt.icon} className="text-on-surface-variant" />
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-dashed border-outline-variant">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">Total a Cobrar</span>
                  <span className="text-2xl font-black text-on-surface">${activeOrder.total.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-surface-container-high border-t border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
            <p className="text-xs text-on-surface-variant max-w-sm flex items-center gap-2">
              <Icon name="info" className="shrink-0" />
              Verifica que el sello de seguridad esté intacto antes de entregar el nuevo cilindro.
            </p>
            <button
              onClick={handleFinish}
              disabled={activeOrder.status !== 'En Validación' || finishing}
              className="w-full md:w-auto px-10 py-4 bg-primary text-white font-bold text-base rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {finishing ? 'Finalizando…' : 'Finalizar Entrega'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
