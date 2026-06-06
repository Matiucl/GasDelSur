import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import { useStats } from '@/lib/hooks'
import { resetDB } from '@/lib/db'

export function AdminSettingsPage() {
  const { user, logout } = useAuth()
  const { stats, refresh } = useStats()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const handleReset = () => {
    if (confirm('¿Resetear todos los datos demo? Esto restaura pedidos y cilindros iniciales.')) {
      resetDB()
      refresh()
      alert('✅ Datos restaurados correctamente.')
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[700px] mx-auto">
      <h2 className="text-2xl font-black text-on-surface">Ajustes del Sistema</h2>

      {/* Admin card */}
      <div className="bg-primary-container text-white p-6 rounded-2xl flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
          <Icon name="admin_panel_settings" className="text-5xl" />
        </div>
        <div>
          <p className="text-xl font-black">{user?.name}</p>
          <p className="text-sm opacity-80 mt-0.5">Administrador Gas del Sur</p>
          <p className="text-xs opacity-70 mt-1">RUT: {user?.rut}</p>
        </div>
      </div>

      {/* Stats DB */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="database" className="text-primary" /> Estado de la Base de Datos (localStorage)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total Pedidos', value: stats.totalOrders },
            { label: 'Pedidos Hoy',   value: stats.todayOrders },
            { label: 'Activos',       value: stats.active },
            { label: 'Entregados',    value: stats.delivered },
            { label: 'Fallidos',      value: stats.failed },
            { label: 'IDs Ilegibles', value: stats.illegibleCylinders },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container p-3 rounded-lg">
              <p className="text-xs text-on-surface-variant">{s.label}</p>
              <p className="text-xl font-black text-on-surface">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container p-3 rounded-lg">
          <Icon name="info" size={16} />
          Los datos se almacenan en <code className="font-mono bg-outline-variant/30 px-1 rounded">localStorage</code>. La estructura está lista para migrar a PostgreSQL + PostGIS.
        </div>
      </div>

      {/* Excepciones MPN */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="warning" className="text-error" /> Protocolo de Excepciones MPN
        </h3>
        {[
          { code: 'E1', name: 'Falla de Trazabilidad',    desc: 'Envase no apto → venta de cilindro nuevo' },
          { code: 'E2', name: 'Envase Manipulado',         desc: 'Bloquea intercambio, notifica SEC' },
          { code: 'E3', name: 'Quiebre de Stock Móvil',   desc: 'Traspaso si flota > 1 vehículo' },
          { code: 'E4', name: 'Rechazo de Medio de Pago', desc: 'Activa link de pago remoto' },
          { code: 'E5', name: 'Inaccesibilidad Geográfica',desc: 'Punto de encuentro alternativo' },
          { code: 'E6', name: 'Error de Capacidad',        desc: 'Ajuste dinámico de precio/inventario' },
          { code: 'E7', name: 'Ausencia del Receptor',     desc: 'Reprogramación automática (máx 2/día)' },
          { code: 'E8', name: 'ID Cilindro Ilegible',      desc: 'Foto + conciliación manual en bodega' },
        ].map((e) => (
          <div key={e.code} className="flex items-start gap-3 p-3 bg-surface-container rounded-lg">
            <span className="font-mono text-xs font-black text-primary bg-primary-fixed/30 px-2 py-1 rounded shrink-0">{e.code}</span>
            <div>
              <p className="text-sm font-bold text-on-surface">{e.name}</p>
              <p className="text-xs text-on-surface-variant">{e.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info contacto */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
        {[
          { icon: 'email',   label: 'Correo',   value: user?.email },
          { icon: 'phone',   label: 'Teléfono', value: user?.phone },
          { icon: 'badge',   label: 'RUT',      value: user?.rut },
          { icon: 'location_city', label: 'Región', value: 'Araucanía, Chile' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 p-4">
            <Icon name={item.icon} className="text-on-surface-variant" />
            <div className="flex-1">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="text-sm font-semibold text-on-surface">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleReset}
        className="w-full py-3 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors"
      >
        <Icon name="refresh" /> Resetear datos demo
      </button>

      <button
        onClick={handleLogout}
        className="w-full py-4 border-2 border-error text-error rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/20 transition-colors"
      >
        <Icon name="logout" /> Cerrar Sesión
      </button>
    </div>
  )
}
