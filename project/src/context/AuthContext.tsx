import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { apiRequest, ApiError, setTokens, clearTokens } from '@/lib/api'

interface RawUser {
  id: string
  name: string
  rut: string
  email: string
  phone: string
  role: User['role']
  created_at: string
}
function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.name,
    rut: raw.rut,
    email: raw.email,
    phone: raw.phone,
    role: raw.role,
    createdAt: raw.created_at,
  }
}

interface AuthResponse {
  user: RawUser
  access: string
  refresh: string
}

interface AuthContextType {
  user: User | null
  login: (rut: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (data: {
    name: string
    rut: string
    email: string
    phone: string
    password: string
  }) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  updateSession: (data: Partial<User>) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('gds:session')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = async (rut: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!rut.trim()) return { ok: false, error: 'Ingresa tu RUT.' }
    if (!password.trim()) return { ok: false, error: 'Ingresa tu contraseña.' }

    try {
      // El backend acepta indistintamente 'rut' o 'email' en este campo.
      const data = await apiRequest<AuthResponse>('/auth/login/', {
        method: 'POST',
        auth: false,
        body: { rut, password },
      })
      const mapped = mapUser(data.user)
      setTokens(data.access, data.refresh)
      localStorage.setItem('gds:session', JSON.stringify(mapped))
      setUser(mapped)
      return { ok: true }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return { ok: false, error: 'RUT o contraseña incorrectos.' }
        return { ok: false, error: err.message }
      }
      return { ok: false, error: 'No se pudo conectar con el servidor.' }
    }
  }

  const register = async (data: {
    name: string
    rut: string
    email: string
    phone: string
    password: string
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await apiRequest<AuthResponse>('/auth/register/', {
        method: 'POST',
        auth: false,
        body: data,
      })
      const mapped = mapUser(res.user)
      setTokens(res.access, res.refresh)
      localStorage.setItem('gds:session', JSON.stringify(mapped))
      setUser(mapped)
      return { ok: true }
    } catch (err) {
      if (err instanceof ApiError) return { ok: false, error: err.message }
      return { ok: false, error: 'No se pudo conectar con el servidor.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gds:session')
    clearTokens()
  }

  // Actualiza los datos del usuario en sesión (p.ej. después de editar perfil)
  const updateSession = (data: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('gds:session', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateSession, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
