import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

const ROLE_DEMO: Record<UserRole, { rut: string; label: string; desc: string; icon: string }> = {
  client: { rut: '15.234.567-8', label: 'Cliente',       desc: 'Pedir y rastrear gas',          icon: 'person' },
  driver: { rut: '12.345.678-9', label: 'Chofer',         desc: 'Gestionar entregas del día',    icon: 'local_shipping' },
  admin:  { rut: '76.543.210-K', label: 'Administrador',  desc: 'Control total del sistema',     icon: 'admin_panel_settings' },
}

const ROLE_DEST: Record<UserRole, string> = {
  admin: '/admin', driver: '/driver', client: '/client',
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole>('client')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const demo = ROLE_DEMO[selectedRole]

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = login(demo.rut, password || 'demo', selectedRole)
    if (ok) {
      navigate(ROLE_DEST[selectedRole])
    } else {
      setError('No se pudo autenticar. Intenta de nuevo.')
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-12">
      {/* Hero */}
      <section
        className="hidden md:flex md:col-span-7 relative flex-col justify-end p-8 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,63,135,0.45), rgba(19,29,38,0.92)),
            url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-lg">
          <h1 className="text-white text-4xl font-black tracking-tight leading-tight mb-4">
            Energía confiable para el corazón de la Araucanía.
          </h1>
          <p className="text-white/90 text-lg mb-8 leading-relaxed">
            Desde Temuco a cada rincón de la región, Gas del Sur garantiza el calor y la
            eficiencia que tu hogar y empresa necesitan.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { icon: 'verified',       label: 'Certificación SEC' },
              { icon: 'local_shipping', label: 'Entregas 24/7' },
              { icon: 'location_on',    label: 'Temuco · Araucanía' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Icon name={b.icon} className="text-primary-fixed-dim" />
                <span className="text-sm font-medium text-white">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="col-span-1 md:col-span-5 flex flex-col justify-center items-center bg-surface p-6 md:p-10 min-h-screen">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-10 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="mode_fan" filled className="text-primary text-4xl" />
              <span className="text-primary font-black text-2xl tracking-tight">Gas del Sur</span>
            </div>
            <p className="text-on-surface-variant text-sm">Identidad regional, servicio de clase mundial.</p>
          </div>

          <div className="mb-8">
            <h2 className="text-on-surface text-2xl font-bold mb-1">Bienvenido</h2>
            <p className="text-on-surface-variant text-sm">Selecciona tu rol para ingresar al sistema demo.</p>
          </div>

          {/* Role picker */}
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Modo Demo — Elige tu rol
            </p>
            {(Object.entries(ROLE_DEMO) as [UserRole, typeof ROLE_DEMO[UserRole]][]).map(([role, info]) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all text-left ${
                  selectedRole === role
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant hover:border-primary/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedRole === role ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
                  <Icon name={info.icon} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${selectedRole === role ? 'text-primary' : 'text-on-surface'}`}>{info.label}</p>
                  <p className="text-xs text-on-surface-variant">{info.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedRole === role ? 'border-primary bg-primary' : 'border-outline-variant'}`}>
                  {selectedRole === role && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {/* Credencial demo */}
          <div className="mb-5 p-3 bg-primary-fixed/20 border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Credencial demo:</p>
            <p className="text-sm font-mono text-primary font-bold">RUT: {demo.rut}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Contraseña: cualquier valor</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="relative">
              <label className="absolute -top-2.5 left-3 px-1 bg-surface text-xs font-semibold text-primary z-10">Contraseña</label>
              <div className="flex items-center border border-outline-variant rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Icon name="lock" className="px-3 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-4 bg-transparent outline-none text-on-surface text-sm placeholder:text-outline/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-on-surface-variant hover:text-primary">
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-error flex items-center gap-2">
                <Icon name="error" size={16} /> {error}
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button type="submit" className="w-full py-4 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all active:scale-[0.98]">
                Ingresar como {ROLE_DEMO[selectedRole].label}
              </button>
              <button type="button" onClick={() => navigate('/register')} className="w-full py-4 border border-primary text-primary font-semibold text-sm rounded-lg hover:bg-surface-container-low transition-all">
                Crear Cuenta Nueva
              </button>
            </div>
          </form>

          <footer className="mt-10 flex justify-center md:justify-start gap-6">
            {[
              { icon: 'support_agent', label: 'Soporte' },
              { icon: 'location_on',   label: 'Sucursales' },
            ].map((f) => (
              <button key={f.label} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm">
                <Icon name={f.icon} size={20} /> {f.label}
              </button>
            ))}
          </footer>
        </div>
      </section>
    </main>
  )
}
