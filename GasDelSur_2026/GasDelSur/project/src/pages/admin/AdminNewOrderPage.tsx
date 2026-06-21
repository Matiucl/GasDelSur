import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { OrdersDB } from '@/lib/db'
import { useOrders, useUsers, useProducts } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

const TEMUCO_ZONES = [
  { label: 'Centro, Temuco',       lat: -38.7359, lng: -72.5904 },
  { label: 'Labranza, Temuco',     lat: -38.772,  lng: -72.643  },
  { label: 'Padre Las Casas',      lat: -38.8012, lng: -72.5876 },
  { label: 'Av. Alemania, Temuco', lat: -38.7259, lng: -72.5804 },
  { label: 'Santa Rosa, Temuco',   lat: -38.7459, lng: -72.5704 },
  { label: 'Villarrica',           lat: -39.2826, lng: -72.2249 },
]

export function AdminNewOrderPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { createOrder, refresh } = useOrders()
  const { users } = useUsers()
  const { products } = useProducts()

  const drivers  = users.filter((u) => u.role === 'driver')

  const [clientName,      setClientName]      = useState('')
  const [clientPhone,     setClientPhone]      = useState('')
  const [address,         setAddress]          = useState(TEMUCO_ZONES[0].label)
  const [selectedKg,      setSelectedKg]       = useState<number | null>(null)
  const [quantity,        setQuantity]         = useState(1)
  const [paymentMethod,   setPaymentMethod]    = useState<'cash' | 'remote' | 'card'>('cash')
  const [selectedDriverId,setSelectedDriverId] = useState('')
  const [plate,           setPlate]            = useState('')
  const [notes,           setNotes]            = useState('')
  const [errors,          setErrors]           = useState<Record<string,string>>({})
  const [submitted,       setSubmitted]        = useState(false)
  const [submitting,      setSubmitting]       = useState(false)

  // Una vez que llega el catálogo, preseleccionar el cilindro de 15kg
  // (o el tercero disponible) si el usuario todavía no eligió ninguno.
  useEffect(() => {
    if (selectedKg === null && products.length > 0) {
      setSelectedKg(products[2]?.kg ?? products[0].kg)
    }
  }, [products, selectedKg])

  const product = products.find((p) => p.kg === selectedKg) ?? products[0]
  const total   = (product?.price ?? 0) * quantity

  const validate = () => {
    const e: Record<string,string> = {}
    if (!clientName.trim())  e.clientName  = 'Requerido'
    if (!clientPhone.trim()) e.clientPhone = 'Requerido'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (!selectedKg) return

    setSubmitting(true)
    try {
      const zone = TEMUCO_ZONES.find((z) => z.label === address) ?? TEMUCO_ZONES[0]
      const order = await createOrder({
        clientId:    user?.id ?? 'admin',
        clientName:  clientName.trim(),
        clientPhone: `+56 9 ${clientPhone.trim()}`,
        address,
        lat: zone.lat,
        lng: zone.lng,
        product: `Cilindro ${selectedKg}kg`,
        quantity,
        total,
        paymentMethod,
        notes: notes.trim() || undefined,
      })

      // Si se seleccionó chofer, asignar directo
      if (selectedDriverId && plate) {
        const driver = drivers.find((d) => d.id === selectedDriverId)
        if (driver) {
          await OrdersDB.assignDriver(order.id, driver.id, driver.name, plate)
          await refresh()
        }
      }

      setSubmitted(true)
      setTimeout(() => navigate('/admin/orders'), 1500)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center shadow-lg">
          <Icon name="check_circle" className="text-white text-5xl" filled />
        </div>
        <h2 className="text-xl font-black text-on-surface">Pedido Creado</h2>
        <p className="text-sm text-on-surface-variant">Redirigiendo a pedidos…</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[760px] mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container rounded-lg">
          <Icon name="arrow_back" className="text-on-surface" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-on-surface">Nuevo Pedido</h2>
          <p className="text-sm text-on-surface-variant">Registro desde administración</p>
        </div>
      </div>

      {/* Cliente */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Icon name="person" size={16} /> Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nombre completo *</label>
            <input value={clientName} onChange={(e) => { setClientName(e.target.value); setErrors({}) }}
              placeholder="Ana Pérez" className={`w-full h-12 px-4 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:outline-none ${errors.clientName ? 'border-error' : 'border-outline-variant'}`} />
            {errors.clientName && <p className="text-xs text-error mt-1">{errors.clientName}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Teléfono *</label>
            <div className="flex gap-2">
              <div className="h-12 px-3 border border-outline-variant rounded-lg bg-surface-container flex items-center text-sm text-on-surface-variant shrink-0">+56 9</div>
              <input value={clientPhone} onChange={(e) => { setClientPhone(e.target.value); setErrors({}) }}
                placeholder="1234 5678"
                className={`flex-1 h-12 px-4 rounded-lg border text-sm focus:ring-2 focus:ring-primary focus:outline-none ${errors.clientPhone ? 'border-error' : 'border-outline-variant'}`} />
            </div>
            {errors.clientPhone && <p className="text-xs text-error mt-1">{errors.clientPhone}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Zona de Entrega</label>
          <select value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full h-12 px-4 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white">
            {TEMUCO_ZONES.map((z) => <option key={z.label} value={z.label}>{z.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Observaciones</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones de entrega, referencias, etc."
            className="w-full h-12 px-4 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
        </div>
      </section>

      {/* Producto */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Icon name="propane_tank" size={16} /> Producto
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <button key={p.kg} onClick={() => setSelectedKg(p.kg)}
              className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${selectedKg === p.kg ? 'border-primary bg-primary-fixed/10' : 'border-outline-variant hover:border-primary/50'}`}>
              <Icon name="propane_tank" className={`text-3xl mb-1 ${selectedKg === p.kg ? 'text-primary' : 'text-on-surface-variant'}`} />
              <span className={`text-sm font-bold ${selectedKg === p.kg ? 'text-primary' : 'text-on-surface'}`}>{p.kg}kg</span>
              <span className="text-xs text-on-surface-variant">${p.price.toLocaleString('es-CL')}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between p-4 bg-surface-container rounded-lg">
          <span className="text-sm font-bold text-on-surface">Cantidad</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-full border border-outline text-primary flex items-center justify-center"><Icon name="remove" /></button>
            <span className="text-xl font-black w-6 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center"><Icon name="add" /></button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(['cash','card','remote'] as const).map((m) => {
            const labels = { cash: 'Efectivo', card: 'Tarjeta', remote: 'Pago Remoto' }
            return (
              <label key={m} className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === m ? 'border-primary bg-primary/5' : 'border-outline-variant'}`}>
                <input type="radio" name="pay" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{labels[m]}</span>
              </label>
            )
          })}
        </div>
      </section>

      {/* Asignación */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Icon name="local_shipping" size={16} /> Asignar Chofer (opcional)
        </h3>
        {drivers.length === 0 ? (
          <div className="p-4 bg-surface-container rounded-lg flex items-center gap-3 text-on-surface-variant">
            <Icon name="info" size={18} />
            <p className="text-sm">No hay choferes registrados. Créalos desde <button onClick={() => navigate('/admin/settings')} className="text-primary font-semibold underline">Ajustes</button>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Chofer</label>
              <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white">
                <option value="">Sin asignar</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Patente del Vehículo</label>
              <input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="AB-12-CD" disabled={!selectedDriverId}
                className="w-full h-12 px-4 rounded-lg border border-outline-variant text-sm focus:ring-2 focus:ring-primary focus:outline-none font-mono disabled:opacity-50" />
            </div>
          </div>
        )}
      </section>

      {/* Resumen */}
      <div className="bg-primary-container text-white p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs opacity-80 uppercase tracking-wider mb-1">Total del Pedido</p>
          <p className="text-3xl font-black">${total.toLocaleString('es-CL')}</p>
          <p className="text-sm opacity-80 mt-1">{quantity}x Cilindro {selectedKg}kg</p>
        </div>
        <button onClick={handleSubmit} disabled={submitting || !selectedKg}
          className="px-8 py-4 bg-white text-primary rounded-xl font-bold text-base hover:bg-surface-container-low transition-colors shadow-md flex items-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting
            ? <><Icon name="progress_activity" className="animate-spin" /> Creando…</>
            : <><Icon name="add_shopping_cart" /> Crear Pedido</>
          }
        </button>
      </div>
    </div>
  )
}
