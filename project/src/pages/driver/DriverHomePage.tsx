import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'
import { CylindersDB } from '@/lib/db'

type CylinderCondition = 'apt' | 'not-apt' | null
type PaymentMethod = 'cash' | 'remote' | null

export function DriverHomePage() {
  const { user } = useAuth()
  const { orders, updateStatus } = useOrders()

  // Obtener el primer pedido activo del chofer
  const activeOrder = orders.find(
    (o) => o.driverName === user?.name &&
    ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  )

  const pendingCount = orders.filter(
    (o) => o.driverName === user?.name &&
    ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  ).length

  const [cylinderId, setCylinderId] = useState('')
  const [idIllegible, setIdIllegible] = useState(false)
  const [condition, setCondition] = useState<CylinderCondition>(null)
  const [payment, setPayment] = useState<PaymentMethod>(null)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState(false)
  const [tokenConfirmed, setTokenConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  const handleFinish = () => {
    if (!activeOrder) return
    if (!condition) { alert('Indica el estado del envase'); return }
    if (!payment) { alert('Selecciona el método de pago'); return }
    if (!idIllegible && cylinderId.length !== 7) { alert('El ID del cilindro debe tener 7 dígitos'); return }

    // Registrar cilindro si es ilegible (E8)
    if (idIllegible && user?.name) {
      CylindersDB.registerIllegible(user.name, '15kg')
    }

    updateStatus(activeOrder.id, 'Entregado')
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
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center shadow-xl">
          <Icon name="check_circle" className="text-white text-6xl" filled />
        </div>
        <h2 className="text-2xl font-black text-on-surface">¡Entrega Completada!</h2>
        <p className="text-sm text-on-surface-variant">Estado → Entregado</p>
      </div>
    )
  }

  if (!activeOrder) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-[800px] mx-auto">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Hola, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-on-surface-variant mt-1">No tienes entregas pendientes ahora.</p>
        </div>
        <div className="text-center py-20 text-on-surface-variant">
          <Icon name="check_circle" className="text-6xl mb-4 block mx-auto text-primary" />
          <p className="text-base font-bold text-on-surface">¡Todo al día!</p>
          <p className="text-sm mt-1">Todas las entregas completadas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="md:hidden">
        <h2 className="text-2xl font-black text-on-surface">Hola, {user?.name?.split(' ')[0]}</h2>
        <p className="text-sm text-on-surface-variant">{pendingCount} entrega(s) pendientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Mapa */}
        <section className="md:col-span-8 relative rounded-xl overflow-hidden border border-outline-variant" style={{ height: '380px' }}>
          <MapView
            center={[activeOrder.lng, activeOrder.lat]}
            zoom={14}
            markers={[{ lat: activeOrder.lat, lng: activeOrder.lng, label: activeOrder.address }]}
            className="w-full h-full"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest p-4 rounded-xl shadow-md border border-outline-variant flex justify-between items-center">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shrink-0">
                <Icon name="location_on" className="text-white" filled />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-on-surface-variant">Destino Actual</p>
                <p className="text-sm font-bold text-on-surface truncate">{activeOrder.address}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Panel */}
        <aside className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-primary-container text-white p-6 rounded-xl">
            <h3 className="text-lg font-black mb-1">Entrega #{activeOrder.orderNumber}</h3>
            <p className="text-sm opacity-90 mb-4">
              {activeOrder.clientName} · {activeOrder.product} x{activeOrder.quantity}
            </p>
            <div className="flex flex-col gap-3">
              {activeOrder.status === 'Asignado' || activeOrder.status === 'En Ruta' ? (
                <button
                  onClick={handleLlegue}
                  className="w-full py-3 bg-white text-primary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-sm"
                >
                  <Icon name="check_circle" /> Llegué a destino
                </button>
              ) : null}

              {/* Token validation */}
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
                  {tokenError && <p className="text-xs text-white font-bold">❌ Token incorrecto</p>}
                  <button
                    onClick={handleValidateToken}
                    className="w-full py-3 bg-white text-primary font-bold rounded-lg text-sm"
                  >
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

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
            <p className="text-xs text-on-surface-variant mb-2">Estado del Pedido</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{activeOrder.status}</span>
            </div>
            {activeOrder.securityToken && (
              <p className="text-xs text-on-surface-variant mt-2">Token esperado: <span className="font-mono font-bold text-primary">{activeOrder.securityToken}</span></p>
            )}
          </div>
        </aside>

        {/* Validation form */}
        <section className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Validación de Envase</h3>
            <p className="text-xs text-on-surface-variant mt-1">Protocolo de entrega según modelo MPN</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna 1 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">Estado del envase recibido</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 'apt' as const, label: 'Apto', icon: 'task_alt' },
                    { val: 'not-apt' as const, label: 'No Apto', icon: 'report' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setCondition(opt.val)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl transition-all ${
                        condition === opt.val
                          ? opt.val === 'apt' ? 'border-primary bg-primary-fixed/20' : 'border-error bg-error-container/20'
                          : 'border-outline-variant hover:border-primary/50'
                      }`}
                    >
                      <Icon name={opt.icon} className={condition === opt.val ? (opt.val === 'apt' ? 'text-primary' : 'text-error') : 'text-on-surface-variant'} />
                      <span className={`text-sm font-bold ${condition === opt.val ? (opt.val === 'apt' ? 'text-primary' : 'text-error') : 'text-on-surface-variant'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
                {condition === 'not-apt' && (
                  <p className="text-xs text-error mt-2 font-medium">⚠ Protocolo E1 activado — venta de envase nuevo</p>
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
                  <button
                    onClick={() => setIdIllegible(!idIllegible)}
                    className={`px-4 border-2 font-bold rounded-lg flex flex-col items-center justify-center hover:bg-secondary-fixed/30 transition-colors ${
                      idIllegible ? 'border-error text-error bg-error-container/20' : 'border-secondary text-secondary'
                    }`}
                  >
                    <Icon name="photo_camera" />
                    <span className="text-[10px] mt-1">ILEG.</span>
                  </button>
                </div>
                {idIllegible && (
                  <p className="text-xs text-error mt-2 font-medium">⚠ Protocolo E8 activado — se registrará foto del cilindro</p>
                )}
              </div>
            </div>

            {/* Columna 2 */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">Gestión de Pago</label>
                <div className="space-y-3">
                  {[
                    { value: 'cash' as const, label: 'Efectivo', desc: 'Cobro presencial en destino', icon: 'payments' },
                    { value: 'remote' as const, label: 'Pago Remoto', desc: 'Link de pago o transferencia (E4)', icon: 'phonelink_ring' },
                  ].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${payment === opt.value ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant hover:bg-surface'}`}>
                      <input type="radio" name="payment" value={opt.value} checked={payment === opt.value} onChange={() => setPayment(opt.value)} className="w-5 h-5 text-primary border-outline-variant" />
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
              disabled={activeOrder.status !== 'En Validación'}
              className="w-full md:w-auto px-10 py-4 bg-primary text-white font-bold text-base rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finalizar Entrega
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
