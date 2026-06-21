import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { registerUser, ApiError } from '@/lib/api'

type Step = 'personal' | 'address' | 'password'

const COMUNAS = [
  'Temuco','Padre Las Casas','Labranza','Vilcún','Freire',
  'Lautaro','Villarrica','Cunco','Angol','Victoria',
]

// Formato RUT: 12.345.678-9
function formatRut(value: string) {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length <= 1) return clean
  const dv  = clean.slice(-1)
  const num = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${num}-${dv}`
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <label className="absolute -top-2.5 left-3 px-1 bg-surface text-xs font-semibold text-primary z-10">
        {label}
      </label>
      <div className="flex items-center border border-outline-variant rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <Icon name={icon} className="px-3 text-on-surface-variant shrink-0" />
        {children}
      </div>
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres',   ok: password.length >= 8 },
    { label: 'Una letra mayúscula',    ok: /[A-Z]/.test(password) },
    { label: 'Un número',              ok: /\d/.test(password) },
    { label: 'Un carácter especial',   ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const passed = checks.filter((c) => c.ok).length
  const strength = passed <= 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : 3
  const bar  = ['bg-outline-variant','bg-error','bg-tertiary-container','bg-primary']
  const lbl  = ['','Débil','Regular','Fuerte']
  const clr  = ['','text-error','text-tertiary','text-primary']

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < strength ? bar[strength] : 'bg-outline-variant'}`} />
        ))}
      </div>
      {password && <p className={`text-xs font-semibold ${clr[strength]}`}>{lbl[strength]}</p>}
      <div className="grid grid-cols-2 gap-1 pt-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <Icon name={c.ok ? 'check_circle' : 'radio_button_unchecked'} size={14}
              className={c.ok ? 'text-primary' : 'text-outline'} filled={c.ok} />
            <span className={`text-[11px] ${c.ok ? 'text-primary' : 'text-on-surface-variant'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('personal')
  const [loading, setLoading] = useState(false)

  // Campos
  const [name,            setName]            = useState('')
  const [rut,             setRut]             = useState('')
  const [email,           setEmail]           = useState('')
  const [phone,           setPhone]           = useState('')
  const [address,         setAddress]         = useState('')
  const [comuna,          setComuna]          = useState('Temuco')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [agreed,          setAgreed]          = useState(false)
  const [errors,          setErrors]          = useState<Record<string, string>>({})

  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'personal', label: 'Datos personales', icon: 'person' },
    { key: 'address',  label: 'Dirección',         icon: 'home_pin' },
    { key: 'password', label: 'Contraseña',        icon: 'lock' },
  ]
  const stepIndex = steps.findIndex((s) => s.key === step)

  const validatePersonal = () => {
    const e: Record<string,string> = {}
    if (!name.trim())  e.name  = 'El nombre es requerido.'
    if (!rut.trim())   e.rut   = 'El RUT es requerido.'
    if (!email.trim()) e.email = 'El correo es requerido.'
    if (!phone.trim()) e.phone = 'El teléfono es requerido.'
    return e
  }

  const validateAddress = () => {
    const e: Record<string,string> = {}
    if (!address.trim()) e.address = 'La dirección es requerida.'
    return e
  }

  const handleNext = () => {
    if (step === 'personal') {
      const e = validatePersonal()
      if (Object.keys(e).length) { setErrors(e); return }
      setErrors({})
      setStep('address')
    } else if (step === 'address') {
      const e = validateAddress()
      if (Object.keys(e).length) { setErrors(e); return }
      setErrors({})
      setStep('password')
    }
  }

  const handleBack = () => {
    setErrors({})
    if (step === 'password') setStep('address')
    else if (step === 'address') setStep('personal')
    else navigate('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Las contraseñas no coinciden.' })
      return
    }
    if (password.length < 8) {
      setErrors({ password: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }

    setLoading(true)
    try {
      await registerUser({
        name: name.trim(),
        rut: rut.trim(),
        email: email.trim().toLowerCase(),
        phone: `+56 9 ${phone.trim()}`,
        role: 'client',     // Los admins y choferes los crea el administrador
        password,
      })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Error al crear la cuenta. Intenta nuevamente.'
      setErrors({ general: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-background">
      {/* Hero */}
      <section
        className="hidden md:flex md:col-span-5 relative flex-col justify-end p-8 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,63,135,0.45), rgba(19,29,38,0.92)),
            url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Icon name="mode_fan" filled className="text-primary-fixed-dim text-4xl" />
            <span className="text-white font-black text-2xl tracking-tight">Gas del Sur</span>
          </div>
          <h1 className="text-white text-3xl font-black leading-tight mb-4">Únete a Gas del Sur</h1>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            Crea tu cuenta y accede a entregas rápidas, seguimiento en tiempo real y atención
            personalizada en toda la Araucanía.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: 'bolt',        text: 'Pedidos en menos de 45 minutos' },
              { icon: 'location_on', text: 'Seguimiento GPS en tiempo real' },
              { icon: 'verified',    text: 'Choferes certificados por la SEC' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <Icon name={item.icon} size={18} className="text-primary-fixed-dim" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="col-span-1 md:col-span-7 flex flex-col justify-center items-center bg-surface p-6 md:p-10 min-h-screen">
        <div className="w-full max-w-lg">
          <div className="md:hidden flex items-center gap-2 mb-8">
            <Icon name="mode_fan" filled className="text-primary text-3xl" />
            <span className="text-primary font-black text-xl tracking-tight">Gas del Sur</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-on-surface mb-1">Crear Cuenta</h2>
            <p className="text-sm text-on-surface-variant">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => navigate('/login')} className="text-primary font-semibold hover:underline underline-offset-4">
                Inicia sesión
              </button>
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    i < stepIndex
                      ? 'bg-primary border-primary text-white'
                      : i === stepIndex
                      ? 'bg-primary border-primary text-white shadow-md shadow-primary/30'
                      : 'bg-surface border-outline-variant text-on-surface-variant'
                  }`}>
                    {i < stepIndex ? <Icon name="check" size={18} /> : <Icon name={s.icon} size={18} />}
                  </div>
                  <span className={`text-[10px] font-semibold text-center ${i <= stepIndex ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-5 ${i < stepIndex ? 'bg-primary' : 'bg-outline-variant'}`} />
                )}
              </div>
            ))}
          </div>

          {errors.general && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-error-container/30 border border-error/30 rounded-lg">
              <Icon name="error" className="text-error shrink-0" size={18} />
              <p className="text-sm text-error">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PASO 1 */}
            {step === 'personal' && (
              <div className="space-y-5">
                <Field label="Nombre Completo" icon="person">
                  <input type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors({}) }}
                    placeholder="Juan Pérez González" required
                    className="w-full py-4 bg-transparent outline-none text-sm placeholder:text-outline/50" />
                </Field>
                {errors.name && <p className="text-xs text-error -mt-3">{errors.name}</p>}

                <Field label="RUT" icon="badge">
                  <input type="text" value={rut}
                    onChange={(e) => { setRut(formatRut(e.target.value)); setErrors({}) }}
                    placeholder="12.345.678-9" required maxLength={12}
                    className="w-full py-4 bg-transparent outline-none text-sm tracking-wider placeholder:text-outline/50" />
                </Field>
                {errors.rut && <p className="text-xs text-error -mt-3">{errors.rut}</p>}

                <Field label="Correo Electrónico" icon="email">
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                    placeholder="juan@correo.cl" required
                    className="w-full py-4 bg-transparent outline-none text-sm placeholder:text-outline/50" />
                </Field>
                {errors.email && <p className="text-xs text-error -mt-3">{errors.email}</p>}

                <Field label="Teléfono" icon="phone">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium text-on-surface-variant pr-2 border-r border-outline-variant">+56 9</span>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="8765 4321" required
                      className="flex-1 py-4 bg-transparent outline-none text-sm placeholder:text-outline/50" />
                  </div>
                </Field>
                {errors.phone && <p className="text-xs text-error -mt-3">{errors.phone}</p>}
              </div>
            )}

            {/* PASO 2 */}
            {step === 'address' && (
              <div className="space-y-5">
                <Field label="Dirección Principal" icon="home_pin">
                  <input type="text" value={address} onChange={(e) => { setAddress(e.target.value); setErrors({}) }}
                    placeholder="Av. Alemania 0945, Dpto 3" required
                    className="w-full py-4 bg-transparent outline-none text-sm placeholder:text-outline/50" />
                </Field>
                {errors.address && <p className="text-xs text-error -mt-3">{errors.address}</p>}

                <Field label="Ciudad / Comuna" icon="location_city">
                  <select value={comuna} onChange={(e) => setComuna(e.target.value)}
                    className="w-full py-4 bg-transparent outline-none text-sm text-on-surface">
                    {COMUNAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant flex items-start gap-3">
                  <Icon name="info" className="text-primary mt-0.5 shrink-0" size={18} />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Puedes agregar más direcciones de entrega desde tu perfil una vez creada la cuenta.
                  </p>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {step === 'password' && (
              <div className="space-y-5">
                <Field label="Contraseña" icon="lock">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                    placeholder="Mínimo 8 caracteres" required minLength={8}
                    autoComplete="new-password"
                    className="w-full py-4 bg-transparent outline-none text-sm placeholder:text-outline/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="px-3 text-on-surface-variant hover:text-primary transition-colors">
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                  </button>
                </Field>
                {errors.password && <p className="text-xs text-error -mt-3">{errors.password}</p>}

                <Field label="Confirmar Contraseña" icon="lock_reset">
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
                    placeholder="Repite tu contraseña" required
                    autoComplete="new-password"
                    className="w-full py-4 bg-transparent outline-none text-sm placeholder:text-outline/50" />
                </Field>
                {errors.confirmPassword && <p className="text-xs text-error -mt-3">{errors.confirmPassword}</p>}

                <PasswordStrength password={password} />

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="w-5 h-5 text-primary border-outline-variant rounded focus:ring-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-on-surface-variant leading-relaxed">
                    Acepto los{' '}
                    <span className="text-primary font-semibold">Términos de Servicio</span>
                    {' '}y la{' '}
                    <span className="text-primary font-semibold">Política de Privacidad</span>
                    {' '}de Gas del Sur.
                  </span>
                </label>
              </div>
            )}

            {/* Navegación */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleBack}
                className="flex-1 py-4 border border-outline-variant text-on-surface font-semibold text-sm rounded-lg hover:bg-surface-container-low transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <Icon name="arrow_back" size={18} />
                {step === 'personal' ? 'Iniciar Sesión' : 'Anterior'}
              </button>

              {step !== 'password' ? (
                <button type="button" onClick={handleNext}
                  className="flex-1 py-4 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  Siguiente <Icon name="arrow_forward" size={18} />
                </button>
              ) : (
                <button type="submit"
                  disabled={!agreed || password !== confirmPassword || loading}
                  className="flex-1 py-4 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading
                    ? <><Icon name="progress_activity" className="animate-spin" /> Creando…</>
                    : <><Icon name="how_to_reg" size={18} /> Crear Cuenta</>
                  }
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}