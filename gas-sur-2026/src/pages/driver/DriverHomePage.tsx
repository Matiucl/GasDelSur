import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { MOCK_ORDERS } from '@/lib/mockData'

type CylinderCondition = 'apt' | 'not-apt' | null
type PaymentMethod = 'cash' | 'remote' | null

export function DriverHomePage() {
  const activeOrder = MOCK_ORDERS[0] // En Ruta
  const [cylinderId, setCylinderId] = useState('')
  const [idIllegible, setIdIllegible] = useState(false)
  const [condition, setCondition] = useState<CylinderCondition>(null)
  const [payment, setPayment] = useState<PaymentMethod>(null)


  const handleFinish = () => {
    alert('✅ Entrega finalizada correctamente. Estado → Entregado')
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Mobile greeting */}
      <div className="md:hidden">
        <h2 className="text-2xl font-black text-on-surface">Hola, Luis</h2>
        <p className="text-sm text-on-surface-variant">
          Tienes {MOCK_ORDERS.filter((o) => o.status === 'En Ruta' || o.status === 'Asignado').length} entrega(s) pendientes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Map */}
        <section className="md:col-span-8 h-[300px] md:h-[400px] relative rounded-xl overflow-hidden border border-outline-variant">
          <MapView
            center={[activeOrder.lng, activeOrder.lat]}
            zoom={14}
            markers={[{ lat: activeOrder.lat, lng: activeOrder.lng, label: activeOrder.address }]}
            className="w-full h-full"
          />
          {/* Overlay card */}
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
            <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:brightness-110 transition-all ml-2 shrink-0">
              Ver Guía
            </button>
          </div>
        </section>

        {/* Action panel */}
        <aside className="md:col-span-4 flex flex-col gap-4">
          <div className="bg-primary-container text-white p-6 rounded-xl">
            <h3 className="text-lg font-black mb-1">Entrega #{activeOrder.orderNumber}</h3>
            <p className="text-sm opacity-90 mb-4">
              Cliente: {activeOrder.clientName} · {activeOrder.product} x{activeOrder.quantity}
            </p>
            <div className="flex flex-col gap-3">
              <button className="w-full py-3 bg-white text-primary font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors text-sm">
                <Icon name="check_circle" />
                Llegué a destino
              </button>
              <button className="w-full py-3 border-2 border-white text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-sm">
                <Icon name="key" />
                Validar Token
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
            <p className="text-xs text-on-surface-variant mb-2">Estado del Pedido</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">EN RUTA</span>
            </div>
          </div>
        </aside>

        {/* Validation form */}
        <section className="md:col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Validación de Envase</h3>
            <p className="text-xs text-on-surface-variant mt-1">Protocolo de entrega según modelo MPN</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Inspection */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">
                  Estado del envase recibido
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCondition('apt')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl transition-all ${
                      condition === 'apt'
                        ? 'border-primary bg-primary-fixed/20'
                        : 'border-outline-variant hover:border-primary/50'
                    }`}
                  >
                    <Icon name="task_alt" className={condition === 'apt' ? 'text-primary' : 'text-on-surface-variant'} />
                    <span className={`text-sm font-bold ${condition === 'apt' ? 'text-primary' : 'text-on-surface-variant'}`}>
                      Apto
                    </span>
                  </button>
                  <button
                    onClick={() => setCondition('not-apt')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-xl transition-all ${
                      condition === 'not-apt'
                        ? 'border-error bg-error-container/20'
                        : 'border-outline-variant hover:border-error/50'
                    }`}
                  >
                    <Icon name="report" className={condition === 'not-apt' ? 'text-error' : 'text-on-surface-variant'} />
                    <span className={`text-sm font-bold ${condition === 'not-apt' ? 'text-error' : 'text-on-surface-variant'}`}>
                      No Apto
                    </span>
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant mt-2 italic">
                  "No Apto" activa protocolo E1 (Marca ajena / Daño)
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">
                  ID del Cilindro (7 dígitos)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={idIllegible ? 'ILEGIBLE' : cylinderId}
                    onChange={(e) => !idIllegible && setCylinderId(e.target.value)}
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
                    <span className="text-[10px] mt-1">ILEGIBLE</span>
                  </button>
                </div>
                {idIllegible && (
                  <p className="text-xs text-error mt-2 font-medium">
                    ⚠ Protocolo E8 activado — se requiere fotografía del cilindro
                  </p>
                )}
                <p className="text-xs text-on-surface-variant mt-1">
                  Botón "Ilegible" activa protocolo E8 (Registro fotográfico)
                </p>
              </div>
            </div>

            {/* Column 2: Payment */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-3">
                  Gestión de Pago
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'cash' as const, label: 'Efectivo', desc: 'Cobro presencial en destino', icon: 'payments' },
                    { value: 'remote' as const, label: 'Pago Remoto', desc: 'Link de pago o transferencia (E4)', icon: 'phonelink_ring' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                        payment === opt.value
                          ? 'border-primary bg-primary-fixed/10'
                          : 'border-outline-variant hover:bg-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={opt.value}
                        checked={payment === opt.value}
                        onChange={() => setPayment(opt.value)}
                        className="w-5 h-5 text-primary border-outline-variant focus:ring-primary"
                      />
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
                  <span className="text-2xl font-black text-on-surface">
                    ${activeOrder.total.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer action */}
          <div className="p-6 bg-surface-container-high border-t border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="info" className="text-on-surface-variant" />
              <p className="text-xs text-on-surface-variant max-w-sm">
                Asegúrese de que el sello de seguridad esté intacto antes de entregar el nuevo cilindro.
              </p>
            </div>
            <button
              onClick={handleFinish}
              className="w-full md:w-auto px-10 py-4 bg-primary text-white font-bold text-base rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              Finalizar Entrega
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
