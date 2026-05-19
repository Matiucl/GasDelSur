import { Icon } from '@/components/ui/Icon'

interface PlaceholderPageProps {
  title: string
  icon: string
}

export function PlaceholderPage({ title, icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 bg-primary-fixed rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <Icon name={icon} className="text-primary text-4xl" />
      </div>
      <h2 className="text-2xl font-black text-on-surface mb-2">{title}</h2>
      <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
        Esta sección está en construcción. Aquí irá la vista de{' '}
        <span className="font-semibold text-primary">{title}</span> conectada al backend con
        PostgreSQL + PostGIS.
      </p>
      <div className="mt-8 flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full border border-outline-variant">
        <div className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
        <span className="text-xs font-semibold text-on-surface-variant">Próximamente</span>
      </div>
    </div>
  )
}
