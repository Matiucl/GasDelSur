import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import { useStats, useUsers } from '@/lib/hooks'
import { UsersDB } from '@/lib/db'
import { useState } from 'react'
import type { UserRole } from '@/types'

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name,     setName]     = useState('')
  const [rut,      setRut]      = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [plate,    setPlate]    = useState('')
  const [role,     setRole]     = useState<UserRole>('driver')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const formatRut = (v: string) => {
    const c = v.replace(/[^0-9kK]/g, '').toUpperCase()
    if (c.length <= 1) return c
    return `${c.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}-${c.slice(-1)}`
  }

  const handleCreate = async () => {
    if (!name || !rut || !email || !password) { setError('Completa todos los campos requeridos.'); return }
    if (await UsersDB.findByRut(rut)) { setError('El RUT ya está registrado.'); return }
    if (await UsersDB.findByEmail(email)) { setError('El correo ya está en uso.'); return }
    setLoading(true)
    try {
      await UsersDB.create({ name, rut, email, phone: `+56 9 ${phone}`, role, password })
      onCreated()
      onClose()
    } catch {
      setError('Error al crear el usuario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface">Nuevo Usuario</h3>
          <button onClick={onClose}><Icon name="close" className="text-on-surface-variant" /></button>
        </div>

        {/* Rol */}
        <div className="flex gap-2">
          {(['driver','admin'] as UserRole[]).map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${role === r ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:border-primary'}`}>
              {r === 'driver' ? 'Chofer' : 'Administrador'}
            </button>
          ))}
        </div>

        {[
          { label: 'Nombre completo', value: name,     set: setName,     type: 'text',     placeholder: 'Luis González' },
          { label: 'RUT',             value: rut,      set: (v: string) => setRut(formatRut(v)), type: 'text', placeholder: '12.345.678-9' },
          { label: 'Correo',          value: email,    set: setEmail,    type: 'email',    placeholder: 'correo@gas.cl' },
          { label: 'Teléfono (+56 9)',value: phone,    set: setPhone,    type: 'tel',      placeholder: '9000 0001' },
          ...(role === 'driver' ? [{ label: 'Patente del vehículo', value: plate, set: setPlate, type: 'text', placeholder: 'AB-12-CD' }] : []),
          { label: 'Contraseña temporal', value: password, set: setPassword, type: 'password', placeholder: 'Mínimo 8 caracteres' },
        ].map((f) => (
          <div key={f.label}>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">{f.label}</label>
            <input type={f.type} value={f.value} onChange={(e) => (f.set as (v: string) => void)(e.target.value)}
              placeholder={f.placeholder}
              className="w-full h-11 px-4 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
        ))}

        {error && <p className="text-xs text-error">{error}</p>}

        <button onClick={handleCreate} disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-60">
          {loading ? 'Creando…' : 'Crear Usuario'}
        </button>
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  const { user, logout } = useAuth()
  const { stats } = useStats()
  const { users, refresh } = useUsers()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const drivers = users.filter((u) => u.role === 'driver')
  const admins  = users.filter((u) => u.role === 'admin')
  const clients = users.filter((u) => u.role === 'client')

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Ajustes del Sistema</h2>
          <p className="text-sm text-on-surface-variant mt-1">Configuración y gestión de usuarios</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md hover:brightness-110 transition-all">
          <Icon name="person_add" /> Nuevo Usuario
        </button>
      </div>

      {/* Admin */}
      <div className="bg-primary-container text-white p-6 rounded-2xl flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
          <Icon name="admin_panel_settings" className="text-5xl" />
        </div>
        <div>
          <p className="text-xl font-black">{user?.name}</p>
          <p className="text-sm opacity-80 mt-0.5">Administrador Gas del Sur</p>
          <p className="text-xs opacity-70 mt-1">{user?.email} · {user?.rut}</p>
        </div>
      </div>

      {/* Métricas del sistema */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="bar_chart" className="text-primary" /> Métricas del Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pedidos Totales',   value: stats.totalOrders },
            { label: 'Pedidos Hoy',       value: stats.todayOrders },
            { label: 'Choferes Activos',  value: drivers.length },
            { label: 'Clientes Registrados', value: clients.length },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container p-3 rounded-lg">
              <p className="text-xs text-on-surface-variant">{s.label}</p>
              <p className="text-2xl font-black text-on-surface">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Usuarios del sistema */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <div className="p-5 border-b border-outline-variant flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Icon name="group" className="text-primary" /> Usuarios del Sistema
          </h3>
          <span className="text-xs text-on-surface-variant">{users.length} usuarios registrados</span>
        </div>
        {users.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <Icon name="person_off" className="text-4xl mb-2 block mx-auto" />
            <p className="text-sm">No hay usuarios aún. Crea el primer usuario del sistema.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                {['Usuario','RUT','Correo','Rol','Creado'].map((h) => (
                  <th key={h} className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {u.name[0]}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-on-surface-variant font-mono">{u.rut}</td>
                  <td className="p-4 text-sm text-on-surface-variant">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      u.role === 'admin'  ? 'bg-secondary-container text-white' :
                      u.role === 'driver' ? 'bg-primary-container text-white' :
                      'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : u.role === 'driver' ? 'Chofer' : 'Cliente'}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-on-surface-variant">
                    {new Date(u.createdAt).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Excepciones MPN */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <Icon name="warning" className="text-error" /> Protocolo de Excepciones MPN
        </h3>
        {[
          { code: 'E1', name: 'Falla de Trazabilidad',     desc: 'Envase no apto → venta de cilindro nuevo' },
          { code: 'E2', name: 'Envase Manipulado',          desc: 'Bloquea intercambio, notifica SEC' },
          { code: 'E3', name: 'Quiebre de Stock Móvil',    desc: 'Traspaso si flota > 1 vehículo' },
          { code: 'E4', name: 'Rechazo de Medio de Pago',  desc: 'Activa link de pago remoto' },
          { code: 'E5', name: 'Inaccesibilidad Geográfica', desc: 'Punto de encuentro alternativo' },
          { code: 'E6', name: 'Error de Capacidad',         desc: 'Ajuste dinámico de precio/inventario' },
          { code: 'E7', name: 'Ausencia del Receptor',      desc: 'Reprogramación automática (máx 2/día)' },
          { code: 'E8', name: 'ID Cilindro Ilegible',       desc: 'Foto + conciliación manual en bodega' },
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

      {/* Info personal */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
        {[
          { icon: 'email',         label: 'Correo',   value: user?.email },
          { icon: 'phone',         label: 'Teléfono', value: user?.phone },
          { icon: 'badge',         label: 'RUT',      value: user?.rut },
          { icon: 'location_city', label: 'Región',   value: 'Araucanía, Chile' },
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

      <button onClick={handleLogout}
        className="w-full py-4 border-2 border-error text-error rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/20 transition-colors">
        <Icon name="logout" /> Cerrar Sesión
      </button>

      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={refresh} />
      )}
    </div>
  )
}
