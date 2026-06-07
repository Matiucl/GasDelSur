import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { MapView } from '@/components/map/MapView'
import { ProductsDB } from '@/lib/db'
import { useOrders } from '@/lib/hooks'
import { useAuth } from '@/context/AuthContext'

// ─── Geocodificación con Nominatim (OSM, sin API key) ─────────
interface GeoResult { label: string; lat: number; lng: number }

async function geocodeAddress(query: string): Promise<GeoResult[]> {
  if (query.trim().length < 4) return []
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=cl&limit=5&q=${encodeURIComponent(query + ' Temuco')}`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    const data = await res.json()
    return data.map((r: { display_name: string; lat: string; lon: string }) => ({
      label: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }))
  } catch {
    return []
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'es' } })
    const data = await res.json()
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

export function ClientNewOrderPage() {
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { createOrder } = useOrders()

  const products     = ProductsDB.all()
  const [selectedKg,    setSelectedKg]    = useState<number>(products[2]?.kg ?? 15)
  const [quantity,      setQuantity]      = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'remote'>('cash')
  const [submitted,     setSubmitted]     = useState(false)
  const [newOrderNum,   setNewOrderNum]   = useState('')

  // Dirección libre
  const [addressInput,  setAddressInput]  = useState('')
  const [suggestions,   setSuggestions]   = useState<GeoResult[]>([])
  const [selectedGeo,   setSelectedGeo]   = useState<GeoResult | null>(null)
  const [geocoding,     setGeocoding]     = useState(false)
  const [addressError,  setAddressError]  = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedProduct = products.find((p) => p.kg === selectedKg) ?? products[0]
  const subtotal = (selectedProduct?.price ?? 0) * quantity

  // Buscar sugerencias con debounce
  const handleAddressChange = (value: string) => {
    setAddressInput(value)
    setSelectedGeo(null)
    setAddressError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 4) { setSuggestions([]); return }
    setGeocoding(true)
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeAddress(value)
      setSuggestions(results)
      setGeocoding(false)
    }, 500)
  }

  const handleSelectSuggestion = (geo: GeoResult) => {
    // Mostrar solo la primera línea (calle + número) para no saturar el campo
    const shortLabel = geo.label.split(',').slice(0, 2).join(',').trim()
    setAddressInput(shortLabel)
    setSelectedGeo({ ...geo, label: shortLabel })
    setSuggestions([])
  }

  // Click en el mapa → geocoding inverso
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true)
    const label = await reverseGeocode(lat, lng)
    const shortLabel = label.split(',').slice(0, 2).join(',').trim()
    setAddressInput(shortLabel)
    setSelectedGeo({ label: shortLabel, lat, lng })
    setSuggestions([])
    setGeocoding(false)
  }, [])

  const handleConfirm = () => {
    if (!selectedGeo) { setAddressError('Selecciona una dirección válida de la lista o haz clic en el mapa.'); return }
    const order = createOrder({
      clientId:    user?.id ?? '',
      clientName:  user?.name ?? '',
      clientPhone: user?.phone ?? '',
      address:     selectedGeo.label,
      lat:         selectedGeo.lat,
      lng:         selectedGeo.lng,
      product:     `Cilindro ${selectedKg}kg`,
      quantity,
      total:       subtotal,
      paymentMethod,
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
          <p className="text-base text-on-surface-variant mt-2">
            Tu pedido <span className="font-bold text-primary">{newOrderNum}</span> fue recibido.
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            Un repartidor será asignado pronto.
          </p>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => navigate('/client/tracking')}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm">
            Seguir Pedido
          </button>
          <button onClick={() => navigate('/client')}
            className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl font-semibold text-sm">
            Inicio
          </button>
        </div>
      </div>
    )
  }

  const mapCenter: [number, number] = selectedGeo
    ? [selectedGeo.lng, selectedGeo.lat]
    : [-72.5904, -38.7359]

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">Nuevo Pedido</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Hola {user?.name?.split(' ')[0]}, ¿qué necesitas hoy?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Producto */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="propane_tank" size={18} /> Producto
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {products.map((product) => (
                <button key={product.kg} onClick={() => setSelectedKg(product.kg)}
                  className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                    selectedKg === product.kg
                      ? 'border-primary bg-primary-fixed/10'
                      : 'border-outline-variant hover:border-primary/50 bg-white'
                  }`}>
                  <Icon name="propane_tank" className={`text-4xl mb-2 ${selectedKg === product.kg ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className={`text-sm font-bold ${selectedKg === product.kg ? 'text-primary' : 'text-on-surface'}`}>{product.kg}kg</span>
                  <span className="text-xs text-on-surface-variant">${product.price.toLocaleString('es-CL')}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between p-4 bg-surface-container rounded-lg">
              <span className="text-sm font-bold text-on-surface">Cantidad</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-outline text-primary hover:bg-white flex items-center justify-center transition-colors">
                  <Icon name="remove" />
                </button>
                <span className="text-xl font-black text-on-surface w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:brightness-110 transition-all">
                  <Icon name="add" />
                </button>
              </div>
            </div>
          </div>

          {/* Dirección libre con geocodificación */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="location_on" size={18} /> Dirección de Entrega
            </h3>

            {/* Input con sugerencias */}
            <div className="relative mb-4">
              <div className={`flex items-center border rounded-lg transition-all ${
                addressError ? 'border-error' : selectedGeo ? 'border-primary' : 'border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary'
              }`}>
                <Icon name={geocoding ? 'progress_activity' : selectedGeo ? 'check_circle' : 'search'}
                  className={`px-3 shrink-0 transition-all ${geocoding ? 'animate-spin text-on-surface-variant' : selectedGeo ? 'text-primary' : 'text-on-surface-variant'}`} />
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Escribe tu calle y número, o haz clic en el mapa…"
                  className="flex-1 py-4 bg-transparent outline-none text-sm text-on-surface placeholder:text-outline/50"
                />
                {addressInput && (
                  <button onClick={() => { setAddressInput(''); setSelectedGeo(null); setSuggestions([]) }}
                    className="px-3 text-on-surface-variant hover:text-on-surface">
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>

              {/* Sugerencias dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-20 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSelectSuggestion(s)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-container-low text-left border-b border-outline-variant last:border-0 transition-colors">
                      <Icon name="location_on" className="text-primary shrink-0 mt-0.5" size={16} />
                      <span className="text-sm text-on-surface line-clamp-2">{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {addressError && (
              <p className="text-xs text-error mb-3 flex items-center gap-1">
                <Icon name="error" size={14} /> {addressError}
              </p>
            )}

            <p className="text-xs text-on-surface-variant mb-3 flex items-center gap-1">
              <Icon name="touch_app" size={14} /> También puedes hacer clic directamente en el mapa para fijar la ubicación.
            </p>

            {/* Mapa interactivo */}
            <div className="w-full rounded-xl overflow-hidden border border-outline-variant" style={{ height: '240px' }}>
              <MapView
                center={mapCenter}
                zoom={selectedGeo ? 15 : 13}
                markers={selectedGeo ? [{
                  id: 'delivery',
                  lat: selectedGeo.lat,
                  lng: selectedGeo.lng,
                  label: selectedGeo.label,
                  color: '#003f87',
                  type: 'destination',
                }] : []}
                className="w-full h-full"
                interactive
                onClick={handleMapClick}
              />
            </div>

            {selectedGeo && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-primary-fixed/10 border border-primary/20 rounded-lg">
                <Icon name="check_circle" className="text-primary shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">Dirección confirmada</p>
                  <p className="text-xs text-on-surface-variant truncate">{selectedGeo.label}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Pago */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant">
            <h3 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Icon name="payments" size={18} /> Método de Pago
            </h3>
            <div className="space-y-2">
              {[
                { value: 'cash'   as const, label: 'Pago en destino', desc: 'Efectivo o tarjeta al repartidor', icon: 'payments'      },
                { value: 'remote' as const, label: 'Pago en línea',   desc: 'Link de pago previo',             icon: 'phonelink_ring' },
              ].map((opt) => (
                <label key={opt.value} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                  paymentMethod === opt.value ? 'border-primary bg-primary/5' : 'border-outline-variant hover:bg-surface-container-low'
                }`}>
                  <input type="radio" name="payment" value={opt.value}
                    checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)}
                    className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">{opt.label}</p>
                    <p className="text-xs text-on-surface-variant">{opt.desc}</p>
                  </div>
                  <Icon name={opt.icon} className="text-primary" />
                </label>
              ))}
            </div>
          </div>

          {/* Resumen + confirmar */}
          <div className="bg-primary-container text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xs font-bold mb-4 uppercase tracking-wider opacity-80">Resumen</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm">{quantity}× Cilindro {selectedKg}kg</span>
                <span className="text-sm font-bold">${subtotal.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between items-center text-sm opacity-80">
                <span>Envío</span>
                <span className="font-bold uppercase text-xs">Gratis</span>
              </div>
              {selectedGeo && (
                <div className="flex items-start gap-1 text-xs opacity-80 pt-1 border-t border-white/20">
                  <Icon name="location_on" size={13} className="shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selectedGeo.label}</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-3 flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-3xl font-black">${subtotal.toLocaleString('es-CL')}</span>
              </div>
            </div>
            <button onClick={handleConfirm}
              className="w-full py-4 bg-white text-primary rounded-xl font-bold text-base hover:bg-surface-container-low transition-colors shadow-md flex items-center justify-center gap-2">
              Confirmar Pedido <Icon name="chevron_right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
