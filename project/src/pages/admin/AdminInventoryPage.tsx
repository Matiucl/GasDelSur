import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useCylinders, useOrders, useProducts } from '@/lib/hooks'
import { ProductsDB } from '@/lib/db'
import type { Cylinder, Product } from '@/types'

// ─── Sub-componentes ──────────────────────────────────────────
function StatCard({ value, label, icon, variant = 'default' }: {
  value: string | number; label: string; icon: string; variant?: 'default' | 'error' | 'primary'
}) {
  const cls = {
    default: 'bg-surface-container-lowest border border-outline-variant text-primary',
    error:   'bg-error-container/30 border border-error/20 text-error',
    primary: 'bg-primary-container text-white',
  }[variant]
  return (
    <div className={`p-4 rounded-xl flex flex-col gap-1 ${cls}`}>
      <Icon name={icon} className="mb-1" />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold opacity-80">{label}</p>
    </div>
  )
}

function ValidationModal({ cylinder, onClose, onConfirm }: {
  cylinder: Cylinder; onClose: () => void; onConfirm: (id: string) => void
}) {
  const [inputId, setInputId] = useState('')
  const [error,   setError]   = useState('')

  const handleConfirm = () => {
    const clean = inputId.trim().toUpperCase()
    if (!clean) { setError('Ingresa un ID válido.'); return }
    if (!/^[A-Z0-9\-]{4,15}$/.test(clean)) { setError('Formato inválido. Ejemplo: CYL-12345'); return }
    onConfirm(clean)
  }

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-xl border border-outline-variant p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Validación Manual — Excepción E8</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Chofer: {cylinder.driverName} · Registrado: {new Date(cylinder.registeredAt).toLocaleString('es-CL')}
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <Icon name="close" />
          </button>
        </div>

        {/* Foto placeholder */}
        <div className="aspect-video bg-surface-container-high rounded-lg border border-outline-variant flex items-center justify-center">
          {cylinder.captureUrl ? (
            <img src={cylinder.captureUrl} alt="Cilindro" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="text-center text-on-surface-variant">
              <Icon name="photo_camera" className="text-4xl mb-2 block" />
              <p className="text-xs">Sin foto adjunta</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-on-surface-variant">
            ID del Envase (ej: CYL-12345 o 7 dígitos)
          </label>
          <input
            type="text"
            value={inputId}
            onChange={(e) => { setInputId(e.target.value.toUpperCase()); setError('') }}
            placeholder="CYL-00000"
            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-mono text-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border border-outline-variant text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-low">
            Cancelar
          </button>
          <button onClick={handleConfirm}
            className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold shadow-md hover:brightness-110">
            Confirmar ID
          </button>
        </div>
      </div>
    </div>
  )
}

function StockEditModal({ product, onClose, onSave }: {
  product: Product; onClose: () => void; onSave: (id: string, stock: number) => void
}) {
  const [stock, setStock] = useState(String(product.stock))

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl shadow-xl border border-outline-variant p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface">Editar Stock</h3>
          <button onClick={onClose}><Icon name="close" className="text-on-surface-variant" /></button>
        </div>
        <p className="text-sm text-on-surface-variant">{product.name}</p>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">
            Unidades disponibles en bodega
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full h-12 px-4 border border-outline-variant rounded-lg text-lg font-bold text-center focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border border-outline-variant rounded-lg text-sm font-semibold">Cancelar</button>
          <button onClick={() => { onSave(product.id, Number(stock)); onClose() }}
            className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-bold shadow-md">Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function AdminInventoryPage() {
  const { cylinders, validate }  = useCylinders()
  const { orders }               = useOrders()
  const { products, refresh: refreshProducts } = useProducts()

  const [validating,   setValidating]   = useState<Cylinder | null>(null)
  const [editingStock, setEditingStock] = useState<Product | null>(null)
  const [search,       setSearch]       = useState('')

  const pendingCylinders = cylinders.filter((c) => c.needsManualValidation)
  const activeOrders     = orders.filter((o) =>
    ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
  ).length

  const filteredCylinders = cylinders.filter((c) =>
    !search ||
    c.driverName?.toLowerCase().includes(search.toLowerCase()) ||
    c.serialNumber.toLowerCase().includes(search.toLowerCase())
  )

  const handleSaveStock = (productId: string, stock: number) => {
    ProductsDB.update(productId, { stock })
    refreshProducts()
  }

  const handleCloseCycle = () => {
    if (pendingCylinders.length > 0) {
      alert(`⚠️ Hay ${pendingCylinders.length} cilindro(s) con ID ilegible pendientes de validación. Valídalos antes de cerrar el ciclo (Decisión D5 — Cuadratura).`)
      return
    }
    alert('✅ Cuadratura completada. Todos los registros coinciden. Ciclo cerrado correctamente.')
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Bodega y Cuadratura</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Decisión D5 · Conciliación de inventario y validación de envases
          </p>
        </div>
        <button onClick={handleCloseCycle}
          className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md hover:brightness-110 transition-all">
          <Icon name="task_alt" /> Cerrar Ciclo (D5)
        </button>
      </div>

      {/* KPIs de stock por producto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-primary transition-colors cursor-pointer"
            onClick={() => setEditingStock(p)}
          >
            <div className="flex items-start justify-between">
              <Icon name="propane_tank" className="text-primary mb-2" />
              <button className="text-on-surface-variant hover:text-primary">
                <Icon name="edit" size={16} />
              </button>
            </div>
            <p className="text-3xl font-black text-on-surface">{p.stock}</p>
            <p className="text-xs font-semibold text-on-surface-variant mt-1">{p.name}</p>
            <p className="text-xs text-on-surface-variant">${p.price.toLocaleString('es-CL')} c/u</p>
          </div>
        ))}
        <StatCard value={pendingCylinders.length} label="IDs Ilegibles (E8)" icon="warning"
          variant={pendingCylinders.length > 0 ? 'error' : 'default'} />
        <StatCard value={`${activeOrders} pedidos`} label="En circulación" icon="local_shipping" variant="primary" />
      </div>

      {/* Tabla de envases */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex flex-wrap items-center gap-4">
          <h3 className="text-base font-bold text-on-surface flex-1">Registro de Envases</h3>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por chofer o ID…"
              className="pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none w-64"
            />
          </div>
        </div>

        {filteredCylinders.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant">
            <Icon name="inventory_2" className="text-5xl mb-3 block mx-auto" />
            <p className="text-base font-bold text-on-surface">Sin registros de envases</p>
            <p className="text-sm mt-1">Los envases registrados por los choferes aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  {['ID Envase','Chofer','Tipo','Estado','Registrado','Acción'].map((h) => (
                    <th key={h} className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredCylinders.map((c) => {
                  const isIllegible = c.status === 'illegible'
                  return (
                    <tr key={c.id} className={`transition-colors ${isIllegible ? 'bg-error-container/10 hover:bg-error-container/20' : 'hover:bg-surface-container-low'}`}>
                      <td className="p-4">
                        {isIllegible ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-error font-mono">ILEGIBLE</span>
                            <Icon name="error" className="text-error text-[16px]" />
                          </div>
                        ) : (
                          <span className="text-sm font-mono text-on-surface">{c.serialNumber}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-on-surface">{c.driverName ?? '—'}</td>
                      <td className="p-4 text-sm text-on-surface">{c.type}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          isIllegible ? 'bg-error text-white' :
                          c.status === 'full'  ? 'bg-primary-container text-white' :
                          'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {c.status === 'full' ? 'Lleno' : c.status === 'empty' ? 'Vacío' : 'Ilegible'}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-on-surface-variant">
                        {new Date(c.registeredAt).toLocaleString('es-CL', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="p-4">
                        {isIllegible ? (
                          <button onClick={() => setValidating(c)}
                            className="bg-error text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:brightness-110 transition-all">
                            Validar ID
                          </button>
                        ) : (
                          <Icon name="check_circle" className="text-primary" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-outline-variant flex justify-between items-center">
          <span className="text-xs text-on-surface-variant">
            {filteredCylinders.length} envases · {pendingCylinders.length} requieren validación manual
          </span>
        </div>
      </div>

      {/* Modales */}
      {validating && (
        <ValidationModal
          cylinder={validating}
          onClose={() => setValidating(null)}
          onConfirm={(id) => { validate(validating.id, id); setValidating(null) }}
        />
      )}
      {editingStock && (
        <StockEditModal
          product={editingStock}
          onClose={() => setEditingStock(null)}
          onSave={handleSaveStock}
        />
      )}
    </div>
  )
}
