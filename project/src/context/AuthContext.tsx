import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '@/types'
import { UsersDB, verifyPassword } from '@/lib/db'

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

    const found = UsersDB.findByRut(rut)
    if (!found) return { ok: false, error: 'RUT no registrado.' }

    const valid = await verifyPassword(password, found.passwordHash)
    if (!valid) return { ok: false, error: 'Contraseña incorrecta.' }

    setUser(found)
    localStorage.setItem('gds:session', JSON.stringify(found))
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gds:session')
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
