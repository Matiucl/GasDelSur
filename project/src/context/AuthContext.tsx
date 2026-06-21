import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { loginUser, logoutApi } from '@/lib/api'

interface AuthContextType {
  user: User | null
  login: (rut: string, password: string) => Promise<{ ok: boolean; error?: string }>
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
      const found = await loginUser(rut, password)
      setUser(found)
      localStorage.setItem('gds:session', JSON.stringify(found))
      return { ok: true }
    } catch {
      return { ok: false, error: 'RUT o contraseña incorrectos.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gds:session')
    logoutApi()
  }

  // Actualiza los datos del usuario en sesión (p.ej. después de editar perfil)
  const updateSession = (data: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('gds:session', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateSession, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}