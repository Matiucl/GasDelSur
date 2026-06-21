import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

const ROLES: { role: UserRole; label: string; desc: string; icon: string }[] = [
  { role: 'client', label: 'Cliente',        desc: 'Pedir y rastrear gas',        icon: 'person'              },
  { role: 'driver', label: 'Chofer',          desc: 'Gestionar mis entregas',      icon: 'local_shipping'      },
  { role: 'admin',  label: 'Administrador',   desc: 'Control del sistema',         icon: 'admin_panel_settings'},
]

const formatRut = (value: string) => {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length <= 1) return clean
  const dv  = clean.slice(-1)
  const num = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${num}-${dv}`
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [selectedRole,  setSelectedRole]  = useState<UserRole>('client')
  const [rut,           setRut]           = useState('')
  const [password,      setPassword]      = useState('')
  const [showPassword,  setShowPassword]  = useState(false)
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(rut, password)
    setLoading(false)

    if (!result.ok) {
      setError(result.error ?? 'Error al iniciar sesión.')
      return
    }

    // La redirección la decide el rol guardado en la DB, no el selector
    // El selector solo ayuda al usuario a ubicarse visualmente
    const saved = localStorage.getItem('gds:session')
    const u = saved ? JSON.parse(saved) : null
    if (u?.role === 'admin')       navigate('/admin')
    else if (u?.role === 'driver') navigate('/driver')
    else                           navigate('/client')
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
          <div className="flex flex-wrap gap-3">
            {[
              { icon: 'verified',       label: 'Certificación SEC'    },
              { icon: 'local_shipping', label: 'Entregas a domicilio' },
              { icon: 'location_on',    label: 'Temuco · Araucanía'   },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <Icon name={b.icon} className="text-primary-fixed-dim" />
                <span className="text-sm font-medium text-white">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="col-span-1 md:col-span-5 flex flex-col justify-center items-center bg-surface p-6 md:p-10 min-h-screen">
        <div className="w-full max-w-md">
          {/* Marca */}
          <div className="mb-8 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="mode_fan" filled className="text-primary text-4xl" />
              <span className="text-primary font-black text-2xl tracking-tight">Gas del Sur</span>
            </div>
            <p className="text-on-surface-variant text-sm">Sistema de gestión de distribución</p>
          </div>

          {/* Selector de rol */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              ¿Cómo ingresas?
            </p>
            <div className="flex flex-col gap-2">
              {ROLES.map(({ role, label, desc, icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setSelectedRole(role); setError('') }}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all ${
                    selectedRole === role
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant hover:border-primary/40'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                    selectedRole === role ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    <Icon name={icon} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${selectedRole === role ? 'text-primary' : 'text-on-surface'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-on-surface-variant">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selectedRole === role ? 'border-primary bg-primary' : 'border-outline-variant'
                  }`}>
                    {selectedRole === role && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* RUT */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 px-1 bg-surface text-xs font-semibold text-primary z-10">
                RUT
              </label>
              <div className={`flex items-center border rounded-lg focus-within:ring-1 transition-all ${
                error ? 'border-error focus-within:ring-error' : 'border-outline-variant focus-within:border-primary focus-within:ring-primary'
              }`}>
                <Icon name="badge" className="px-3 text-on-surface-variant" />
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => { setRut(formatRut(e.target.value)); setError('') }}
                  placeholder="12.345.678-9"
                  maxLength={12}
                  required
                  autoComplete="username"
                  className="w-full py-4 bg-transparent outline-none text-on-surface text-sm tracking-wider placeholder:text-outline/50"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 px-1 bg-surface text-xs font-semibold text-on-surface-variant z-10">
                Contraseña
              </label>
              <div className={`flex items-center border rounded-lg focus-within:ring-1 transition-all ${
                error ? 'border-error focus-within:ring-error' : 'border-outline-variant focus-within:border-primary focus-within:ring-primary'
              }`}>
                <Icon name="lock" className="px-3 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full py-4 bg-transparent outline-none text-on-surface text-sm placeholder:text-outline/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-container/30 border border-error/30 rounded-lg">
                <Icon name="error" className="text-error shrink-0" size={18} />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Icon name="progress_activity" className="animate-spin" /> Verificando…</>
                  : `Ingresar como ${ROLES.find(r => r.role === selectedRole)?.label}`
                }
              </button>

              {/* Solo el cliente puede auto-registrarse */}
              {selectedRole === 'client' && (
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full py-4 border border-primary text-primary font-semibold text-sm rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98]"
                >
                  Crear Cuenta de Cliente
                </button>
              )}

              {/* Mensaje informativo para roles internos */}
              {selectedRole !== 'client' && (
                <p className="text-xs text-center text-on-surface-variant">
                  {selectedRole === 'driver'
                    ? 'Las cuentas de choferes son creadas por el administrador.'
                    : 'Las cuentas de administrador son gestionadas internamente.'}
                </p>
              )}
            </div>
          </form>

          <footer className="mt-10 flex justify-center md:justify-start gap-6">
            {[
              { icon: 'support_agent', label: 'Soporte'     },
              { icon: 'location_on',   label: 'Sucursales'  },
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