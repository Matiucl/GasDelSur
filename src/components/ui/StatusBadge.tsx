import type { OrderStatus } from '@/types'

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  Solicitado: { label: 'Solicitado', className: 'bg-surface-container-high text-on-surface-variant border border-outline-variant' },
  Asignado: { label: 'Asignado', className: 'bg-primary-fixed text-on-primary-fixed border border-primary/20' },
  'En Ruta': { label: 'En Ruta', className: 'bg-primary-container text-on-primary text-white border border-primary/30' },
  'En Punto de Entrega': { label: 'En Punto', className: 'bg-tertiary-container text-on-tertiary border border-tertiary/30' },
  'En Validación': { label: 'Validando', className: 'bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/20' },
  Entregado: { label: 'Entregado', className: 'bg-surface-container-high text-primary border border-primary/20' },
  Finalizado: { label: 'Finalizado', className: 'bg-primary-fixed-dim text-on-primary-fixed border border-primary/30' },
  Fallido: { label: 'Fallido', className: 'bg-error-container text-error border border-error/30' },
  Cancelado: { label: 'Cancelado', className: 'bg-error/5 text-error border border-error/40' },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}
