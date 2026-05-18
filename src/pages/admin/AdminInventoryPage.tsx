import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { MOCK_CYLINDERS, MOCK_ORDERS } from '@/lib/mockData'
import type { Cylinder } from '@/types'

function StatCard({
  value,
  label,
  icon,
  variant = 'default',
}: {
  value: string | number
  label: string
  icon: string
  variant?: 'default' | 'error' | 'primary'
}) {
  const variantClass = {
    default: 'bg-surface-container-lowest border border-outline-variant text-primary',
    error: 'bg-error-container text-on-error-container',
    primary: 'bg-primary-container text-white',
  }[variant]

  return (
    <div className={`p-4 rounded-xl flex flex-col gap-1 ${variantClass}`}>
      <div className="flex items-center justify-between mb-1">
        <Icon name={icon} />
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold opacity-80">{label}</p>
    </div>
  )
}

function CylinderRow({ cylinder, onValidate }: { cylinder: Cylinder; onValidate: (c: Cylinder) => void }) {
  const isIllegible = cylinder.status === 'illegible'
  return (
    <tr className={`transition-colors ${isIllegible ? 'bg-error-container/10 hover:bg-error-container/20' : 'hover:bg-surface-container-low'}`}>
      <td className="p-4">
        {isIllegible ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-error">E8-ERROR</span>
            <Icon name="error" className="text-error text-[18px]" />
          </div>
        ) : (
          <span className="text-sm font-medium text-on-surface font-mono">{cylinder.serialNumber}</span>
        )}
      </td>
      <td className="p-4 text-sm text-on-surface">{cylinder.driverName}</td>
      <td className="p-4 text-sm text-on-surface">{cylinder.type}</td>
      <td className="p-4">
        {isIllegible ? (
          <span className="px-2 py-1 rounded bg-error text-white text-xs font-bold uppercase">Ilegible</span>
        ) : (
          <span className="px-2 py-1 rounded bg-surface-container-high text-primary text-xs font-bold uppercase">Recibido</span>
        )}
      </td>
      <td className="p-4 text-right">
        {isIllegible ? (
          <button
            onClick={() => onValidate(cylinder)}
            className="bg-error text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:brightness-110 transition-all"
          >
            Validar Manual
          </button>
        ) : (
          <button className="text-primary hover:bg-primary/5 p-2 rounded-full">
            <Icon name="visibility" />
          </button>
        )}
      </td>
    </tr>
  )
}

function ValidationModal({ cylinder, onClose, onConfirm }: {
  cylinder: Cylinder
  onClose: () => void
  onConfirm: (id: string) => void
}) {
  const [inputId, setInputId] = useState('')

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-xl border border-outline-variant p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-on-surface">Validación Manual E8</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <Icon name="close" />
          </button>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          La cámara no detectó el ID automáticamente. Ingrese el código manualmente según la foto adjunta.
        </p>
        <div className="aspect-video bg-surface-container-high rounded-lg mb-4 border border-outline-variant flex items-center justify-center">
          <div className="text-center text-on-surface-variant">
            <Icon name="photo_camera" className="text-4xl mb-2 block" />
            <p className="text-xs">Foto del cilindro adjunta</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              ID del Envase (Chofer: {cylinder.driverName})
            </label>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value.toUpperCase())}
              placeholder="Ej: CYL-12345"
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-mono text-lg focus:ring-2 focus:ring-primary focus:outline-none uppercase"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant text-on-surface rounded-lg text-sm font-semibold"
            >
              Rechazar Captura
            </button>
            <button
              onClick={() => onConfirm(inputId)}
              className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold shadow-md"
            >
              Confirmar ID
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminInventoryPage() {
  const [cylinders, setCylinders] = useState(MOCK_CYLINDERS)
  const [validatingCylinder, setValidatingCylinder] = useState<Cylinder | null>(null)

  const illegibleCount = cylinders.filter((c) => c.status === 'illegible').length
  const activeOrders = MOCK_ORDERS.filter((o) =>
    ['Asignado', 'En Ruta', 'En Punto de Entrega', 'En Validación'].includes(o.status)
  ).length

  const handleConfirmValidation = (newId: string) => {
    if (!validatingCylinder) return
    setCylinders((prev) =>
      prev.map((c) =>
        c.id === validatingCylinder.id
          ? { ...c, serialNumber: newId || `CYL-VALIDATED`, status: 'full', needsManualValidation: false }
          : c
      )
    )
    setValidatingCylinder(null)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Cuadratura y Bodega</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Gestión de envases y validación de entregas en ruta.
          </p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all">
          <Icon name="task_alt" />
          Cerrar Ciclo / Finalizar
        </button>
      </div>

      {/* Stats bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={425} label="Llenos 15kg" icon="propane_tank" />
        <StatCard value={182} label="Llenos 45kg" icon="propane_tank" />
        <StatCard
          value={illegibleCount}
          label={`IDs Ilegibles (E8)`}
          icon="warning"
          variant="error"
        />
        <StatCard
          value={`${activeOrders} rutas`}
          label="94% Entregado"
          icon="local_shipping"
          variant="primary"
        />
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1">
            Buscar Chofer
          </label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Nombre o ID del chofer"
              className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1 ml-1">
            Fecha de Ruta
          </label>
          <input
            type="date"
            defaultValue="2026-05-15"
            className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <button className="bg-surface-container-high text-on-surface px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 border border-outline-variant hover:bg-surface-container-highest">
          <Icon name="filter_list" />
          Aplicar Filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                {['ID Envase', 'Chofer', 'Tipo', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {cylinders.map((cylinder) => (
                <CylinderRow
                  key={cylinder.id}
                  cylinder={cylinder}
                  onValidate={setValidatingCylinder}
                />
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-4 border-t border-outline-variant flex justify-between items-center">
          <span className="text-xs text-on-surface-variant">
            Mostrando 1–{cylinders.length} de {cylinders.length} envases
          </span>
          <div className="flex gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`px-3 py-1 rounded border text-xs font-semibold ${
                  p === 1
                    ? 'bg-primary text-white border-primary'
                    : 'border-outline-variant hover:bg-surface-container-low'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Modal */}
      {validatingCylinder && (
        <ValidationModal
          cylinder={validatingCylinder}
          onClose={() => setValidatingCylinder(null)}
          onConfirm={handleConfirmValidation}
        />
      )}
    </div>
  )
}
