import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { useOrders, useUsers } from '@/lib/hooks'
import { UsersDB } from '@/lib/db'

export function AdminClientsPage() {
  const { orders } = useOrders()
  const { users, refresh } = useUsers()

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', rut: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clients = users.filter((u) => u.role === 'client')

  const clientStats = clients.map((client) => {
    const myOrders  = orders.filter((o) => o.clientId === client.id)
    const delivered = myOrders.filter((o) => ['Entregado','Finalizado'].includes(o.status))
    return {
      ...client,
      totalOrders: myOrders.length,
      totalSpent:  delivered.reduce((s, o) => s + o.total, 0),
      lastOrderAt: myOrders[0]?.createdAt ?? null,
    }
  }).sort((a, b) => b.totalOrders - a.totalOrders)

  const handleCreate = async () => {
    setError('')
    if (!form.name.trim())        return setError('El nombre es obligatorio.')
    if (!form.rut.trim())         return setError('El RUT es obligatorio.')
    if (!form.email.trim())       return setError('El email es obligatorio.')
    if (!form.phone.trim())       return setError('El teléfono es obligatorio.')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')

    if (UsersDB.findByRut(form.rut))
      return setError('Ya existe un usuario con ese RUT.')

    setLoading(true)
    try {
      const newUser = await UsersDB.create({ ...form, role: 'driver' })
      console.log('Usuario creado:', newUser)
      console.log('Todos los usuarios:', UsersDB.all())
      refresh()
      setShowModal(false)
      setForm({ name: '', rut: '', email: '', phone: '', password: '' })
    } catch (e) {
      console.error('Error al crear usuario:', e)
      setError('Ocurrió un error al crear el chofer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-on-surface">Clientes</h2>
          <p className="text-sm text-on-surface-variant mt-1">{clients.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition"
        >
          <Icon name="add" />
          Nuevo Chofer
        </button>
      </div>

      {/* Tabla clientes */}
      {clients.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center text-on-surface-variant">
          <Icon name="group" className="text-5xl mb-3 block mx-auto" />
          <p className="text-base font-bold text-on-surface">Sin clientes aún</p>
          <p className="text-sm mt-1">Los clientes aparecerán aquí cuando se registren en la app.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  {['Cliente','RUT','Teléfono','Pedidos','Gasto Total','Último Pedido'].map((h) => (
                    <th key={h} className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {clientStats.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {client.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{client.name}</p>
                          <p className="text-xs text-on-surface-variant">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant font-mono">{client.rut}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{client.phone}</td>
                    <td className="p-4 text-sm font-bold text-on-surface">{client.totalOrders}</td>
                    <td className="p-4 text-sm font-bold text-on-surface">
                      {client.totalSpent > 0 ? `$${client.totalSpent.toLocaleString('es-CL')}` : '—'}
                    </td>
                    <td className="p-4 text-xs text-on-surface-variant">
                      {client.lastOrderAt
                        ? new Date(client.lastOrderAt).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal nuevo chofer */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-on-surface">Nuevo Chofer</h3>
              <button onClick={() => { setShowModal(false); setError('') }}>
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            {[
              { label: 'Nombre completo', key: 'name',     type: 'text' },
              { label: 'RUT',             key: 'rut',      type: 'text',     placeholder: '12.345.678-9' },
              { label: 'Email',           key: 'email',    type: 'email' },
              { label: 'Teléfono',        key: 'phone',    type: 'tel',      placeholder: '+56 9 1234 5678' },
              { label: 'Contraseña',      key: 'password', type: 'password' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder ?? ''}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}

            {error && (
              <p className="text-sm text-error font-medium flex items-center gap-1">
                <Icon name="error" className="text-base" /> {error}
              </p>
            )}

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Chofer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}