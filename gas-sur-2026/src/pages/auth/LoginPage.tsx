import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('client')


  const ROLE_DEST: Record<UserRole, string> = {
    admin: '/admin',
    driver: '/driver',
    client: '/client',
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(rut, password, selectedRole)
    navigate(ROLE_DEST[selectedRole])
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-12">
      {/* Left: Hero */}
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
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
              <Icon name="verified" className="text-primary-fixed-dim" />
              <span className="text-sm font-medium text-white">Certificación SEC</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
              <Icon name="local_shipping" className="text-primary-fixed-dim" />
              <span className="text-sm font-medium text-white">Entregas 24/7</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
              <Icon name="location_on" className="text-primary-fixed-dim" />
              <span className="text-sm font-medium text-white">Temuco · Araucanía</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Form */}
      <section className="col-span-1 md:col-span-5 flex flex-col justify-center items-center bg-surface p-6 md:p-10 min-h-screen">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-10 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="mode_fan" filled className="text-primary text-4xl" />
              <span className="text-primary font-black text-2xl tracking-tight">Gas del Sur</span>
            </div>
            <p className="text-on-surface-variant text-sm text-center md:text-left">
              Identidad regional, servicio de clase mundial.
            </p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-on-surface text-2xl font-bold mb-1">Bienvenido</h2>
            <p className="text-on-surface-variant text-base">
              Ingresa tus datos para gestionar tus pedidos y servicios.
            </p>
          </div>

          {/* Demo role picker */}
          <div className="mb-6 p-3 bg-primary-fixed/30 border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-on-primary-fixed mb-2 uppercase tracking-wider">
              Demo — Selecciona rol
            </p>
            <div className="flex gap-2">
              {(['client', 'driver', 'admin'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    selectedRole === role
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white/60 text-on-surface-variant hover:bg-white'
                  }`}
                >
                  {role === 'client' ? 'Cliente' : role === 'driver' ? 'Chofer' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* RUT */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 px-1 bg-surface text-xs font-semibold text-primary z-10">
                RUT del Titular
              </label>
              <div className="flex items-center border border-outline-variant rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Icon name="badge" className="px-3 text-on-surface-variant" />
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                  className="w-full py-4 bg-transparent outline-none text-on-surface text-sm tracking-wider placeholder:text-outline/50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <label className="absolute -top-2.5 left-3 px-1 bg-surface text-xs font-semibold text-on-surface-variant z-10 focus-within:text-primary">
                Contraseña
              </label>
              <div className="flex items-center border border-outline-variant rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <Icon name="lock" className="px-3 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            {/* Recovery link */}
            <div className="flex justify-end">
              <button type="button" className="text-primary text-sm font-medium hover:underline underline-offset-4">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full py-4 border border-primary text-primary font-semibold text-sm rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98]"
              >
                Crear Cuenta Nueva
              </button>
            </div>
          </form>

          {/* Mobile footer */}
          <div className="md:hidden pt-8 mt-6 border-t border-outline-variant">
            <p className="text-on-surface-variant text-xs text-center leading-relaxed">
              Gas del Sur provee soluciones energéticas en Temuco, Padre Las Casas y toda la
              región de la Araucanía con estándares de seguridad industrial.
            </p>
          </div>

          <footer className="mt-12 flex justify-center md:justify-start gap-6">
            <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm">
              <Icon name="support_agent" size={20} />
              Soporte
            </button>
            <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm">
              <Icon name="location_on" size={20} />
              Sucursales
            </button>
          </footer>
        </div>
      </section>

      {/* PWA install hint */}
      <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
        <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="install_mobile" className="text-primary-fixed-dim" />
            <span className="text-sm font-medium">Instalar Gas del Sur PWA</span>
          </div>
          <button className="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-semibold">
            Instalar
          </button>
        </div>
      </div>
    </main>
  )
}
