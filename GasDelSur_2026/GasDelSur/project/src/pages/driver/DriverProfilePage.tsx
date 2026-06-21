import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import { useOrders } from '@/lib/hooks'
import { UsersDB } from '@/lib/db'

export function DriverProfilePage() {
  const { user, logout, updateSession } = useAuth()
  const { orders } = useOrders()
  const navigate   = useNavigate()

  const [editMode, setEditMode] = useState(false)
  const [phone,    setPhone]    = useState(user?.phone?.replace('+56 9 ','') ?? '')
  const [saving,   setSaving]   = useState(false)

  const myOrders  = orders.filter((o) => o.driverId === user?.id)
  const delivered = myOrders.filter((o) => ['Entregado','Finalizado'].includes(o.status)).length
  const total     = myOrders
    .filter((o) => ['Entregado','Finalizado'].includes(o.status))
    .reduce((s, o) => s + o.total, 0)

  const handleLogout = () => { logout(); navigate('/login') }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await UsersDB.update(user.id, { phone: `+56 9 ${phone.trim()}` })
      if (updated) updateSession({ phone: updated.phone })
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[600px] mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-on-surface">Mi Perfil</h2>
        {!editMode && (
          <button onClick={() => setEditMode(true)}
            className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
            <Icon name="edit" size={16} /> Editar
          </button>
        )}
      </div>

      <div className="bg-primary-container text-white p-6 rounded-2xl flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-black">
          {user?.name?.[0] ?? '?'}
        </div>
        <div>
          <p className="text-xl font-black">{user?.name}</p>
          <p className="text-sm opacity-80 mt-0.5">Chofer Certificado · SEC</p>
          <p className="text-xs opacity-70 mt-1">RUT: {user?.rut}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <Icon name="check_circle" className="text-primary mb-2" />
          <p className="text-2xl font-black text-on-surface">{delivered}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Entregas Completadas</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <Icon name="payments" className="text-primary mb-2" />
          <p className="text-2xl font-black text-on-surface">${total.toLocaleString('es-CL')}</p>
          <p className="text-xs font-semibold text-on-surface-variant">Total Cobrado</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-on-surface">Datos de la Cuenta</h3>
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Teléfono</label>
              <div className="flex gap-2">
                <div className="h-11 px-3 border border-outline-variant rounded-lg bg-surface-container flex items-center text-sm text-on-surface-variant">+56 9</div>
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 h-11 px-4 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditMode(false)}
                className="flex-1 py-2.5 border border-outline-variant text-on-surface rounded-lg text-sm font-semibold">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {[
              { icon: 'person',   label: 'Nombre',    value: user?.name },
              { icon: 'email',    label: 'Correo',    value: user?.email },
              { icon: 'phone',    label: 'Teléfono',  value: user?.phone },
              { icon: 'badge',    label: 'RUT',       value: user?.rut },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 py-3">
                <Icon name={item.icon} className="text-on-surface-variant" />
                <div className="flex-1">
                  <p className="text-xs text-on-surface-variant">{item.label}</p>
                  <p className="text-sm font-semibold text-on-surface">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleLogout}
        className="w-full py-4 border-2 border-error text-error rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-error-container/20 transition-colors">
        <Icon name="logout" /> Cerrar Sesión
      </button>
    </div>
  )
}
