import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useOrders, useUsers } from '@/lib/hooks'

export function AdminClientsPage() {
  const navigate  = useNavigate()
  const { orders } = useOrders()
  const { users }  = useUsers()

  // Clientes registrados en el sistema
  const clients = users.filter((u) => u.role === 'client')

  // Estadísticas por cliente a partir de sus pedidos
  const clientStats = clients.map((client) => {
    const myOrders  = orders.filter((o) => o.clientId === client.id)
    const delivered = myOrders.filter((o) => ['Entregado','Finalizado'].includes(o.status))
    return {
      ...client,
      totalOrders:  myOrders.length,
      totalSpent:   delivered.reduce((s, o) => s + o.total, 0),
      lastOrderAt:  myOrders[0]?.createdAt ?? null,
    }
  }).sort((a, b) => b.totalOrders - a.totalOrders)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">Clientes</h2>
        <p className="text-sm text-on-surface-variant mt-1">{clients.length} clientes registrados</p>
      </div>

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
    </div>
  )
}
