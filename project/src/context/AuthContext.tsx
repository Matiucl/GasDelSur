import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import { UsersDB, seedIfEmpty } from '@/lib/db'

interface AuthContextType {
  user: User | null
  login: (rut: string, password: string, role?: UserRole) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Credenciales demo para selector de roles
const DEMO_CREDS: Record<UserRole, { rut: string }> = {
  admin:  { rut: '76.543.210-K' },
  driver: { rut: '12.345.678-9' },
  client: { rut: '15.234.567-8' },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('gds:session')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  useEffect(() => {
    seedIfEmpty()
  }, [])

  const login = (_rut: string, _password: string, role: UserRole = 'client'): boolean => {
    // En modo demo: cualquier contraseña funciona; usamos el RUT del rol elegido
    const demoRut = DEMO_CREDS[role].rut
    const found = UsersDB.findByRut(demoRut)
    if (found) {
      setUser(found)
      localStorage.setItem('gds:session', JSON.stringify(found))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('gds:session')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
