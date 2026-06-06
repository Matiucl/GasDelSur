import { Icon } from '@/components/ui/Icon'
import { useOrders } from '@/lib/hooks'

export function AdminClientsPage() {
  const { orders } = useOrders()

  // Agrupar por clientName (simulación sin tabla Users separada)
  const clientMap = new Map<string, { phone: string; orders: number; total: number; lastOrder: string }>()
  orders.forEach((o) => {
    const existing = clientMap.get(o.clientName)
    if (existing) {
      existing.orders++
      existing.total += ['Entregado','Finalizado'].includes(o.status) ? o.total : 0
      if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt
    } else {
      clientMap.set(o.clientName, {
        phone: o.clientPhone,
        orders: 1,
        total: ['Entregado','Finalizado'].includes(o.status) ? o.total : 0,
        lastOrder: o.createdAt,
      })
    }
  })
  const clients = Array.from(clientMap.entries()).sort((a, b) => b[1].orders - a[1].orders)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-on-surface">Clientes</h2>
        <p className="text-sm text-on-surface-variant mt-1">{clients.length} clientes registrados</p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              {['Cliente','Teléfono','Pedidos','Gasto Total','Último Pedido'].map((h) => (
                <th key={h} className="p-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {clients.map(([name, data]) => (
              <tr key={name} className="hover:bg-surface-container-low transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold">
                      {name[0]}
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-on-surface-variant">{data.phone}</td>
                <td className="p-4 text-sm font-bold text-on-surface">{data.orders}</td>
                <td className="p-4 text-sm font-bold text-on-surface">${data.total.toLocaleString('es-CL')}</td>
                <td className="p-4 text-xs text-on-surface-variant">
                  {new Date(data.lastOrder).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant">
            <Icon name="group" className="text-4xl mb-2 block mx-auto" />
            <p className="text-sm">Sin clientes aún</p>
          </div>
        )}
      </div>
    </div>
  )
}
