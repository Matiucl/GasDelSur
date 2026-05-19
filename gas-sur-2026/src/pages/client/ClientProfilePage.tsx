import { Icon } from '@/components/ui/Icon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MapView } from '@/components/map/MapView'
import { MOCK_ORDERS } from '@/lib/mockData'
import { useAuth } from '@/context/AuthContext'

export function ClientProfilePage() {
  const { user } = useAuth()
  const clientOrders = MOCK_ORDERS.slice(0, 3)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile card */}
        <section className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="person" className="text-primary" />
              <h2 className="text-lg font-bold text-on-surface">Perfil del Usuario</h2>
            </div>
            <button className="flex items-center gap-2 text-primary hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors text-sm">
              <Icon name="edit" size={18} />
              Editar
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Nombre Completo', value: user?.name ?? 'Ana Pérez' },
              { label: 'Correo Electrónico', value: user?.email ?? 'ana.perez@gmail.com' },
              { label: 'RUT', value: user?.rut ?? '15.234.567-8', mono: true },
              { label: 'Teléfono', value: user?.phone ?? '+56 9 8765 4321' },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {field.label}
                </label>
                <div className={`text-sm border-b border-outline-variant py-2 ${field.mono ? 'font-mono tracking-wider' : ''}`}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Addresses */}
        <section className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon name="home_pin" className="text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Direcciones</h2>
              </div>
              <button className="text-primary hover:bg-primary/5 p-1 rounded-full">
                <Icon name="add_location" />
              </button>
            </div>
            <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary block">Predeterminada</span>
                <span className="text-sm font-bold text-on-surface">Av. Alemania 0945, Temuco</span>
              </div>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </div>
          </div>
          <div className="h-48 w-full relative">
            <MapView
              center={[-72.5904, -38.7359]}
              zoom={14}
              markers={[{ lat: -38.7359, lng: -72.5904, label: 'Av. Alemania 0945' }]}
              className="w-full h-full"
              interactive={false}
            />
          </div>
        </section>
      </div>

      {/* Orders + Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order history */}
        <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Icon name="history" className="text-primary" />
              <h2 className="text-lg font-bold text-on-surface">Historial de Pedidos</h2>
            </div>
            <button className="text-sm text-primary font-medium hover:underline">Ver todo</button>
          </div>
          <div className="flex flex-col gap-3">
            {clientOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between p-4 bg-background border border-outline-variant rounded-lg hover:border-primary transition-colors cursor-pointer gap-3"
              >
                <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    order.status === 'Cancelado' ? 'bg-surface-variant' : 'bg-primary-container'
                  }`}>
                    <Icon
                      name="local_gas_station"
                      className={order.status === 'Cancelado' ? 'text-on-surface-variant text-[18px]' : 'text-white text-[18px]'}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{order.product} x{order.quantity}</p>
                    <p className="text-xs text-on-surface-variant">
                      {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className={`text-sm font-bold ${order.status === 'Cancelado' ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                    ${order.total.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment methods */}
        <section className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Icon name="credit_card" className="text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Métodos de Pago</h2>
          </div>
          {/* Card visual */}
          <div className="relative overflow-hidden group">
            <div className="bg-gradient-to-br from-primary to-primary-container text-white p-4 rounded-xl flex flex-col justify-between h-32 shadow-md">
              <div className="flex justify-between items-start">
                <Icon name="contactless" className="text-3xl" />
                <span className="text-sm font-medium">Visa</span>
              </div>
              <div>
                <p className="text-lg font-bold tracking-[0.15em]">•••• •••• •••• 5678</p>
                <div className="flex justify-between items-end mt-1">
                  <span className="text-xs uppercase opacity-80">{user?.name?.toUpperCase() ?? 'ANA PÉREZ'}</span>
                  <span className="text-xs">08/26</span>
                </div>
              </div>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary hover:border-primary transition-all text-sm font-medium">
            <Icon name="add_circle" />
            Agregar Nueva Tarjeta
          </button>
          <div className="mt-auto pt-4 border-t border-outline-variant">
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Icon name="security" />
              <span className="text-xs">Tus datos están protegidos con encriptación industrial.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
