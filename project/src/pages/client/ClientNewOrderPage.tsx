import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { PRODUCTS } from '@/lib/mockData'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

const TEMUCO_ZONES = [
  { label: 'Centro, Temuco', lat: -38.7359, lng: -72.5904 },
  { label: 'Labranza, Temuco', lat: -38.772, lng: -72.643 },
  { label: 'Padre Las Casas', lat: -38.8012, lng: -72.5876 },
  { label: 'Av. Alemania, Temuco', lat: -38.7259, lng: -72.5804 },
  { label: 'Santa Rosa, Temuco', lat: -38.7459, lng: -72.5704 },
]

export function ClientNewOrderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createOrder } = useOrders()

  const [selectedKg, setSelectedKg] = useState<number>(15)
  const [quantity, setQuantity] = useState(1)
  const [zone, setZone] = useState(TEMUCO_ZONES[0])
  const [receiverName, setReceiverName] = useState(user?.name ?? '')
  const [receiverPhone, setReceiverPhone] = useState(user?.phone?.replace('+56 9 ','') ?? '')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'remote'>('cash')
  const [submitted, setSubmitted] = useState(false)
  const [newOrderNum, setNewOrderNum] = useState('')

  const selectedProduct = PRODUCTS.find((p) => p.kg === selectedKg)!
  const subtotal = selectedProduct.price * quantity

  const handleConfirm = () => {
    if (!receiverName.trim() || !receiverPhone.trim()) {
      alert('Completa los datos del receptor')
      return
    }
    const order = createOrder({
      clientName: user?.name ?? receiverName,
      clientPhone: `+56 9 ${receiverPhone}`,
      address: zone.label,
      lat: zone.lat,
      lng: zone.lng,
      product: `Cilindro ${selectedKg}kg`,
      quantity,
      total: subtotal,
      paymentMethod,
      status: 'Solicitado',
    })
    setNewOrderNum(order.orderNumber)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 p-8">
        <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center shadow-xl">
          <Icon name="check_circle" className="text-white text-6xl" filled />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-on-surface">¡Pedido Confirmado!</h2>
          <p className="text-base text-on-surface-variant mt-2">Tu pedido <span className="font-bold text-primary">{newOrderNum}</span> fue recibido.</p>
          <p className="text-sm text-on-surface-variant mt-1">Un repartidor será asignado pronto. Tiempo estimado: 30–45 min.</p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => navigate('/client/tracking')}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm"
          >
            Seguir Pedido
          </button>
          <button
            onClick={() => navigate('/client')}
            className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-semibold text-sm"
          >
            Inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">Nuevo Pedido</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Hola {user?.name?.split(' ')[0]}, selecciona los detalles para tu entrega en Temuco.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Producto */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="propane_tank" size={18} /> Selección de Producto
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRODUCTS.map((product) => (
                <button key={product.kg} onClick={() => setSelectedKg(product.kg)}
                  className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${selectedKg === product.kg ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant hover:border-primary/50 bg-white'}`}>
                  <Icon name="propane_tank" className={`text-4xl mb-2 ${selectedKg === product.kg ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className={`text-sm font-bold ${selectedKg === product.kg ? 'text-primary' : 'text-on-surface'}`}>{product.kg}kg</span>
                  <span className="text-xs text-on-surface-variant">${product.price.toLocaleString('es-CL')}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between p-4 bg-surface-container rounded-lg">
              <span className="text-sm font-bold text-on-surface">Cantidad</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full border border-outline text-primary hover:bg-white flex items-center justify-center transition-colors">
                  <Icon name="remove" />
                </button>
                <span className="text-xl font-black text-on-surface w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:brightness-110 transition-all">
                  <Icon name="add" />
                </button>
              </div>
            </div>
          </div>

          {/* Zona de entrega */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="location_on" size={18} /> Dirección de Entrega
            </h3>
            <select
              value={zone.label}
              onChange={(e) => setZone(TEMUCO_ZONES.find((z) => z.label === e.target.value) ?? TEMUCO_ZONES[0])}
              className="w-full h-12 px-4 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white mb-4"
            >
              {TEMUCO_ZONES.map((z) => <option key={z.label} value={z.label}>{z.label}</option>)}
            </select>
            <div className="w-full rounded-xl overflow-hidden border border-outline-variant" style={{ height: '200px' }}>
              <MapView center={[zone.lng, zone.lat]} zoom={14} markers={[{ lat: zone.lat, lng: zone.lng, label: zone.label }]} className="w-full h-full" interactive={false} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Receptor */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="person" size={18} /> Datos del Receptor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nombre Completo</label>
                <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Nombre de quien recibe" className="w-full h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Teléfono de Contacto</label>
                <div className="flex gap-2">
                  <div className="h-12 px-3 border border-outline-variant rounded-lg bg-surface-container flex items-center text-sm font-medium text-on-surface-variant">+56 9</div>
                  <input type="tel" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="1234 5678" className="flex-1 h-12 px-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
                </div>
              </div>
              <div className="pt-2 space-y-2">
                {[
                  { value: 'cash' as const, label: 'Pago en destino', desc: 'Efectivo o Tarjeta al repartidor', icon: 'payments' },
                  { value: 'remote' as const, label: 'Pago en línea', desc: 'Link de pago previo', icon: 'phonelink_ring' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container-low'}`}>
                    <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-on-surface">{opt.label}</p>
                      <p className="text-xs text-on-surface-variant">{opt.desc}</p>
                    </div>
                    <Icon name={opt.icon} className="text-primary" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-primary-container text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-wider opacity-80">Resumen del Pedido</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm">{quantity}x Cilindro Gas {selectedKg}kg</span>
                <span className="text-sm font-bold">${subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Envío</span>
                <span className="text-xs font-bold uppercase">Gratis</span>
              </div>
              <div className="border-t border-white/20 pt-3 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black">${subtotal.toLocaleString('es-CL')}</span>
              </div>
            </div>
            <button onClick={handleConfirm} className="w-full py-4 bg-white text-primary rounded-xl font-bold text-base hover:bg-surface-container-low transition-colors shadow-md flex items-center justify-center gap-2">
              Confirmar Pedido <Icon name="chevron_right" />
            </button>
            <p className="text-center text-xs mt-3 opacity-70">Tiempo estimado de entrega: 30–45 min</p>
          </div>
        </div>
      </div>
    </div>
  )
}
